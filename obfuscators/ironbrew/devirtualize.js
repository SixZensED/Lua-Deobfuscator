const fs = require("fs")
const chalk = require("chalk")
const luamin = require("../../utility/luamin")
const binary = require("../../utility/binary")
const emulation = require("./emulation")
const opcodes = {}

function createNL(n) {
    return {
        Type: "NumberLiteral",
        Token: {
            Type: "Number",
            LeadingWhite: "",
            Source: n
        },
        GetFirstToken: () => {},
        GetLastToken: () => {}
    }
}

let replace_known
let replace_unknown

function find(Enum, tokens, clause, parent) {
    clause = clause || tokens.Clauses

    let ifstat = clause.Condition
    const elsestats = clause.ElseClauseList

    if (ifstat.Type != "BinopExpr" || ifstat.Lhs.Type != "VariableExpr") {
        return parent
    }

    if (ifstat.Lhs.Variable.Name != tokens.Enum) {
        return parent
    }

    if (ifstat.Rhs.Type == "UnopExpr") {
        let solved = emulation.unopexpr(ifstat.Rhs)

        if (solved) {
            ifstat.Rhs = createNL(solved)
        } else {
            return
        }
    } else if (ifstat.Rhs.Type != "NumberLiteral") {
        throw "Unhandled comparison in control flow"
    }

    function handle(clause) {
        if (clause.Body.StatementList[0].Type == "IfStat") {
            return find(Enum, tokens, clause.Body.StatementList[0], clause.Body.StatementList)
        } else {
            return clause.Body.StatementList
        }
    }

    if (emulation.expression(Enum, ifstat.Token_Op.Source, ifstat.Rhs.Token.Source)) {
        return handle(clause)
    }

    for (let i = 0; i < elsestats.length; i++) {
        clause = elsestats[i]
        ifstat = clause.Condition

        if (clause.ClauseType == "elseif") {
            if (ifstat.Rhs.Type == "UnopExpr") {
                let solved = emulation.unopexpr(ifstat.Rhs)
        
                if (solved) {
                    ifstat.Rhs = createNL(solved)
                } else {
                    return
                }
            } else if (ifstat.Rhs.Type != "NumberLiteral") {
                console.log(ifstat.Rhs)
                throw "Unhandled comparison in control flow"
            }

            if (emulation.expression(Enum, ifstat.Token_Op.Source, ifstat.Rhs.Token.Source)) {
                return handle(clause)
            }
        } else if (clause.ClauseType == "else") { // else?
            return handle(clause)
        }
    }
}

