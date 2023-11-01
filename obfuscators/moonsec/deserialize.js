const chalk = require("chalk")
const { SmartBuffer } = require("smart-buffer")
const emulation = require("../moonsec/emulation")
const substring = require("unicode-substring")

function gBit(L_75_arg0, L_76_arg1, L_77_arg2) {
    if (L_77_arg2) {
        let L_78_ = (L_75_arg0 / 2 ** (L_76_arg1 - 1)) % 2 ** ((L_77_arg2 - 1) - (L_76_arg1 - 1) + 1)

        return L_78_ - L_78_ % 1
    } else {
        let L_79_ = 2 ** (L_76_arg1 - 1)

        return (L_75_arg0 % (L_79_ + L_79_) >= L_79_) ? 1 : 0
    }

    /*let mask = ((1<<(end-start+1))-1) << start
	return (num & mask) >> start*/
}

function ldexp(mantissa, exponent) {
    var steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    var result = mantissa;
    for (var i = 0; i < steps; i++)
        result *= Math.pow(2, Math.floor((exponent + i) / steps));
    return result;
}

class moonsec_reader { // pasted from moonsec $$$
    constructor (bytes, stuff) {
        this.L_47_ = bytes
        this.L_50_ = stuff.C - 1 // should be 0 (position of reader)
        this.L_48_ = stuff.A
        this.L_49_ = stuff.B
    }

    gAscii(len = 1) {
        let bytes = []

        for (let i = 0; i < len; i++) {
            bytes.push(this.L_47_[this.L_50_])

            this.L_50_ += 1
        }

        return bytes
    }

    gBits32() {
        let [ L_65_, L_66_, L_67_, L_68_ ] = this.gAscii(4)

        this.L_49_ = (this.L_49_ + (this.L_48_ * 4)) % 256

        return (((L_68_ + this.L_49_ - (this.L_48_) + 2048) % 256) * (16777216)) + (((L_67_ + this.L_49_ - (this.L_48_ * 2) + 2048) % 256) * (65536)) + (((L_66_ + this.L_49_ - (this.L_48_ * 3) + 2048) % 256) * 256) + ((L_65_ + this.L_49_ - (this.L_48_ * 4) + 2048) % 256)
    }

    gBits8() {
        let L_72_ = this.gAscii()[0]

		this.L_49_ = (this.L_49_ + (this.L_48_)) % 256

		return ((L_72_ + this.L_49_ - (this.L_48_) + 2048) % 256)
    }

    gBits16() {
        let [ L_73_, L_74_ ] = this.gAscii(2)

        this.L_49_ = (this.L_49_ + (this.L_48_ * 2)) % 256

        return (((L_74_ + this.L_49_ - (this.L_48_) + 2048) % 256) * 256) + ((L_73_ + this.L_49_ - (this.L_48_ * 2) + 2048) % 256)
    }

    gFloat() {
        let Left = this.gBits32();
		let Right = this.gBits32();
		let IsNormal = 1
		let Mantissa = (gBit(Right, 1, 20) * (2 ** 32)) + Left;

		let Exponent = gBit(Right, 21, 31);
		let Sign = ((-1) ** gBit(Right, 32));

		if (Exponent == 0) {
			if (Mantissa == 0) {
				return Sign * 0 // +-0
            } else {
				Exponent = 1
				IsNormal = 0
            }
        } else if (Exponent == 2047) {
			if (Mantissa == 0) {
				return Sign * (1 / 0) // +-Inf
            } else {
				return Sign * (0 / 0) // +-Q/Nan
			}
        }

		// sign * 2**e-1023 * isNormal.mantissa
		return ldexp(Sign, Exponent - 1023) * (IsNormal + (Mantissa / (2 ** 52)))
    }

    gString(L_86_arg0, L_87_arg1, L_88_arg2) {
        let L_89_;
        if (L_86_arg0 == undefined) {
            L_86_arg0 = this.gBits32();
            if (L_86_arg0 == 0) {
                return "";
            };
        };
        L_89_ = this.L_47_.map(s=>String.fromCharCode(s)).join("").substring(this.L_50_, this.L_50_ + L_86_arg0);
        this.L_50_ = this.L_50_ + L_86_arg0;
        let L_90_ = ""
        for (let L_91_forvar0 = 1; L_91_forvar0 < L_89_.length + 1; L_91_forvar0++) {
            L_90_ = L_90_ + String.fromCharCode(((L_89_.substring(L_91_forvar0 - 1, L_91_forvar0)).charCodeAt(0) + this.L_49_) % 256) // string + string -> concat
            this.L_49_ = (this.L_49_ + this.L_48_) % 256
        }
        return L_90_;
    }
}

