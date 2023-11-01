const fs = require("fs")
const chalk = require("chalk")
const luamin = require("../../utility/luamin")
const binary = require("../../utility/binary")
const emulation = require("./emulation")
const opcodes = {}

// actual ironbrew reskin wtf, internally the exact same

fs.readdirSync("./obfuscators/moonsec/opcodes").forEach(opcode => {
    opcodes[opcode.split(".")[0]] = require(`./opcodes/${opcode}`)
})

function createN(n) {
    return {
        Type: "NumberLiteral",
        Token: {
            Type: "Number",
            LeadingWhite: " ",
            Source: String(n)
        },
        GetFirstToken: () => {},
        GetLastToken: () => {}
    }
}

function createV(n, o) {
    return {
        Type: "VariableExpr",
        Token: {
            Type: "Ident",
            LeadingWhite: "",
            Source: n,
        },
        GetFirstToken: o ? o.GetFirstToken : () => {},
        GetLastToken: o ? o.GetLastToken : () => {}
    }
}

function solvebinop(b, vars) { // what the fcjk (should solve wihtin two passes)
    let lhs = b.Lhs
    let rhs = b.Rhs
    let operator = b.Token_Op.Source

    if (lhs.Type == "ParenExpr") lhs = lhs.Expression
    if (rhs.Type == "ParenExpr") rhs = rhs.Expression

    if (lhs.Type == "BinopExpr") lhs = solvebinop(lhs, vars)
    if (rhs.Type == "BinopExpr") rhs = solvebinop(rhs, vars)

    if (lhs.Type == "VariableExpr") lhs = vars[lhs.Variable.Name]
    if (rhs.Type == "VariableExpr") rhs = vars[rhs.Variable.Name]

    if (lhs.Type == "NumberLiteral") lhs = parseInt(lhs.Token.Source)
    if (rhs.Type == "NumberLiteral") rhs = parseInt(rhs.Token.Source)

    if (typeof lhs == "number" && typeof rhs == "number") {
        return emulation.expression(lhs, operator, rhs)
    } else {
        throw "failed"
    }
}

function find(Enum, tokens, body, key) {
    // from what i am aware the control flow has a break after every instruction so its esentually the same as ironbrew just while loops
    // i thought federal was smarter than this but? everything is just ufkcing static and shit! worst protectio ever lmao

    body = body || tokens.Interpreter

    for (let k = 0; k < body.length; k++) {
        let statment = body[k]
        let type = statment.Type

        if (type == "WhileStat") {
            let condition = statment.Condition

            if (solvebinop(condition, {Enum: Enum, VKey: key})) {
                return find(Enum, tokens, statment.Body.StatementList, key)
            }
        } else if (type == "AssignmentStat") {
            if (statment.Lhs[0].Type == "VariableExpr" && statment.Lhs[0].Variable.Name == "VKey") {
                let rhs = statment.Rhs[0]

                switch (statment.Rhs[0].Type) {
                    case "NumberLiteral":
                        key = parseInt(rhs.Token.Source)

                        continue
                    case "UnopExpr":
                        key = -key

                        continue
                    default:
                        console.log(statment.Rhs[0].Type)

                        throw "ffucking"
                }
            }
        } else if (type == "CompoundStat") {
            if (statment.Lhs.Type == "VariableExpr" && statment.Lhs.Variable.Name == "VKey") {
                key = emulation.expression(key, statment.Token_Compound.Source, key)
            }
        }
    
    }

    //console.log(luamin.Print({Type:"StatList", StatementList: body, SemicolonList: []}))

    let filtered = [] // we gotta remove the key setter and break because they will ruin the match

    for (let k = 0; k < body.length; k++) {
        let statment = body[k]

        if (statment.Type == "BreakStat") continue
        if (statment.Type == "AssignmentStat" && statment.Lhs[0].Type == "VariableExpr" && statment.Lhs[0].Variable.Name == "VKey") continue
        if (statment.Type == "CompoundStat" && statment.Lhs.Type == "VariableExpr" && statment.Lhs.Variable.Name == "VKey") continue

        filtered.push(statment)
    }

    // console.log(luamin.Print({Type:"StatList", StatementList: filtered, SemicolonList: []}))

    return filtered
}

