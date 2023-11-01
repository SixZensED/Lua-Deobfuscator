const chalk = require("chalk")
const analyze = require("./analyze")
const deserialize = require("./deserialize")
const devirtualize = require("./devirtualize")
const binary = require("../../utility/binary")
const printer = require("../../utility/printer")

function detect(source) {
    return source.match(/\.\.:::MoonSec::\.\./g) != null
}

function deobfuscate(ast) {
    let vmdata

    process.stdout.write(`[${chalk.blueBright("INFO")}] Finding Vm Data...`)
    vmdata = analyze(ast.StatementList, true)

    process.stdout.write(`[${chalk.blueBright("INFO")}] Deserializing Bytecode...`)
    vmdata = deserialize(vmdata, true)

    process.stdout.write(`[${chalk.blueBright("INFO")}] Devirtualizing Bytecode...`)
    vmdata = devirtualize(vmdata, true)

    return binary.sterilize(vmdata)
}

module.exports = {detect, deobfuscate, name: "MoonSecV2"}
