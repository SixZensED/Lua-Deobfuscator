const fs = require("fs")
const chalk = require("chalk")
const luamin = require("./utility/luamin")

const inputFile = "./input.lua"
const outputFile = "output.luac"

let script = fs.readFileSync(inputFile, "utf8")
let parsed, bytecode

/// console.log(script)

/*script = script.replace(/[_\-a-zA-Z0-9]+ ?\+= ?[_\-a-zA-Z0-9]+/g, (match) => {
    let perameters = match.split("+=")
    let x = perameters[0], y = perameters[1]

    return ` ${x} = ${x} + ${y} ` // "ADDITION_ASSIGNMENT"
}).replace(/[_\-a-zA-Z0-9]+ ?\*= ?[_\-a-zA-Z0-9]+/g, (match) => {
    let perameters = match.split("*=")
    let x = perameters[0], y = perameters[1]

    return ` ${x} = ${x} * ${y} ` // "MULTIPLICATION_ASSIGNMENT"
}).replace(/[_\-a-zA-Z0-9]+ ?\-= ?[_\-a-zA-Z0-9]+/g, (match) => {
    let perameters = match.split("-=")
    let x = perameters[0], y = perameters[1]

    return ` ${x} = ${x} - ${y} ` // "SUBTRACTION_ASSIGNMENT"
})*/

// script = luamin.Beautify(script, {RenameVariables: true})

try {
    process.stdout.write(`[${chalk.blueBright("INFO")}] Generating Syntax Tree...`)
    parsed = luamin.Parse(script)//[0]
    console.log(` ${chalk.greenBright("Success")}`)
} catch {
    return console.log(` ${chalk.redBright("Syntax Error")}`)
}

try {
    process.stdout.write(`[${chalk.blueBright("INFO")}] Beautifying Syntax Tree...`)
    parsed = luamin.BeautifyAst(parsed, {RenameVariables: true, Format: true})
    console.log(` ${chalk.greenBright("Success")}`)
} catch (err) {
    console.log(err)
    console.log(` ${chalk.redBright("Failed")}`)

    return
}

// console.log(luamin.Print(parsed))

fs.readdirSync("./obfuscators").forEach(obfuscator => {
    const deobfuscator = require(`./obfuscators/${obfuscator}/deobfuscate`)

    if (deobfuscator.detect(script)) {
        console.log(`[${chalk.blueBright("INFO")}] Detected obfuscator: ${deobfuscator.name}`)
        bytecode = deobfuscator.deobfuscate(parsed)
        return
    }
})

if (bytecode != undefined) {
    fs.writeFileSync(outputFile, bytecode, "utf8")
} else {
    throw "Failed to detect obfuscator"
}