function match(instruction, operands, pc, tokens, nolocal) {
    // ah shit here we go again

    function compare(srcstr, thorough) {
        let structure, list, ast

        structure = function(a, b) {
            if (a.Type != b.Type) {
                if (b.Type == "NumberLiteral" && a.Type == "UnopExpr") {
                    throw "somthing unsolved"
                } else {
                    return false
                }
            }

            if (a.Type == "AssignmentStat") {
                return list(a.Rhs, b.Rhs) && list(a.Lhs, b.Lhs)
            } else if (a.Type == "IndexExpr") {
                let names = true

                if (thorough && a.Base.Variable != undefined && b.Base.Type == "VariableExpr") {
                    names = a.Base.Variable.Name == b.Base.Token.Source
                }

                return names && structure(a.Base, b.Base) && structure(a.Index, b.Index)
            } else if (a.Type == "VariableExpr") {
                return true
            } else if (a.Type == "NumberLiteral") {
                return a.Source == b.Source
            } else if (a.Type == "LocalVarStat") {
                return list(a.ExprList, b.ExprList) 
            } else if (a.Type == "CallExprStat") {
                const e1 = a.Expression, e2 = b.Expression
                return structure(e1.Base, e2.Base) && list(e1.FunctionArguments.ArgList, e2.FunctionArguments.ArgList)
            } else if (a.Type == "CallExpr") {
                return structure(a.Base, b.Base) && list(a.FunctionArguments.ArgList, b.FunctionArguments.ArgList)
            } else if (a.Type == "BinopExpr") {
                const t1 = a.Token_Op, t2 = b.Token_Op
                return t1.Source == t2.Source && structure(a.Rhs, b.Rhs) && structure(a.Lhs, b.Lhs)
            } else if (a.Type == "DoStat") {
                return list(a.Body.StatementList, b.Body.StatementList)
            } else if (a.Type == "ReturnStat") {
                return list(a.ExprList, b.ExprList) 
            } else if (a.Type == "NilLiteral") {
                return true
            } else if (a.Type == "TableLiteral") {
                return true // ahhh
            } else if (a.Type == "NumericForStat") {
                return list(a.RangeList, b.RangeList) && list(a.Body.StatementList, b.Body.StatementList)
            } else if (a.Type == "ParenExpr") {
                return structure(a.Expression, b.Expression)
            } else if (a.Type == "UnopExpr") {
                return a.Token_Op.Source == b.Token_Op.Source && structure(a.Rhs, b.Rhs)
            } else if (a.Type == "IfStat") {
                if (!structure(a.Condition, b.Condition)) {
                    return false
                }

                if (thorough && !list(a.Body.StatementList, b.Body.StatementList)) {
                    return false
                }

                /*const o1 = a.ElseClauseList
                const o2 = b.ElseClauseList

                if (o1.length != o2.length) {
                    return false
                }

                for (let i = 0; i < o1.length; i++) {
                    const c1 = o1[i], c2 = o2[i]
                    const t1 = c1.ClauseType, t2 = c2.ClauseType
    
                    if (t1 != t2) {
                        return false
                    }

                    if (t1 == "elseif") {
                        //  havent ran into problems yet? so... who cares
                    }
    
                    if (!list(c1.Body.StatementList, c2.Body.StatementList)) {
                        return false
                    }
                }*/

                return list(a.Body.StatementList, b.Body.StatementList)
            }

            console.log(a)
            console.log(b)

            return false
        }

        list = function(a, b) {
            if(a.length != b.length) {
                return false
            } else if (a.length == 0) {
                return true
            }

            for (let i = 0; i < a.length; i++) {
                if (!structure(a[i], b[i])) {
                    return false
                }
            }
    
            return true
        }

        if (nolocal) {
            srcstr = srcstr.replace(/local/g, "")
        }

        srcstr = srcstr.replace(/OP_A/g, "2")
                       .replace(/OP_B/g, "3")
                       .replace(/OP_C/g, "4")
                       .replace(/InstrPoint/g, tokens.InstrPoint)
                       .replace(/Upvalues/g, tokens.Upvalues)
                       .replace(/Unpack/g, tokens.Unpack)
                       .replace(/Wrap/g, tokens.Wrap)
                       .replace(/Inst/g, tokens.Inst)
                       .replace(/Top/g, tokens.Top)
                       .replace(/Stk/g, tokens.Stack)
                       .replace(/Env/g, tokens.Env)

        ast = luamin.Parse(srcstr)


        /*console.log(luamin.Parse("a[1] = 2").StatementList[0].Lhs[0].Base)

        throw "lol"*/

        // only just found out about these :pensive:
        let visitor = {}
        let idx_expr_extention = () => {}

        visitor.IndexExpr = function(s) {
            if (s.Index.Type == "VariableExpr") {
                let var_val = tokens.GetConst(s.Index.Variable.Name)

                if (typeof var_val == "number") {
                    s.Index = createN(var_val)
                }
            }

            idx_expr_extention(s)
        }

        visitor.BinopExpr = function(s) {
            if (s.Lhs.Type == "VariableExpr") {
                let var_val = tokens.GetConst(s.Lhs.Variable.Name)

                if (typeof var_val == "number") {
                    s.Lhs = createN(var_val)
                }
            }

            if (s.Rhs.Type == "VariableExpr") {
                let var_val = tokens.GetConst(s.Rhs.Variable.Name)

                if (typeof var_val == "number") {
                    s.Rhs = createN(var_val)
                }
            }
        }

        // https://cdn.discordapp.com/attachments/874130686578147348/972165023663280180/unknown.png?size=4096
        // just hopeing the registers arent also modified? lol
        if (instruction.length > 1 && ((instruction[0].Type == "LocalVarStat" 
                                   && instruction[0].ExprList.length > 0
                                   && instruction[0].ExprList[0].Type == "TableLiteral")
                                   || (instruction[0].Type == "AssignmentStat"
                                   && instruction[0].Rhs.length > 0
                                   && instruction[0].Rhs[0].Type == "TableLiteral"))) {


            let table_name
            let local_tokens
            let local_table
            let table_entries

            if (instruction[0].Type == "LocalVarStat")  {
                table_name = instruction[0].VarList[0].Source
                local_tokens = []
                local_table = instruction[0].ExprList[0]
                table_entries = local_table.EntryList
            } else {
                table_name = instruction[0].Lhs[0].Variable.Name
                local_tokens = []
                local_table = instruction[0].Rhs[0]
                table_entries = local_table.EntryList

                // console.log(table_name)
            }

            for (let b = 0; b < table_entries.length; b++) {
                let entry = table_entries[b]
                let value = entry.Value

                if (value.Type == "VariableExpr") {
                    local_tokens[b + 1] = value.Variable.Name
                }
            }

            let new_instruction = []


            for (let b = 0; b < instruction.length; b++) {
                if (instruction[b] != instruction[0]) {
                    new_instruction.push(instruction[b])
                }
            }

            instruction = new_instruction
            
            idx_expr_extention = (s) => {
                if (s.Base.Type == "IndexExpr" && s.Base.Base.Type == "VariableExpr" && s.Base.Base.Variable.Name == table_name) {
                    let base = s.Base.Base
                    let index = s.Base.Index

                    let index_ref = index.Token.Source
                    let var_name = local_tokens[index_ref]

                    //console.log(base)

                    s.Base = base // createV(var_name, base)
                }
            }
        }

        luamin.Visit({Type:"StatList", StatementList: instruction, SemicolonList: []}, visitor) // working slow bodge!!!
        
        /*if (srcstr.includes("if(")) {
            console.log("assd")
        }*/
        /*console.log("------------------")
        console.log(luamin.Print({Type:"StatList", StatementList: instruction, SemicolonList: []}))
        console.log(luamin.Print(ast))
        console.log("------------------")*/

        return list(instruction, ast.StatementList)
    }

    for (opcode in opcodes) {
        const alises = opcodes[opcode]

        for (v of Object.values(alises)) {
            if ((v.Match != undefined && v.Match(instruction)) || (v.String != undefined && compare(v.String, v.Thorough))) {
                operands[pc].PC = pc

                //console.log(operands[pc])

                const op = v.Create(operands[pc])

                op.OpCode = binary.OpCodes.indexOf(opcode)
		op.OpName = binary.OpCodes[op.OpCode]
                op.Type = binary.OpCodeTypes[op.OpCode]

                /*let op_str = binary.OpCodes[op.OpCode]

                if (op_str == "GetGlobal") {
                    
                }*/

                return op
            }
        }
    }

    function is_super_jump(s) {
        // if (s == undefined) return false // console.log(s)
        if (s.Type != "AssignmentStat") return false
        let r = s.Rhs[0], l = s.Lhs[0]

        return l.Type == "VariableExpr" && l.Variable.Name == "PC" && r.Type == "BinopExpr" && r.Lhs.Type == "VariableExpr" && r.Lhs.Variable.Name == "PC"
    }
    
    
    if (instruction.find(s => is_super_jump(s))) {
        let sub = []
        instruction.Instructions = []
        instruction.SuperInstruction = true
        instruction.MatchedInstructions = []
        instruction.SubCount = instruction.filter(s => is_super_jump(s)).length
        instruction.Instructions.push(sub)

        for (let spc = 0; spc < instruction.length; spc++) {
            const operation = instruction[spc]

            if (is_super_jump(operation)) {
                spc++
                sub = []
                instruction.Instructions.push(sub)
                continue
            } else if (operation.Type == "LocalVarStat") {
                continue
            } else {
                sub.push(operation)
            }
        }

        for (let spc = 0; spc < instruction.Instructions.length; spc++) {
            const vminstruction = instruction.Instructions[spc]
            const instructionmt = match(vminstruction, operands, pc + spc, tokens, true)

            if (instructionmt != null) {
                instructionmt.Enum = spc
                instruction.MatchedInstructions.push(instructionmt)
            } else {
                instruction.MatchedInstructions.push({
                    PlaceHolder: true,
                    Enum: spc
                })
            }
        }
        
        return instruction
    }
}

