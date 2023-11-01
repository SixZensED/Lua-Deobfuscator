const fs = require("fs")
const chalk = require("chalk")
const luamin = require("../../utility/luamin")
const emulation = require("./emulation")
const { performance } = require('perf_hooks');
const SmartBuffer = require("smart-buffer").SmartBuffer

// its not as much as it looks like its about 400 lines

function getstr(StringLiteral) {
    let string = StringLiteral.Token.Source

    switch (string.substring(0, 1)) {
        case "'":
        case '"':
            return string.substring(1, string.length - 1)
        case "[":
            if (string.substring(1, 2) != "[") throw "Extra Big String Hel!!!p"
            return string.substring(2, string.length - 2)
        default:
            throw `Cannot escape StringLiteral: Unhandled Type`
    }
}

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

function createS(s) {
    return {
        Type: "StringLiteral",
        Token: {
            Type: "String",
            LeadingWhite: "",
            Source: `"${s}"`
        },
        GetFirstToken: () => {},
        GetLastToken: () => {}
    }
}

function createB(s) {
    return {
        Type: "BooleanLiteral",
        Token: {
            Type: "Keyword",
            LeadingWhite: "",
            Source: String(s)
        },
        GetFirstToken: () => {},
        GetLastToken: () => {}
    }
}

function replaceObj(a, b) {
    for (var i in a) delete a[i]
    for (var [i, v] of Object.entries(b)) {
        a[i] = v
    }
}

let Tokens = []

function solve(a, b) {
    switch (a.Type) {
        case "ParenExpr":
            return solve(a.Expression, b)
        case "BinopExpr":
            let lh = solve(a.Lhs, b)
            //if (lh == undefined || typeof lh == "object") return // console.log("no lh") // {console.log(lh); return} 
            let rh = solve(a.Rhs, b)
            //if (rh == undefined || typeof rh == "object") return // console.log("no rh") // {console.log(rh); return} 

            /*if (typeof lh == "object"){
                console.log(lh.Type)
            }

            if (typeof rh == "object"){
                console.log(rh.Type)
            }*/
            
            let lhc = (lh == undefined || typeof lh == "object")
            let rhc = (rh == undefined || typeof rh == "object")

            if (!isNaN(lh) && !lhc && rhc) {
                //console.log("lh -> ", lh)
                a.Lhs = typeof lh == "number" ? createN(lh) : createS(lh)

                //console.log(lh, isNaN(lh))
            }

            if (!isNaN(rh) && lhc && !rhc) {
                //console.log("rh -> ", rh)
                a.Rhs = typeof rh == "number" ? createN(rh) : createS(rh) // fixxed but need to add better solution

                //console.log(typeof rh)
            }
            
            if (lhc || rhc) return

            let op = a.Token_Op.Source
            if (!op == undefined) return // console.log("no op")
            let re = emulation.expression(lh, op, rh)
            if (re == undefined || re == null) return // console.log("no re")

            //console.log(typeof re, re)

            /*let re = emulation.expression(lh, op, rh)
            console.log("-".repeat(40))
            console.log(lh, op, rh)
            console.log(re)
            console.log("-".repeat(40))*/


            //console.log( luamin.Print({Type:"StatList", StatementList: [b], SemicolonList: []}) )

            

            return re
        case "NumberLiteral":
            return parseFloat(a.Token.Source)
        case "StringLiteral":
            return getstr(a)
        case "CallExpr":
            let args = []

            a.FunctionArguments.ArgList.forEach(arg => {
                args.push(solve(arg, b))
            })

            let func = a.Base.Expression
            if (!func || func.Body.StatementList.length > 1) return a // unsolveable

            return solve(func.Body.StatementList[0], args)
        case "VariableExpr":
            if (!b) return a
            if (b.length < 1) return a // unsolveable
            let name = a.Token.Source
            if (name.substring(name.length - 4, name.length - 1) != "arg") throw "Do Regex Or Som Cus 9+ Args?"
            let idx = name.substring(name.length - 1)
            if (isNaN(idx)) throw "Beautifier Failed Or Somthinn"

            //console.log(b)
            //console.log(idx)
            //console.log(b[idx])
            return b[idx]
        case "ReturnStat":
            return solve(a.ExprList[0], b)
        case "FunctionLiteral":
            // console.log(a)

            return a
        case "UnopExpr":
            switch (a.Token_Op.Source) {
                case "-":
                    return -solve(a.Rhs, b)
                case "#":
                    switch (a.Rhs.Type) {
                        case "TableLiteral":
                            return a.Rhs.EntryList.length
                        case "StringLiteral":
                            return getstr(a.Rhs).length
                        case "IndexExpr":
                        case "VariableExpr":
                            return // unsolveable ish 
                        default:
                            console.log(a.Rhs)
                            throw `Unhandled Len Type`
                    }
                case "not":
                    switch (a.Rhs.Type) {
                        case "IndexExpr":

                            return
                        case "ParenExpr":
                            solveExpr(a.Rhs)

                            /*let lols = solve(a.Rhs)
                            if (lols == undefined || typeof lols == "object" || isNaN(lols)) return
                            a.Rhs = createN(lols)*/

                            return //lols // idk
                        case "BooleanLiteral":
                            return !(a.Rhs.Token.Source == "true")
                        case "VariableExpr":
                            return // unsolveable ish 
                        default:
                            console.log(a.Rhs)
                            throw `Unhandled NOT Type`
                    }
                default:
                    console.log(a.Token_Op.Source)
                    throw `Unhandled Unop`
            }
    }

    //console.log(`Can You Solve @${a.Type}`)
    //throw "Unhandled Solve"
}

