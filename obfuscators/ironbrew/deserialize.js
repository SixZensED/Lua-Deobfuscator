const chalk = require("chalk")
const { SmartBuffer } = require("smart-buffer")
const emulation = require("../ironbrew/emulation")

function xor(a,b) { // lua xor is different from js when numbers bigger than (int|uint)
    let p=1,c=0
    while (a>0 && b>0) {
        let ra=a%2,rb=b%2
        if (ra!=rb) { c=c+p }
        a=(a-ra)/2,b=(b-rb)/2,p=p*2
    }
    if (a<b) { a=b }
    while (a>0) {
        let ra=a%2
        if (ra>0) { c=c+p }
        a=(a-ra)/2,p=p*2
    }
    return c
}

module.exports = function(vmdata, debug) {
    if (debug) console.log()

    /** @type {SmartBuffer} */
    const bytecode = vmdata.Bytecode
    const bformat = vmdata.BytecodeFormat
    const cformat = vmdata.ConstantFormat
    let curchunk = 0

    function deserialize() {
        const constants = [],
              instructions = [],
              prototypes = [],
              lineinfo = [],
              top = curchunk == 0

        let parameters

        let registers = []

        function add_register(register) {
            if (register != undefined && registers.indexOf(Math.abs(register)) == -1 && Math.abs(register) < 256) { // > 255 is reserved for constants
                registers.push(Math.abs(register))
            }
        }

        curchunk++

        for (let i = 0; i < bformat.length; i++) {
            switch (bformat[i]) {
                case "Constants": {
                    const count = bytecode.readUInt32LE()
    
                    for (let k = 0; k < count; k++) {
                        switch (bytecode.readUInt8()) {
                            case cformat.Bool:
                                constants.push(!!bytecode.readUInt8())
                                continue
                            case cformat.Float:
                                constants.push(bytecode.readDoubleLE())
                                continue
                            case cformat.String:
                                constants.push(bytecode.readString(bytecode.readUInt32LE()))
                                continue
                            default:
                                constants.push(null) // pretty sure they just use loadnil but whatever
                                continue
                        }
                    }
            
                    continue;
                }
                case "Instructions": {
                    const count = bytecode.readUInt32LE()

                    for (let k = 0; k < count; k++) {
                        if (vmdata.Version == "IronBrew V2.7.0") {
                            const data1 = xor(bytecode.readUInt32LE(), vmdata.Keys.Secondary) // bytecode.readUInt32LE() ^ vmdata.Keys.Secondary
                            const data2 = xor(bytecode.readUInt32LE(), vmdata.Keys.Tertiary) // bytecode.readUInt32LE() ^ vmdata.Keys.Tertiary
                            
                            const type = emulation.gbit(data1, 1, 2)
                            const opco = emulation.gbit(data2, 1, 11)

                            const instruction = {
                                Enum: opco,
                                Data: data2
                            }

                            switch (type) {
                                case 0: // ABC
                                        instruction.A = emulation.gbit(data1, 3, 11)
                                        instruction.B = emulation.gbit(data1, 12, 20)
                                        instruction.C = emulation.gbit(data1, 21, 29)
                                        break;
                                    case 1: // ABx
                                        instruction.A = emulation.gbit(data1, 3, 11)
                                        // instruction.B = emulation.gbit(data1, 12, 20)
                                        instruction.B = emulation.gbit(data2, 12, 33)
                                        break;
                                    case 2: // AsBx
                                        instruction.A = emulation.gbit(data1, 3, 11)
                                        // instruction.B = emulation.gbit(data1, 12, 20) - 1048575
                                        instruction.B = emulation.gbit(data2, 12, 32) - 1048575
                                        break;
                                    case 3: // AsBxC
                                        instruction.A = emulation.gbit(data1, 3, 11)
                                        // instruction.B = emulation.gbit(data1, 12, 20) - 1048575
                                        instruction.B = emulation.gbit(data2, 12, 32) - 1048575
                                        instruction.C = emulation.gbit(data1, 21, 29)
                                        break;
                            }

                            add_register(instruction.A)
                            add_register(instruction.B)
                            add_register(instruction.C)

                            instructions.push(instruction)
                        } else {
                            const descriptor = bytecode.readUInt8()

                            if ((descriptor & 0b00000001) == 0) {
                                const instruction = {
                                    Enum: bytecode.readUInt16LE()
                                }
    
                                switch ((descriptor & 0b00000110) >> 1) { // if its not data
                                    case 0: // ABC
                                        instruction.A = bytecode.readUInt16LE()
                                        instruction.B = bytecode.readUInt16LE()
                                        instruction.C = bytecode.readUInt16LE()
                                        break;
                                    case 1: // ABx
                                        instruction.A = bytecode.readUInt16LE()
                                        instruction.B = bytecode.readUInt32LE()
                                        break;
                                    case 2: // AsBx
                                        instruction.A = bytecode.readUInt16LE()
                                        instruction.B = bytecode.readUInt32LE() - 65536
                                        break;
                                    case 3: // AsBxC
                                        instruction.A = bytecode.readUInt16LE()
                                        instruction.B = bytecode.readUInt32LE() - 65536
                                        instruction.C = bytecode.readUInt16LE()
                                        break;
                                }

                                add_register(instruction.A)
                                add_register(instruction.B)
                                add_register(instruction.C)
    
                                instructions.push(instruction)
                            }
                        }
                    }

                    continue;
                }
                case "Prototypes": {
                    const count = bytecode.readUInt32LE()

                    /*if (debug) {
                        console.log(`[${chalk.magentaBright("OUT")}] Chunk [${curchunk}]:`)
                        console.log(`[${chalk.magentaBright("OUT")}] ${constants.length} Constants`)
                        console.log(`[${chalk.magentaBright("OUT")}] ${instructions.length} Instructions`)
                        console.log(`[${chalk.magentaBright("OUT")}] ${count} Prototypes`)
                        console.log(`[${chalk.magentaBright("OUT")}] ${parameters.Size} Parameters`)
                    }*/

                    //console.log(curchunk, ":", constants)

                    /*console.log({
                        Constants: constants,
                        Instructions: instructions,
                        Prototypes: prototypes,
                        Parameters: parameters,
                    })*/

                    //constants.forEach((a, b) => console.log(b, a))
            
                    //throw "lollfsdfsdfsdfsdf"

                    for (let k = 0; k < count; k++) {
                        prototypes.push(deserialize())
                    }
    
                    continue;
                }
                case "Parameters": {
                    parameters = bytecode.readUInt8()
    
                    continue;
                }
                case "Debug": {
                    const count = bytecode.readUInt32LE()

                    for (let k = 0; k < count; k++) {
                        lineinfo.push(bytecode.readUInt32LE())
                    }
    
                    continue;
                }
            }
        }

        return {
            Constants: constants,
            Instructions: instructions,
            Prototypes: prototypes,
            Parameters: parameters,
            Registers: registers.length + parameters,
            LineInfo: lineinfo,
            Top: top
        }
    }

    if (!debug) console.log(` ${chalk.greenBright("Success")}`)

const x = deserialize()

// console.log(x)

    return {
        Chunk: x,
        Tokens: vmdata.Tokens,
        Version: vmdata.Version
    }
}