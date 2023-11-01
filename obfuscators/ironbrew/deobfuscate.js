const chalk = require("chalk")
const analyze = require("./analyze")
const deserialize = require("./deserialize")
const devirtualize = require("./devirtualize")
const luamin = require("../../utility/luamin")
const binary = require("../../utility/binary") 

function detect(source) {
    return source.match(/return table\.concat\([_\-a-zA-Z0-9]+\)/g) != null || source.match(/return [_\-a-zA-Z0-9]+\(true, ?\{\}, ?[_\-a-zA-Z0-9]+\(\)\)\(\);?/g) != null || source.match(/bit and bit\.bxor or function\([_\-a-zA-Z0-9]+, ?[_\-a-zA-Z0-9]+\)/g) != null
}

function deobfuscate(ast) {
    let vmdata

    process.stdout.write(`[${chalk.blueBright("INFO")}] Finding Vm Data...`)
    vmdata = analyze(ast.StatementList, true)

    process.stdout.write(`[${chalk.blueBright("INFO")}] Deserializing Bytecode...`)
    vmdata = deserialize(vmdata, true)

    luamin.SolveMath(ast)

    process.stdout.write(`[${chalk.blueBright("INFO")}] Devirtualizing Bytecode...`)
    vmdata = devirtualize(vmdata)

    return binary.sterilize(vmdata)
}

module.exports = {detect, deobfuscate, name: "IronBrew"}