module.exports = function(vmdata, debug) {
    function devirtualize(chunk) {
        const instructions = chunk.Instructions
        const prototypes = chunk.Prototypes
        const matched = []
        const tokens = vmdata.Tokens

        console.log()

        process.title = `0/${instructions.length}`

        for (let pc = 0; pc < instructions.length; pc++) {
            const Enum = instructions[pc].Enum, vminstruction = find(Enum, tokens)

            if (vminstruction != null) {
                const instructionmt = match(vminstruction, instructions, pc, tokens)

                if (instructionmt != null) {
                    if (instructionmt.SuperInstruction) {
                        const subInstructions = instructionmt.MatchedInstructions
                        console.log(`[${chalk.magentaBright("OUT")}] No ${chalk.magentaBright("Matched")} Instruction For #${Enum} ... SuperInstruction?`)
                        pc += instructionmt.SubCount

                        for (let i = 0; i < subInstructions.length; i++) {
                            if (!subInstructions[i].PlaceHolder) {
                                matched.push(subInstructions[i])
                                console.log(`[${chalk.magentaBright("OUT")}]   Matched Sub-Instruction For #${subInstructions[i].Enum + 1}: ${binary.OpCodes[subInstructions[i].OpCode].toUpperCase()}`)
                            } else {
                                let unmatched = instructionmt.Instructions[subInstructions[i].Enum]

                                let str = luamin.Print({Type:"StatList", StatementList: unmatched, SemicolonList: []})


                                //console.log(unmatched[0])

                                //console.log(unmatched[0].Body.StatementList[0].Rhs[0])

                                // Stack[Inst[2]] = Inst[4] + Inst[3]


                                console.log(str)
                                console.log(`[${chalk.magentaBright("OUT")}]   No Matched Sub-Instruction For #${subInstructions[i].Enum + 1}`)

                                throw "ayo"
                            }
                        }
                    } else {
                        matched.push(instructionmt)
                        console.log(`[${chalk.magentaBright("OUT")}] Matched Instruction #${Enum}: ${binary.OpCodes[instructionmt.OpCode].toUpperCase()}`)
                    }
                } else {
                    console.log(luamin.Print({Type:"StatList", StatementList: vminstruction, SemicolonList: []}))
                    console.log(`[${chalk.magentaBright("OUT")}] No ${chalk.magentaBright("Matched")} Instruction #${Enum}`)
                    
                    throw "ayo"
                }
            } else {
                console.log(`[${chalk.magentaBright("OUT")}] No ${chalk.magentaBright("Found")} Instruction #${Enum}`)
            }
    
            process.title = `${pc}/${instructions.length}`
        }

        for (let i = 0; i < prototypes.length; i++) {
            prototypes[i] = devirtualize(prototypes[i])
        }

        /*for (let i = 0; i < matched.length; i++) {
            let op_str = binary.OpCodes[matched[i].OpCode]

            if (op_str == "GetGlobal") {
                //let kst_idx = matched[i].B
                //console.log(chunk.Constants[kst_idx])
                
                matched[i].B = Math.abs(matched[i].B)
            }
        }*/

        chunk.Instructions = matched

        return chunk
    }

    console.log()

    let devirtualized = devirtualize(vmdata.Chunk)

    // post processsing lmao
    let do_vararg = function(chunk) {
        for (let i = 0; i < chunk.Instructions.length; i++) {
            let instruction = chunk.Instructions[i]
            let instruction_name = binary.OpCodes[instruction.OpCode]

            if (instruction_name == "VarArg") {
                chunk.VarArg = true

                continue
            }
        }

        for (let i = 0; i < chunk.Prototypes.length; i++) {
            do_vararg(chunk.Prototypes[i])
        }
    }

    do_vararg(devirtualized)

    // constant decryption, for some reason the constant index gets fuked up?!?

    const decrypt_const_body_code = [
        "GetGlobal",
        "GetTable",
        "Test",
        "Jmp",
        "???", //"Jmp", // this jump is somtimes and somtines not included due to mutations
        "GetGlobal",
        "GetTable",
        "Return",
        "LoadK",
        "LoadK",
        "LoadK",
        "Len",
        "LoadK",
        "ForPrep",
        "Move",
        "GetGlobal",
        "GetTable",
        "Self",
        "Move",
        "Move",
        "Call",
        "Self",
        "Call",
        "Add",
        "Mod",
        "Call",
        "Concat",
        "Add",
        "Mod",
        "ForLoop",
        "GetGlobal",
        "SetTable",
        "Return",
        "Return"
    ]

    const decrypt_const_call_code = [
        "GetGlobal", 
        "LoadK",
        "LoadK",
        "LoadK",
        "Call"
    ]

    for (let i = 0; i < devirtualized.Instructions.length; i++) {
        let instruction = devirtualized.Instructions[i]
        let instruction_name = binary.OpCodes[instruction.OpCode]

        if (instruction_name == "GetGlobal") {
            let pc_base = devirtualized.Instructions.indexOf(instruction)
            let re_body = [instruction]

            for (let k = 1; k < decrypt_const_body_code.length; k++) {
                let embeded_instruction = devirtualized.Instructions[pc_base + k]
                let embeded_instruction_name = embeded_instruction && binary.OpCodes[embeded_instruction.OpCode]

                if (embeded_instruction_name == decrypt_const_body_code[k]) {
                    re_body.push(embeded_instruction)
                }
            }

            // console.log(re_body)
        }
    }

    let encrypt_constants = false
    let decrypt_const_name 

    /*for (let i = 0; i < devirtualized.Instructions.length; i++) {
        let instruction = devirtualized.Instructions[i]
        let instruction_name = binary.OpCodes[instruction.OpCode]

        let next_instruction = devirtualized.Instructions[i + 1]
        let next_instruction_name = next_instruction && binary.OpCodes[next_instruction.OpCode]

        if (instruction_name == "Closure" && next_instruction_name == "SetGlobal") {
            let prototype = devirtualized.Prototypes[instruction.B]
            let match = true
            let k_ = 0

            for (let k = 0; k < prototype.Instructions.length; k++) {
                let proto_instruction = prototype.Instructions[k]
                let proto_instruction_name = binary.OpCodes[proto_instruction.OpCode]
                let match_instruction_name = decrypt_const_body_code[k_]

                //console.log(proto_instruction_name, match_instruction_name)
                //suff asf

                k_++

                if (proto_instruction_name != match_instruction_name) {
                    if (match_instruction_name == "???" && proto_instruction_name == "Jmp") {
                        continue
                    } else if (match_instruction_name == "???" && proto_instruction_name == "GetGlobal") {
                        k_++

                        continue
                    }

                    match = false
                }
            }

            if (match) {
                // console.log(devirtualized.Constants)
                // console.log(next_instruction)
                encrypt_constants = true

                // console.log(devirtualized.Constants)
                // console.log(devirtualized.Prototypes)

                console.log("fuck off")

                decrypt_const_name = devirtualized.Constants[next_instruction.B]

                break
            }
        }
    }

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] EncryptedConstants: '${encrypt_constants}'`)
    if (debug && encrypt_constants) console.log(`[${chalk.yellow("DEBUG")}] DecryptConst: '${decrypt_const_name}'`)*/

                                            // Should it be MOVE 0 0 or JMP 0
    function nop_instruction(instruction) { // Turn instruction into Move 0 0
        instruction.A = 0
        instruction.B = 0
        instruction.C = 0
        instruction.OpCode = 0
        instruction.Type = "AB"
    }

    if (encrypt_constants) { // p1000000 constant decryptor
        let do_chunk = function(chunk) {
            for (let i = 0; i < chunk.Instructions.length; i++) {
                let instruction = chunk.Instructions[i]
                let instruction_name = binary.OpCodes[instruction.OpCode]

                if (instruction_name == "GetGlobal") {
                    let match = true
                    
                    for (let k = 1; k < decrypt_const_call_code.length; k++) {
                        let to_match_instruction = chunk.Instructions[i + k]
                        let to_match_instruction_name = to_match_instruction && binary.OpCodes[to_match_instruction.OpCode]

                        if (to_match_instruction_name != decrypt_const_call_code[k]) {
                            match = false
                        }
                    }

                    if (match && chunk.Constants[instruction.B] == decrypt_const_name) {
                        let encrypted_string = chunk.Constants[chunk.Instructions[i + 1].B]
                        let map_key = chunk.Constants[chunk.Instructions[i + 2].B]
                        let key = chunk.Constants[chunk.Instructions[i + 3].B]

                        // console.log(typeof encrypted_string)
                        // console.log(typeof map_key)
                        // console.log(typeof key)

                        if (typeof encrypted_string != "string" || typeof map_key != "string" || typeof key != "number")
                            continue; // idk man

                        let constant = emulation.decrypt_constant(encrypted_string, key)
                        let constant_index = chunk.Constants.length - 1
                        let constant_register = chunk.Instructions[i + 4].A

                        console.log(`decrypted constant "${encrypted_string}" with key "${key}" -> ${constant}`)

                        chunk.Constants[constant_index] = constant

                        chunk.Instructions.splice(i, 1)
                        chunk.Instructions.splice(i, 1)
                        chunk.Instructions.splice(i, 1)
                        chunk.Instructions.splice(i, 1)
                        chunk.Instructions.splice(i, 1)
                        chunk.Instructions.splice(i, 0, {
                            A: constant_register,
                            B: constant_index,
                            OpCode: 1,
                            OpName: "LoadK",
                            Type: "ABx"
                        })



                        // nop_instruction(chunk.Instructions[i])
                        // nop_instruction(chunk.Instructions[i + 1])
                        // nop_instruction(chunk.Instructions[i + 2])
                        // nop_instruction(chunk.Instructions[i + 3])
                        // nop_instruction(chunk.Instructions[i + 4])

                        // let decrypt_call = chunk.Instructions[i + 4]

                        // decrypt_call.A = decrypt_call.A
                        // decrypt_call.B = constant_index
                        // decrypt_call.C = 0
                        // decrypt_call.OpCode = 1
                        // decrypt_call.Type = "ABx"


                        //console.log(chunk.Instructions)
                    
                        //chunk.Instructions.splice(i, i + 3)

                        //console.log(chunk.Instructions)

                    }
                }
            }

            for (let i = 0; i < chunk.Instructions.length; i++) {
                // Remove redundant instructions (nop, move 0 0) (mostly added from above)
                let instruction = chunk.Instructions[i]
                let instruction_name = binary.OpCodes[instruction.OpCode]

                if (instruction_name == "Move" && instruction.A == 0 && instruction.B == 0) {
                    chunk.Instructions.splice(i, 1)
                }
            }

            for (let i = 0; i < chunk.Prototypes.length; i++) {
                do_chunk(chunk.Prototypes[i])
            }
        }

        do_chunk(devirtualized)
    }

    return devirtualized
}