function solveExpr(a) {
    switch (a.Type) {
        case "IndexExpr":
            // add vm const grabbing?
            solveExpr(a.Base)
            solveExpr(a.Index)

            if (a.Base.Type == "VariableExpr" && (a.Index.Type == "NumberLiteral" || a.Index.Type == "StringLiteral")) {
                if (a.Base.Token.Source != "L_1_arg0") return

                //console.log(Tokens.Consts)

                let vmconst = Tokens.Consts[solve(a.Index)]
                if (vmconst == undefined) return

                switch (typeof vmconst) {
                    case "number":
                        replaceObj(a, createN(vmconst))

                        return
                    case "string":
                        replaceObj(a, createS(vmconst))

                        return
                }
            }
            
            return
        case "FunctionLiteral":
            solveStat(a.Body)

            return
        case "BooleanLiteral":

            return
        case "NumberLiteral":
            
            return
        case "StringLiteral":

            return
        case "FieldExpr":
            solveExpr(a.Base)

            return
        case "VargLiteral":

            return
        case "NilLiteral":

            return
        case "TableLiteral":
            a.EntryList.forEach(b => {
                switch (b.EntryType) {
                    case "Field":
                    case "Value":
                        solveExpr(b.Value)
                        return
                    case "Index":
                        solveExpr(b.Index)
                        solveExpr(b.Value)
                        return
                    default:
                        throw "Unahndled Table EntryType"
                }
            })

            return
        case "MethodExpr":
        case "CallExpr":
            solveExpr(a.Base)
            //console.log(a.Base)

            switch (a.FunctionArguments.CallType) {
                case "ArgCall":
                    a.FunctionArguments.ArgList.forEach(solveExpr)
                case "TableCall":
                    if (!a.FunctionArguments.TableExpr) return
                    solveExpr(a.FunctionArguments.TableExpr)
            }

            return
        case "ParenExpr":
            //leading whitespace issue
            //if (a.Expression.Type == "ParenExpr") a.Expression = a.Expression.Expression

            solveExpr(a.Expression)

            switch (a.Expression.Type) {
                case "BooleanLiteral":
                case "NumberLiteral":
                case "StringLiteral":
                case "VargLiteral":
                case "NilLiteral":
                    replaceObj(a, a.Expression)
            }
            
            return
        case "BinopExpr":
            solveExpr(a.Lhs)
            solveExpr(a.Rhs)

            let lh = solve(a.Lhs)
            //if (lh == undefined || typeof lh == "object") return 
            let rh = solve(a.Rhs)
            //if (rh == undefined || typeof rh == "object") return

            /*if (typeof lh == "object"){
                console.log(lh.Type)
            }

            if (typeof rh == "object"){
                console.log(rh.Type)
            }*/

            let lhc = (lh == undefined || typeof lh == "object")
            let rhc = (rh == undefined || typeof rh == "object")

            if (!isNaN(lh) && !lhc && rhc) {
                //console.log("lh -> ", lh)
                a.Lhs = typeof lh == "number" ? createN(lh) : createS(lh)

                //console.log(lh, isNaN(lh))
            }

            if (!isNaN(rh) && lhc && !rhc) {
                //console.log("rh -> ", rh)
                a.Rhs = typeof rh == "number" ? createN(rh) : createS(rh) // fixxed but need to add better solution

                //console.log(typeof rh)
            }
            
            if (lhc || rhc) return

            let op = a.Token_Op.Source
            if (!op == undefined) return
            let re = emulation.expression(lh, op, rh)
            if (re == undefined) return

            switch (typeof re) {
                case "number":
                    replaceObj(a, createN(re))
                    return 
                case "string":
                    replaceObj(a, createS(re))
                    return 
                case "boolean":
                    replaceObj(a, createB(re))
                    return
                case "undefined":
                    return 
                case "object":
                    return
                default:
                    console.log(typeof re)
                    throw "binop"
            }
        case "UnopExpr":
            solveExpr(a.Rhs)

            let rhs = solve(a)
            if (rhs == undefined || isNaN(rhs)) return
            replaceObj(a, createN(rhs))

            return
        case "VariableExpr":

            return // not much to solve here?
        /*default:
            return*/
    }

    console.log(a)
    throw "Unhandled Expr Solve"
}