function match(instruction, operands, pc, tokens, nolocal) {
    // could impimet operand name resolver? but again havent ran into problems yet

    function compare(srcstr, thorough) {
        let structure, list, ast

        structure = function(a, b) {
            if (a.Type != b.Type) {
                if (b.Type == "NumberLiteral" && a.Type == "UnopExpr") {
                    let solved = emulation.unopexpr(a)
            
                    if (solved) {
                        a = createNL(solved)
                    } else {
                        return false
                    }
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

                // console.log(a.Base.Variable && a.Base.Variable.Name)

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
                /*console.log("-------------------------------------------------------------------------------")
                console.log(t1.Source, t2.Source)
                console.log(luamin.Print({Type:"StatList", StatementList: instruction, SemicolonList: []}))
                console.log(srcstr)*/
                return t1.Source == t2.Source && structure(a.Rhs, b.Rhs) && structure(a.Lhs, b.Lhs)
            } else if (a.Type == "DoStat") {
                return list(a.Body.StatementList, b.Body.StatementList)
            } else if (a.Type == "ReturnStat") {
                return list(a.ExprList, b.ExprList) 
            } else if (a.Type == "NilLiteral") {
                return true
            } else if (a.Type == "TableLiteral") {
                return true
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

                const o1 = a.ElseClauseList
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
                }

                
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

        // Problem where vars can repeat so i might beautifiy it first /shrug
        // Edit ^^ i did
        
        // console.log(luamin.Beautify(srcstr, {}))

        srcstr = replace_known(srcstr)
                       
        ast = luamin.Parse(srcstr)//[0]

        // here is a fix for that one nigga obfuscator
        /*(if (instruction.length>1&&instruction[0].Type=="AssignmentStat"&&instruction[0].Rhs[0].Type=="IndexExpr") {
            const index = instruction[0].Rhs[0]

            if (index.Base.Type == "VariableExpr"&&index.Base.Token.Source==tokens.Inst) {
                
                

            }
        }*/

        return list(instruction, ast.StatementList)
    }

    function isSuperJump(s) {
        if (s.Type != "AssignmentStat") return false
        const r = s.Rhs[0], l = s.Lhs[0]

        return (r.Type=="BinopExpr"&&
                r.Lhs.Type == "VariableExpr"&&
                r.Lhs.Variable.Name==tokens.InstrPoint&&
                r.Rhs.Type == "NumberLiteral"&&
                r.Rhs.Token.Source=="1"&&
                l.Type =="VariableExpr"&&
                l.Variable.Name==tokens.InstrPoint) // || ()
    }

    for (opcode in opcodes) {
        const alises = opcodes[opcode]

        for (v of Object.values(alises)) {
            if ((v.Match != undefined && v.Match(instruction)) || (v.String != undefined && compare(v.String, v.Thorough))) {
                //console.log(operands[pc])
                operands[pc].PC = pc

                const op = v.Create(operands[pc])
                op.OpCode = binary.OpCodes.indexOf(opcode)
		op.OpName = binary.OpCodes[op.OpCode]
                op.Type = binary.OpCodeTypes[op.OpCode]

                // console.log(opcode)

                /*if (opcode == "Lt") {
                    console.log(luamin.Print({Type:"StatList", StatementList: instruction, SemicolonList: []}))
                    console.log(v.String)
                }*/

                return op
            }
        }
    }

    if (instruction.find(s => isSuperJump(s))) {
        let sub = []
        instruction.Instructions = []
        instruction.SuperInstruction = true
        instruction.MatchedInstructions = []
        instruction.SubCount = instruction.filter(s => isSuperJump(s)).length
        instruction.Instructions.push(sub)

        for (let spc = 0; spc < instruction.length; spc++) {
            const operation = instruction[spc]

            if (isSuperJump(operation)) {
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

module.exports = function(vmdata) {

    // console.log(vmdata.Chunk.Instructions)

    if (vmdata.Version == "IronBrew V2.7.0") {
        fs.readdirSync("./obfuscators/ironbrew/opcodes/2.7.0").forEach(opcode => {
            opcodes[opcode.split(".")[0]] = require(`./opcodes/2.7.0/${opcode}`)
        })
    } else if (vmdata.Version == "IronBrew V2.7.1" || vmdata.Version == "AztupBrew V2.7.2") {
        fs.readdirSync("./obfuscators/ironbrew/opcodes/2.7.1").forEach(opcode => {
            opcodes[opcode.split(".")[0]] = require(`./opcodes/2.7.1/${opcode}`)
        })
    }

    replace_known = (str) => {
        let res = str.replace(/OP_A/g, "2")
            .replace(/OP_B/g, "3")
            .replace(/InstrPoint/g, vmdata.Tokens.InstrPoint)
            .replace(/Upvalues/g, vmdata.Tokens.Upvalues)
            .replace(/Unpack/g, vmdata.Tokens.Unpack)
            .replace(/Const/g, vmdata.Tokens.Const)
            .replace(/Wrap/g, vmdata.Tokens.Wrap)
            .replace(/Inst/g, vmdata.Tokens.Inst)
            .replace(/Top/g, vmdata.Tokens.Top)
            .replace(/Stk/g, vmdata.Tokens.Stk)
            .replace(/Env/g, vmdata.Tokens.Env)

        if (vmdata.Version == "IronBrew V2.7.0") {
            res = res.replace(/OP_C/g, "5")
        } else {
            res = res.replace(/OP_C/g, "4")
        }

        return res
    }

    replace_unknown = (str) => {
        let res = str.replace(/\[2/g, "[OP_A")
            .replace(/\[3/g, "[OP_B")
            .replace(/\[4/g, "[OP_C")
            .replace(new RegExp(vmdata.Tokens.InstrPoint, "g"), "InstrPoint")
            .replace(new RegExp(vmdata.Tokens.Upvalues, "g"), "Upvalues")
            .replace(new RegExp(vmdata.Tokens.Unpack, "g"), "Unpack")
            .replace(new RegExp(vmdata.Tokens.Const, "g"), "Const")
            .replace(new RegExp(vmdata.Tokens.Wrap, "g"), "Wrap")
            .replace(new RegExp(vmdata.Tokens.Inst, "g"), "Inst")
            .replace(new RegExp(vmdata.Tokens.Top, "g"), "Top")
            .replace(new RegExp(vmdata.Tokens.Stk, "g"), "Stk")
            .replace(new RegExp(vmdata.Tokens.Env, "g"), "Env")

        if (vmdata.Version == "IronBrew V2.7.0") {
            res = res.replace(/\[5/g, "[OP_C")
        } else {
            res = res.replace(/\[4/g, "[OP_C")
        }

        return res
    }

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
                                

                                // bs fix for that shit script
                                const subInstruction = subInstructions[i]

                                /*if (i == 7 && binary.OpCodes[subInstruction.OpCode] == "Call") {
                                    if (binary.OpCodes[subInstructions[i - 1].OpCode] == "Call" && binary.OpCodes[subInstructions[i - 2].OpCode] == "Self") {
                                        subInstruction.A = 0
                                        subInstruction.B = 1
                                        subInstruction.C = 0
                                    }
                                }*/

                                matched.push(subInstruction)
                                console.log(`[${chalk.magentaBright("OUT")}]   Matched Sub-Instruction For #${subInstructions[i].Enum + 1}: ${binary.OpCodes[subInstructions[i].OpCode].toUpperCase()}`)
                            } else {

                                let str = luamin.Print({Type:"StatList", StatementList: instructionmt.Instructions[subInstructions[i].Enum], SemicolonList: []})

                                console.log(tokens)
                                // str = replace_unknown(str)

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

                    let str = luamin.Print({Type:"StatList", StatementList: vminstruction, SemicolonList: []})

                    str = replace_unknown(str)

                    

                    //console.log(tokens)

                    console.log(str)
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

        chunk.Instructions = matched

        return chunk
    }

    console.log()

    let devirtualized = devirtualize(vmdata.Chunk)

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

// console.log(devirtualized)

    return devirtualized
}