module.exports = function(vmdata, debug) {
    if (debug) console.log()
    
    let bformat = vmdata.BytecodeFormat
    let cformat = vmdata.ConstantFormat
    let rconsts = vmdata.ReaderConsts

    let reader = new moonsec_reader(vmdata.Bytecode, rconsts)
    let count = 0

    function deserialize() {
        let constants = [],
            instructions = [],
            prototypes = [],
            parameters,
            top = count == 0

        let registers = []

        function add_register(register) {
            if (register != undefined && registers.indexOf(Math.abs(register)) == -1 && Math.abs(register) < 256) { // > 255 is reserved for constants
                registers.push(Math.abs(register))
            }
        }

        // console.log("NEW_CHUNK")

        count++

        for (let i = 0; i < bformat.length; i++) {
            switch (bformat[i]) {
                case "Parameters":
                    parameters = reader.gBits8()
                    // console.log("Parameters", parameters)

                    continue
                case "Prototypes":
                    let proto_count = reader.gBits32()
                    // console.log("Prototypes", proto_count)

                    for (let k = 1; k < proto_count + 1; k++) {
                        // console.log(k - 1) --> freak?
                        prototypes[k - 1] = deserialize()
                        //prototypes.push(deserialize())
                    }

                    continue
                case "Constants":
                    let const_count = reader.gBits32()
                    // console.log("Constants", const_count)

                    for (let k = 0; k < const_count; k++) {
                        let L_110_ = reader.gBits8()
			
                        switch (L_110_ % rconsts.D) {
                            case cformat.Bool:
                                constants.push(!(0 == reader.gBits8()))

                                break
                            case cformat.Float:
                                constants.push(reader.gFloat())

                                break
                            case cformat.String:
                                constants.push(reader.gString())

                                break
                            case cformat.Encoded:
                                let L_104_ = reader.gString()
                                let L_105_ = ""
                                let L_106_ = 1
                                for (let L_107_forvar0 = 0; L_107_forvar0 < L_104_.length; L_107_forvar0++) {
                                    L_106_ = (L_106_ + rconsts.CKey) % 256
						            L_105_ = L_105_ + String.fromCharCode(((substring(L_104_, L_107_forvar0 + 1, L_107_forvar0)).charCodeAt(0) + L_106_) % 256)
                                }

                                constants.push(L_105_)

                                break
                        }
                    }
                    
                    continue
                case "Instructions":
                    let inst_count = reader.gBits32()

                    for (let k = 0; k < inst_count; k++) {
                        let L_114_ = reader.gBits8()
                        if (gBit(L_114_, 1, 1) == 0) {
                            let L_115_ = gBit(L_114_, 2, 3)
                            let L_116_ = gBit(L_114_, 4, 6)
                            let L_117_ = {
                                Enum: reader.gBits16(),
                                A: reader.gBits16(),
                            }

                            switch (L_115_) {
                                case 0:
                                    L_117_.B = reader.gBits16()
                                    L_117_.C = reader.gBits16()

                                    break
                                case 1:
                                    L_117_.B = reader.gBits32()

                                    break
                                case 2:
                                    L_117_.B = reader.gBits32() - 65536

                                    break
                                case 3:
                                    L_117_.B = reader.gBits32() - 65536
                                    L_117_.C = reader.gBits16()

                                    break
                            }

                            add_register(L_117_.A)
                            add_register(L_117_.B)
                            add_register(L_117_.C)

                            // not sure if i need to do this?? i dont think so as its still the correct index within the constants but we'll see
                            // ok ignore ubove, so the obfuscator has a feature called "anti dump" that just fucks the indexes of the constants
                            // so i can use this to get the correct index

                            if (gBit(L_116_, 1, 1) == 1) {
						        //L_117_.KstA = constants[L_117_.A]
                                //console.log(`${L_117_.A} -> ${constants[L_117_.A - 1]}`)
                            }
                            if (gBit(L_116_, 2, 2) == 1) {
                                //L_117_.KstB = constants[L_117_.B]
                                //console.log(`${L_117_.B} -> ${constants[L_117_.B - 1]}`)
                            }
                            if (gBit(L_116_, 3, 3) == 1) {
                                //L_117_.KstC = constants[L_117_.C]
                                //console.log(`${L_117_.C} -> ${constants[L_117_.C - 1]}`)
                            }

                            instructions.push(L_117_)
                        }
                    }

                    //console.log(instructions)
                    //throw "iyo"

                    continue
            }
        }

        //console.log(constants)

        return {
            Constants: constants,
            Instructions: instructions,
            Prototypes: prototypes,
            Parameters: parameters,
            Registers: registers.length + parameters,
            Top: top
        }
    }

    vmdata.Chunk = deserialize()

    //console.log(vmdata.Chunk)
    //console.log(JSON.stringify(vmdata.Chunk, null, 4))
    
    return vmdata
}