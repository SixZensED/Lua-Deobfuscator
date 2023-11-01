const chalk = require("chalk")
const emulation = require("./emulation")
const SmartBuffer = require("smart-buffer").SmartBuffer

function getstr(StringLiteral) {
    return StringLiteral.Token.Source.match(/(?<=['"[\]])[A-Z0-9\\]+=*/g)[0]
}

module.exports = function(body, debug) {
    if (debug) console.log("")

    const isAztup = body[0].Type == "ReturnStat"
    // if (debug) console.log(`[${chalk.yellow("DEBUG")}] Version: ${isAztup ? "AztupBrew" : "IronBrew"}`)

    const statements = isAztup ? body[0].ExprList[0].Base.Expression.Body.StatementList : body
    const functions = statements.filter(s=>s.Type=="LocalFunctionStat")
    const varaibles = statements.filter(s=>s.Type=="LocalVarStat")

    const gBits16 = functions.find(s=> {
        const bufferPosMods = s.FunctionStat.Body.StatementList.filter(x=>x.Type=="AssignmentStat")

        if (bufferPosMods) {
            for (let k = 0; k < bufferPosMods.length; k++) {
                const bufferPosMod = bufferPosMods[k]
                
                if (bufferPosMod && bufferPosMod.Rhs[0].Type == "BinopExpr") {
                    let addStat = bufferPosMod.Rhs[0]
        
                    if (addStat.Rhs.Type == "NumberLiteral" && addStat.Rhs.Token.Source == "2") {
                        return true
                    }
                }
            }
        }
    })

    const version = `${isAztup ? "AztupBrew" : "IronBrew"} V2.7.${isAztup ? 2 : (gBits16 ? 1 : 0)}`
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Version: ${version}`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] bit16: '${gBits16 ? gBits16.FunctionStat.NameChain[0].Source : "null"}'`)

    const gbits32 = functions.find(s => s.FunctionStat.Body.StatementList.length > 1 && s.FunctionStat.Body.StatementList[1].Type == "AssignmentStat")
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] bit32: '${gbits32.FunctionStat.NameChain[0].Source}'`)

    const xorkey = parseInt(gbits32.FunctionStat.Body.StatementList[1].Rhs[0].FunctionArguments.ArgList[1].Token.Source)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] XorKeyA: ${xorkey}`)

    const compression = functions[0].FunctionStat.Body.StatementList.length >= 3
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Compressed: ${compression ? "True" : "False"}`)

    const bytestring = getstr(compression ? varaibles.find(s=>s.ExprList[0].Type=="CallExpr").ExprList[0].FunctionArguments.ArgList[0] : varaibles.find(s=>s.ExprList[0].Type=="StringLiteral").ExprList[0])
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] ByteString: ${bytestring.substring(0, 7)}...`)

    const bytecode = compression ? emulation.decompress(bytestring, xorkey) : emulation.decode(bytestring, xorkey)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Bytecode: ${bytecode.length} Bytes`)
    
    const deserialize = functions.find(s => s.FunctionStat.Body.StatementList.filter(s=>s.Type=="NumericForStat").length > 1)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] Deserialize: '${deserialize.FunctionStat.NameChain[0].Source}'`)

    const dbody = deserialize.FunctionStat.Body.StatementList, dname = deserialize.FunctionStat.NameChain[0].Source
    const bformat = [], cformat = []
    let primary = xorkey, secondary, tertiary
    for (let i = 0; i < dbody.length; i++) {
        const operation = dbody[i]
        const type = operation.Type

        if (type == "NumericForStat" && operation.RangeList[1].Type == "VariableExpr") {
            bformat.push("Constants")

            const ifstats = operation.Body.StatementList.filter(s=>s.Type=="IfStat")
            if (ifstats.length > 1) {
                cformat.Bool = Number(ifstats[0].Condition.Expression.Rhs.Token.Source)
                cformat.Float = Number(ifstats[1].Condition.Expression.Rhs.Token.Source)
                cformat.String = Number(ifstats[2].Condition.Expression.Rhs.Token.Source)
            } else {
                const checks = ifstats[0]
                const clauses = checks.ElseClauseList
                cformat.Bool = Number(checks.Condition.Expression.Rhs.Token.Source)
                cformat.Float = Number(clauses[0].Condition.Expression.Rhs.Token.Source)
                cformat.String = Number(clauses[1].Condition.Expression.Rhs.Token.Source)
            }
        } else if (type == "NumericForStat" && operation.Body.StatementList[0].Type == "LocalVarStat") {
            bformat.push("Instructions")

            if (version == "IronBrew V2.7.0") { // has secondary and tertiary bitxor keys
                const vars = operation.Body.StatementList.filter(s=>s.Type=="LocalVarStat"&&s.ExprList.length>0&&s.ExprList[0].Type=="CallExpr")

                // will make better if breaks
                secondary = parseInt(vars[0].ExprList[0].FunctionArguments.ArgList[1].Token.Source)
                tertiary = parseInt(vars[1].ExprList[0].FunctionArguments.ArgList[1].Token.Source)
            }
        } else if (type == "NumericForStat" && operation.Body.StatementList[0].Rhs[0].Base.Token.Source == dname) {
            bformat.push("Prototypes")
        } else if (type == "NumericForStat") {
            bformat.push("Debug")
        } else if (type == "AssignmentStat") {
            switch (operation.Rhs[0].Type) {
                case "CallExpr":
                    bformat.push("Parameters")
                    continue;
                case "VariableExpr":
                    // 2.7.0 weird constant thing
                    continue;
                default:
                    throw "unexpected thing"
            }
        }
    }

    const wrap = isAztup ?
            functions.find(s => {let l = s.FunctionStat.Body.StatementList.slice(-1)[0]; return l.Type == "ReturnStat" && l.ExprList[0].Type == "ParenExpr"}) :
            functions.find(s => {let l = s.FunctionStat.Body.StatementList.slice(-1)[0]; return l.Type == "ReturnStat" && l.ExprList[0].Type == "FunctionLiteral"})
    
    const wbody = isAztup ? 
            wrap.FunctionStat.Body.StatementList.slice(-1)[0].ExprList[0].Expression.Body.StatementList :
            wrap.FunctionStat.Body.StatementList.slice(-1)[0].ExprList[0].Body.StatementList

    const interpreter = wbody.find(s => s.Type == "WhileStat").Body.StatementList
    const pcountloop = wbody.find(s => s.Type == "NumericForStat")

    const pc = wbody.find(s=>s.Type=="LocalVarStat"&&s.ExprList.length>0&&s.ExprList[0].Type=="NumberLiteral"&&s.ExprList[0].Token.Source=="1").VarList[0].Source
    const top = wbody.find(s=>s.Type=="LocalVarStat"&&s.ExprList.length>0&&s.ExprList[0].Type=="UnopExpr"&&s.ExprList[0].Rhs.Token.Source=="1").VarList[0].Source
    const stk = pcountloop.Body.StatementList[0].ElseClauseList[0].Body.StatementList[0].Lhs[0].Base.Token.Source

    let Const

    if (version == "IronBrew V2.7.0") {
        const first_def = wrap.FunctionStat.Body.StatementList.filter(s=>s.Type=="LocalVarStat").find(s=>s.ExprList[0].Index.Token.Source=="2")
        const second_def = wbody.filter(s=>s.Type=="LocalVarStat").find(s=>s.ExprList.length>0&&s.ExprList[0].Type=="VariableExpr"&&s.ExprList[0].Variable.Name==first_def.VarList[0].Source)

        Const = second_def.VarList[0].Source
    }

    if (debug) console.log(`[${chalk.yellow("DEBUG")}] BFormat: ${chalk.magentaBright(`[${bformat.join(", ")}]`)}`)
    if (debug) console.log(`[${chalk.yellow("DEBUG")}] CFormat: ${chalk.magentaBright(`{Bool: ${cformat.Bool}, Float: ${cformat.Float}, String: ${cformat.String}}`)}`)
    if (!debug) console.log(` ${chalk.greenBright("Success")}`)

    // require("fs").writeFileSync("optimized.lua", bytecode)

    return {
        Version: version,
        BytecodeFormat: bformat,
        ConstantFormat: cformat,
        Bytecode: SmartBuffer.fromBuffer(bytecode),
        Tokens: {
            Clauses: interpreter.find(s => s.Type == "IfStat"),
            Top: top,
            Stk: stk,
            Env: wrap.FunctionStat.ArgList[2].Source,
            Wrap: wrap.FunctionStat.NameChain[0].Source,
            Enum: interpreter[1].Lhs[0].Variable.Name,
            Inst: interpreter[0].Lhs[0].Variable.Name,
            Const,
            Chunk: wrap.FunctionStat.ArgList[0].Source,
            Unpack: varaibles.find(s=>s.ExprList.length>0&&
                (s.ExprList[0].Type=="BinopExpr"&&
                s.ExprList[0].Rhs.Type=="FieldExpr"&&
                s.ExprList[0].Token_Op.Source=="or")||
                (s.ExprList[0].Type=="VariableExpr"&&
                s.ExprList[0].Variable.Type=="Global"&&
                s.ExprList[0].Variable.Name.toLowerCase()=="unpack")).VarList[0].Source,
            Upvalues: wrap.FunctionStat.ArgList[1].Source,
            InstrPoint: pc,
        },
        Keys: {
            Primary: primary,
            Secondary: secondary,
            Tertiary: tertiary
        }
    }
}