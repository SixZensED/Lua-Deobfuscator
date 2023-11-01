const fs = require("fs")
const chalk = require("chalk")
const substring = require("unicode-substring")

function decompress(compressedStr) { // very slow
    let codeDictSize = 1;
    let currentCharCode = 16;
    let codeDict = {
        codes: [], 
        values: []
    };
    let dictIndex = -1;
    let currentIndex = currentCharCode + 1;

    while (true) {
        codeDict[substring(compressedStr, currentIndex - 1, (function() {
            currentIndex = codeDictSize + currentIndex
            return currentIndex - 1
        })())] = (function() {
            dictIndex = dictIndex + 1
            return dictIndex
        })()
        if (dictIndex == (16 - 1)) {
            dictIndex = "";
            currentCharCode = 0;
            break
        }
    }
    let compressedLength = compressedStr.length
    while (currentIndex < compressedLength + 1) {
        codeDict.values[currentCharCode] = substring(compressedStr, currentIndex - 1, (function() {
            currentIndex = codeDictSize + currentIndex
            return currentIndex - 1
        })())
        currentCharCode = currentCharCode + 1
        if (currentCharCode % 2 == 0) {
            currentCharCode = 0
            codeDict.codes.push(String.fromCharCode((codeDict[codeDict.values[0]] * 16) + codeDict[codeDict.values[1]]))
        }
    }
    return Array.from(codeDict.codes.join("")).map(char => char.charCodeAt(0))
}

function string(str) { // parse a lua string
    return str.replace(/\\([0-9]+)/g, (match, byte) => {
        return String.fromCharCode(Number(byte))
    })
}

function decrypt_constant(A0_12, A2_14) {
    A0_12 = string(A0_12)

    let L3_15 = 1
    let L4_16 = ""
    for (let L8_20 = 0; L8_20 < A0_12.length; L8_20++) {
        L4_16 = L4_16 + String.fromCharCode((substring(A0_12, L8_20, L8_20 + 1).charCodeAt(0) + L3_15) % 256)
        L3_15 = (L3_15 + A2_14) % 256
    }
    return L4_16
}

// console.log(decrypt_constant("b \\209\\137,\\231\\159", 78)) -> "content"
// ironbrew string encryption is far better than this?

function encode_string(string) { // p1000
    let bytes = string.split("")

    return bytes.map(byte => {
        return `\\${byte.charCodeAt(0)}`
    }).join("")
}

function expression(lhs, operator, rhs) { // p1000
    switch (operator) {
        case "=="  : return lhs == rhs
        case "~="  : return lhs != rhs
        case "<="  : return lhs <= rhs
        case ">="  : return lhs >= rhs
        case "<"   : return lhs < rhs
        case ">"   : return lhs > rhs
        case "-"   : return lhs - rhs
        case "+"   : return lhs + rhs
        case "/"   : return lhs / rhs
        case "^"   : return lhs ** rhs
        case "*"   : return lhs * rhs
        case "%"   : return lhs % rhs
        case "and" : return lhs && rhs
        case "or"  : return lhs || rhs
        case ".."  : return String(lhs) + String(rhs) // lua p100
        case "-="  : return lhs -= rhs
    }
    
    throw `Unsupported operator ${operator}`
}

module.exports = {
    decrypt_constant,
    encode_string,
    expression,
    decompress,
    // decode,
    string
}