function solveStat(a) {
    switch (a.Type) {
        case "StatList":
            a.StatementList.forEach(b => {
                b.Remove = () => stat.StatementList[index] = null
                solveStat(b)
            })

            return
        case "LocalVarStat":
            a.ExprList.forEach(solveExpr)

            return
        case "ReturnStat":
            a.ExprList.forEach(solveExpr)

            return
        case "AssignmentStat":
            a.Lhs.forEach(solveExpr)
            a.Rhs.forEach(solveExpr)

            return
        case "DoStat":
            solveStat(a.Body)
            if (a.Body.Type == "StatList" && a.Body.StatementList.length == 0) a.Remove()

            return
        case "BreakStat":

            return // nothing to solve
        case "CallExprStat":
            solveExpr(a.Expression)

            return
        case "NumericForStat":
            a.RangeList.forEach(solveExpr)
            solveStat(a.Body)
            if (a.Body.Type == "StatList" && a.Body.StatementList.length == 0) a.Remove()

            // see luamin for more optimizations

            return
        case "LocalFunctionStat":
            solveStat(a.FunctionStat.Body)

            // remove unused?

            return
        case "IfStat":
            solveExpr(a.Condition)
            solveStat(a.Body)

            a.ElseClauseList.forEach(b => {
                if (b.Condition != null) {
                    solveExpr(b.Condition)
                }  
                
                solveStat(b.Body)   
            })

            switch (a.Condition.Type) {
                case "ParenExpr":
                    //leading whitespace issue
                    //a.Condition = a.Condition.Expression

                    return
                case "BooleanLiteral":
                    if (a.Condition.Token.Source == "false") a.Remove()

                    return
                case "NilLiteral":
                    a.Remove()

                    return
            }
            
            return
        case "WhileStat":
            solveExpr(a.Condition)
            solveStat(a.Body)

            switch (a.Condition.Type) {
                case "ParenExpr":
                    //leading whitespace issue
                    //a.Condition = a.Condition.Expression

                    return
                case "BooleanLiteral":
                    if (a.Condition.Token.Source == "false") a.Remove()

                    return
                case "NilLiteral":
                    a.Remove()

                    return
            }

            return
        case "CompoundStat":
            solveExpr(a.Lhs)
            solveExpr(a.Rhs)

            return
        /*default:
            return*/
    }

    console.log(a)
    throw "Unhandled Stat Solve"
}

function name_var(_var, name) {
    _var.Name = name
    _var.RenameList.forEach((setter) => {
        setter(name)
    })
}

/*function name_func(func, name) {
    func.NameChain[0].Source = name
    console.log(func.NameChain[0].Tokens.get(2))
    func.NameChain[0].Tokens.get().forEach((token) => {
        token.Source = name
    })
}*/

