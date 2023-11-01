const chalk = require("chalk")

function unopexpr(exp) {
    switch (exp.Token_Op.Source) {
        case "#":
            exp = exp.Rhs.Type == "ParenExpr" ? exp.Rhs.Expression : exp.Rhs

            switch (exp.Type) {
                case "StringLiteral":
                    return exp.Token.Source.length
                case "TableLiteral":
                    return exp.EntryList.length
                default:
                    throw "Unhandled type while evaluating UnopExpr"
            }
        case "-":
            throw "lol"
        default:
            throw `Unhandled UnopExpr Type ${exp.Token_Op.Source}`
    }
}

function decompress(bytestring, key) {
    const words = Array(256).fill(0).map((v,i) => String.fromCharCode(i))
    const bytes = []

    let position = 0
    let current

    while (position < bytestring.length) {
        const length = parseInt(bytestring[position], 36)
        position++
        const entry = parseInt(bytestring.substring(position, position + length), 36)
        position += length
        let word

        if (current == undefined) {
            current = String.fromCharCode(entry)
            bytes.push(current)
            continue
        }

        if (words[entry]) {
            word = words[entry]
        } else {
            word = current + current[0]
        }

        words.push(current + word[0])
        bytes.push(word)
        current = word
    }

    return Buffer.from(bytes.map(v => v.split("").map(x => x.charCodeAt(0) ^ key)).flat())
}

function decode(bytestring, key) { 
    const encoded = bytestring.split("\\")
    const bytes = []

    for (let i = 0; i < encoded.length; i++) {
        bytes[i] = encoded[i] ^ key
    }

    return Buffer.from(bytes)
}

function expression(lhs, operator, rhs) { // p1000
    switch (operator) {
        case "==" : return lhs == rhs
        case "~=" : return lhs != rhs
        case "<=" : return lhs <= rhs
        case ">=" : return lhs >= rhs
        case "<" : return lhs < rhs
        case ">" : return lhs > rhs
        case "-" : return lhs - rhs
        case "+" : return lhs + rhs
        case "/" : return lhs / rhs
        case "^" : return lhs ^ rhs
        case "*" : return lhs * rhs
        case "%" : return lhs % rhs
    }
    
    throw `Unsupported operator ${operator}`
}

function gbit(bit, start, end) { // (bit >> start) & (end - 1) wasnt working??? extract_int_from_bit
    if (end) {
        const res = (bit / 2 ** (start - 1)) % 2 ** ((end - 1) - (start - 1) + 1)

        return res - res % 1
    } else {
        throw "no ended bit??"
    }
}

module.exports = {
    unopexpr,
    expression,
    decompress,
    decode,
    gbit
}