module.exports = function(body, debug) {
    if (debug) console.log("")

    let full = body

    body = body.find(s=>s.Type=="CallExprStat")
    if (!body) throw "NoBody"

    body = body.Expression.Base.Expression.Body.StatementList
    if (!body || body.length != 2) throw "Is This Even MoonSec? Or Body Is Like Not Right Idk Man SpeedRunning!!!"

    let _msec_func = body[0].Rhs[0].Expression || body[0].Rhs[0]
    let _msec_args = _msec_func.ArgList
    let _msec_call = body[1]
    let _msec_call_args = _msec_call.Expression.FunctionArguments.ArgList

    let vmconstsObj = _msec_call_args[0]
    let envfuncObj = _msec_call_args[1]
    let envObj = _msec_call_args[2]

    let vmconstName = _msec_args[0].Source
    let enfuncName = _msec_args[1].Source
    let envName = _msec_args[2].Source

    let consts = {}

    for (let i = 0; i < vmconstsObj.EntryList.length; i++) {
        let entry = vmconstsObj.EntryList[i]

        let idx = solve(entry.Index)
        if (idx == undefined) throw "Failed To Solve Const IDX"
        entry.Index = typeof idx == "number" ? createN(idx) : createS(idx)

        let val = solve(entry.Value)
        if (val == undefined) throw "Failed To Solve Const VAL"
        if (typeof val == "string") {val = emulation.string(val); entry.Value = createS(val)}

        consts[idx] = val
    }

    let envIdx = solve(envfuncObj.EntryList[0].Index)
    if (envIdx == undefined) throw "Failed To Solve _ENVidx VAL"
    envfuncObj.EntryList[0].Index = typeof envIdx == "number" ? createN(envIdx) : createS(envIdx)

    Tokens.Consts = consts

    // console.log(Tokens.Consts)

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] VMConsts Count: ${Object.keys(consts).length}`)

    solveStat(_msec_func.Body) // this could fo sure be imporved but its good rn

    fs.writeFileSync("./temp/clean.lua", luamin.Print({Type:"StatList", StatementList: full, SemicolonList: []}), () => {})

    let statements = _msec_func.Body.StatementList
    let functions = statements.filter(s=>s.Type=="LocalFunctionStat")
    let varaibles = statements.filter(s=>s.Type=="LocalVarStat")

    // console.log(varaibles[4])

    let get_const_val = (name) => {
        for (let i = 0; i < varaibles.length; i++) {
            let variable = varaibles[i]

            if (variable.VarList[0].Source == name) {
                // console.log(variable)
                return parseFloat(variable.ExprList[0].Token.Source)
            }
        }
    }

    let decompress = varaibles.find(s=>s.ExprList.length>0&&s.ExprList[0].Type=="CallExpr").ExprList[0] // varaibles[43].ExprList[0]
    let bytestring = getstr(decompress.FunctionArguments.ArgList[0])
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] ByteString: ${bytestring.substring(16, 23)}...`)

    let decompress_stat0 = decompress.Base.Expression.Body.StatementList[0]

    let dconsts = {
        A: solve(decompress_stat0.ExprList[0]),
        B: solve(decompress_stat0.ExprList[1])
    }

    let _R = functions[0] // static function order = deobfuscatedd!!
    let deserialize = functions[1]
    let wrap = functions[2]

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] CountVarArg: '${_R.FunctionStat.NameChain[0].Source}'`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Deserialize: '${deserialize.FunctionStat.NameChain[0].Source}'`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Wrap: '${wrap.FunctionStat.NameChain[0].Source}'`)

    let wrap_body = wrap.FunctionStat.Body.StatementList
    let wrap_ret = wrap_body.find(s=>s.Type=="ReturnStat")
    let ret_body = wrap_ret.ExprList[0].Expression.Body.StatementList
    let wrap_loop = ret_body.find(s=>s.Type=="WhileStat"&&s.Condition.Type=="BooleanLiteral")
    let loop_body = wrap_loop.Body.StatementList

    let inst_pointer = loop_body[0]
    let enum_pointer = loop_body[1]
    let vkey_pointer = loop_body[2]

    let inst_var = inst_pointer.Lhs[0].Variable
    let enum_var = enum_pointer.Lhs[0].Variable 
    let vkey_var = vkey_pointer.Lhs[0].Variable
    let poin_var = inst_pointer.Rhs[0].Index.Variable

    name_var(inst_var, "Inst")
    name_var(enum_var, "Enum")
    name_var(vkey_var, "VKey")
    name_var(poin_var, "PC")

    Tokens.Interpreter = loop_body
    Tokens.Upvalues = wrap.FunctionStat.ArgList[1].Source
    Tokens.Pointer = poin_var.Name
    Tokens.Wrap = wrap.FunctionStat.NameChain[0].Source
    Tokens.Inst = inst_var.Name
    Tokens.Enum = enum_var.Name
    Tokens.Vkey = vkey_var.Name
    Tokens.Env = wrap.FunctionStat.ArgList[2].Source

    let is_roblox = ret_body.find(s=>s.Type=="CompoundStat")
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Target: ${is_roblox ? "Roblox" : "Normal"}`) // cba for cgo support

    if (is_roblox) {
        Tokens.Top = is_roblox.Lhs.Variable.Name
    } else {
        const local_shit = ret_body.find(s=>s.Type=="LocalVarStat"&&s.ExprList.length>0&&s.ExprList[0].Type=="UnopExpr")

        if (local_shit) {
            Tokens.Top = local_shit.VarList[0].Source
        } else {
            Tokens.Top = ret_body.find(s=>s.Type=="AssignmentStat"&&s.Rhs.length>0&&s.Rhs[0].Type=="BinopExpr").Lhs[0].Variable.Name

        }


        
    }

    if (!Tokens.Top) throw "prick"

    

    let pcountloop = ret_body.find(s=>s.Type=="NumericForStat")
    let stk_var = pcountloop.Body.StatementList[0].ElseClauseList[0].Body.StatementList[0].Lhs[0].Base.Variable // dont have much faith in this

    name_var(stk_var, "Stack")

    Tokens.Stack = stk_var.Name

    /*let instr_ref = wrap_body.find(s=>s.Type=="LocalVarStat" && get_const_val(s.ExprList[0].Index.Token.Source) == 1)
    let proto_ref = wrap_body.find(s=>s.Type=="LocalVarStat" && get_const_val(s.ExprList[0].Index.Token.Source) == 2)
    let param_ref = wrap_body.find(s=>s.Type=="LocalVarStat" && get_const_val(s.ExprList[0].Index.Token.Source) == 3)

    let instr_var = ret_body.find(s=>{if (s.Type=="LocalVarStat" && s.ExprList.length > 0 && s.ExprList[0].Type == "VariableExpr") {
        return s.ExprList[0].Variable.Name == instr_ref.VarList[0].Source}}).ExprList[0].Variable
    let proto_var = ret_body.find(s=>{if (s.Type=="LocalVarStat" && s.ExprList.length > 0 && s.ExprList[0].Type == "VariableExpr") {
        return s.ExprList[0].Variable.Name == proto_ref.VarList[0].Source}}).ExprList[0].Variable
    let param_var = ret_body.find(s=>{if (s.Type=="LocalVarStat" && s.ExprList.length > 0 && s.ExprList[0].Type == "VariableExpr") {
        return s.ExprList[0].Variable.Name == param_ref.VarList[0].Source}}).ExprList[0].Variable

    name_var(instr_var, "Instructions")
    name_var(proto_var, "Prototypes")
    name_var(param_var, "Parameters")

    Tokens.Instructions = instr_var.Name
    Tokens.Prototypes = proto_var.Name
    Tokens.Parameters = param_var.Name*/

    let bit_lib_var = statements.find(s=>s.Type=="AssignmentStat"&&s.Rhs[0]&&s.Rhs[0].Type=="TableLiteral")
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] gbitFuncs: '${bit_lib_var.Lhs[0].Token.Source}'`)
    let bit_lib_tbl = bit_lib_var.Rhs[0].EntryList

    // Every script ive seen these indexes are static (please dont make me get them dynamicly thats so much effort)
    let gbits32 = bit_lib_tbl[0].Value
    let gbits8  = bit_lib_tbl[1].Value
    let gbits16 = bit_lib_tbl[2].Value
    let gbit    = bit_lib_tbl[3].Value
    let gfloat  = bit_lib_tbl[4].Value
    let gstring = bit_lib_tbl[5].Value
    
    let gbits32_body = gbits32.Body.StatementList
    let gbits32_increment = gbits32_body[1]
    let gbits32_bit_shift = gbits32_body[2]

    let rconsts = {C: 1} // L_50_ = 1 -> Position

    rconsts.A = get_const_val(gbits32_bit_shift.Rhs[0].Lhs.Expression.Rhs.Expression.Lhs.Token.Source) // obviously this is probably likely to error? idk
    rconsts.B = get_const_val(gbits32_bit_shift.Lhs[0].Token.Source)



    // console.log(get_const_val("L_20_")) // -> 4

    /*let renameVar = (v, n) => {
        let tokens = v.Tokens.get()

        for (let i = 0; i < tokens.length; i++) {
            tokens[i].Source = n
        }

        v.Source = n
    }*/

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] ---------------------------`)

    // console.log(varaibles[40]) unpack

    for (let i = 0; i < varaibles.length; i++) {
        let variable = varaibles[i]
        //let variableBase = variable.VarList[0]

        // console.log(variable.VarList[0].Tokens.get())

        if (variable.ExprList.length == 1 && variable.ExprList[0].Type == "BinopExpr") {
            let lhs = variable.ExprList[0].Lhs

            if (lhs.Type == "IndexExpr" && lhs.Index.Type == "StringLiteral" && getstr(lhs.Index) == "unpack") {
                Tokens.Unpack = variable.VarList[0].Source
            }
        }
        
        if (variable.ExprList.length == 1 && variable.ExprList[0].Type=="IndexExpr") {
            let idxExpr = variable.ExprList[0]
            let var_name = variable.VarList[0].Source

            //console.log(idxExpr)

            if (idxExpr.Base.Type=="VariableExpr" && idxExpr.Base.Token.Source==envName && idxExpr.Index.Type == "StringLiteral") {
                let str_base = idxExpr.Index
                
                switch (getstr(str_base)){
                    case "select":
                        //renameVar(variableBase, "Select")
                        Tokens.Select = var_name

                        break
                    case "tonumber":
                        //renameVar(variableBase, "ToNumber")
                        Tokens.Tonumber = var_name

                        break
                }
            } else if (idxExpr.Type=="IndexExpr" && idxExpr.Base.Type=="IndexExpr"
                                                 &&idxExpr.Base.Base.Type=="VariableExpr"
                                                 &&idxExpr.Base.Base.Token.Source==envName
                                                 &&idxExpr.Base.Index.Type=="StringLiteral") {
                
                let str_base_name = getstr(idxExpr.Base.Index)

                if (idxExpr.Index.Type == "IndexExpr" || idxExpr.Index.Type != "StringLiteral") {
                    console.log(idxExpr.Index) // fixed??? pls

                    throw "Constant Solve Error"
                }
                
                let str_idx_name = getstr(idxExpr.Index)

                // probably uselsss but cool nonetheless

                switch (str_base_name) {
                    case "math":
                    case "table":
                    case "string":
                        switch (str_idx_name) {
                            case "ldexp":
                            case "insert":
                            case "concat":
                            case "byte":
                            case "char":
                            case "sub":
                                Tokens.Sub = var_name[0].toUpperCase() + var_name.slice(1)
                                if (debug) console.log(`[${chalk.yellow("DEBUG")}] ${str_base_name}.${str_idx_name}: '${var_name}'`)

                                break
                        }

                        break
                }
            }
        }
    }

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] ---------------------------`)

    // moonsec works like ironbrew in the sense that it places the constant within the instruction
    // i didnt have to do anything for ironbrew since the constant indexs were normal
    // but im going to have to create my own constant pool for this shit 

    let bformat = [], cformat = []
    let dbody = deserialize.FunctionStat.Body.StatementList

    /*console.log(dbody[7])
    console.log(dbody[9])
    console.log(dbody[10])
    console.log(dbody[11])*/

    for (let i = 0; i < dbody.length; i++) {
        let statement = dbody[i]
        let type = statement.Type

        switch (type) {
            case "NumericForStat":
                let a_range = statement.RangeList[0] 
                let b_range = statement.RangeList[1]

                switch (b_range.Type) {
                    case "VariableExpr":
                        bformat.push("Constants")

                        rconsts.D = solve(statement.Body.StatementList[2].ExprList[0].Index.Rhs)

                        break
                    case "CallExpr":
                        switch (statement.Body.StatementList.length) {
                            case 1:
                                bformat.push("Prototypes")

                                break
                            case 2:
                                bformat.push("Instructions")

                                break
                        }

                        break
                }

                break
            case "AssignmentStat":
                let rhs = statement.Rhs[0]
                let lhs = statement.Lhs[0]

                if (rhs.Type == "CallExpr" && rhs.Base.Type == "IndexExpr" 
                                           && rhs.Base.Index.Type == "NumberLiteral"
                                           && rhs.Base.Index.Token.Source == "2") {

                    bformat.push("Parameters")
                }

                break
            case "LocalVarStat":
                let variable = statement.VarList[0]
                let expr = statement.ExprList[0]

                if (expr.Type == "TableLiteral" && expr.EntryList.length == 4) {
                    for (let i = 0; i < dbody.length; i++) { // shity way of getting this
                        if (dbody[i] == statement && (expr.EntryList[0].Index && solve(expr.EntryList[0].Index) != undefined)) {
                            rconsts.CKey = parseInt(dbody[i - 1].ExprList[0].Token.Source)
                        }
                    }

                    for (let i = 0; i < expr.EntryList.length; i++) {
                        let entry = expr.EntryList[i]
                        let entry_idx = entry.Index && solve(entry.Index) // should be solved but uno

                        if (entry_idx != undefined && entry.Value.Type == "ParenExpr" /*|| entry.Type == FunctionLiteral*/) {
                            let func = entry.Value.Expression
                            let func_body = func.Body.StatementList

                            if (func_body.length > 1) {
                                cformat.Encoded = entry_idx
                            } else if (func_body.length == 1 && func_body[0].Type == "ReturnStat") {
                                let return_stat = func_body[0]

                                switch (return_stat.ExprList[0].Type) {
                                    case "UnopExpr":
                                        cformat.Bool = entry_idx

                                        break
                                    case "CallExpr":
                                        switch (solve(return_stat.ExprList[0].Base.Index)) { // this could brake but i dont care
                                            case 5:
                                                cformat.Float = entry_idx

                                                break
                                            case 6:
                                                cformat.String = entry_idx

                                                break
                                        }

                                        break
                                }
                            }
                        }
                    }
                }

                break
        }
    }

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] BFormat: ${chalk.magentaBright(`[${bformat.join(", ")}]`)}`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] CFormat: ${chalk.magentaBright(`{Bool: ${cformat.Bool}, Float: ${cformat.Float}, String: ${cformat.String}, Encoded: ${cformat.Encoded}}`)}`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] RConsts: ${chalk.magentaBright(`{A: ${rconsts.A}, B: ${rconsts.B}, C: ${rconsts.C}, D: ${rconsts.D}, CKey: ${rconsts.CKey}}`)}`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] DConsts: ${chalk.magentaBright(`{A: ${dconsts.A}, B: ${dconsts.B}}`)}`)
    // if (debug) console.log(`[${chalk.yellow("DEBUG")}] ---------------------------`)

    fs.writeFileSync("./temp/debug.lua", luamin.Print({Type:"StatList", StatementList: full, SemicolonList: []}), () => {})

    // unlike ironbrew this returns a array (the decompressed bytes) because of how its encoded and will need to be read
    var startTime = performance.now()
    
    let bytecode = emulation.decompress(bytestring, dconsts)

    var endTime = performance.now()

    console.log(`Decompress took ${endTime - startTime} milliseconds`)

    console.log(bytecode)
    
    

    //console.log(Tokens)

    // fs.writeFile("renamed.lua", luamin.Print({Type:"StatList", StatementList: full, SemicolonList: []}), () => {})

    //console.log(vmconstsObj.EntryList[0].Value)
    //console.log(solveThing(vmconstsObj.EntryList[0].Value))
    //console.log()
    
    //console.log(luamin.Print({Type:"StatList", StatementList: [vmconstsObj.EntryList[3].Index], SemicolonList: []}))
    //console.log(vmconstsObj.EntryList[3].Index)
    //console.log(solveThing(vmconstsObj.EntryList[3].Index.Expression.Lhs))
    //console.log(solveThing(vmconstsObj.EntryList[3].Index.Expression.Rhs))

    //console.log(solveThing(vmconstsObj.EntryList[3].Index))

    

    //if (debug) console.log(`[${chalk.yellow("DEBUG")}] Version: ${isAztup ? "AztupBrew" : "IronBrew"}`)

    // console.log(Tokens)

    return {
        BytecodeFormat: bformat,
        ConstantFormat: cformat,
        ReaderConsts: rconsts,
        Bytecode: bytecode, // byte array not a buffer
        Tokens: {
            GetConst: (name) => get_const_val(name),
            Interpreter: Tokens.Interpreter,
            InstrPoint: Tokens.Pointer,
            Upvalues: Tokens.Upvalues,
            Unpack: Tokens.Unpack,
            Stack: Tokens.Stack,
            Wrap: Tokens.Wrap,
            Inst: Tokens.Inst,
            Enum: Tokens.Enum,
            VKey: Tokens.VKey,
            Top: Tokens.Top,
            Env: Tokens.Env
        }
    }
}