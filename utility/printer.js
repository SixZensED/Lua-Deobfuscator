let get_const_str = function(consts, idx) {
    const constant = consts[idx]

    switch (typeof constant) {
        case "boolean":
            return String(constant)
        case "number":
            return constant
        case "string":
            return `"${constant}"`
        case "object":
            return "nil"
    }
}

let get_operation = function(chunk, ins) {
    const constants = chunk.Constants

    let rk = function(r) {
        return r > 255 ? get_const_str(constants, r - 256) : `R${r}`
    }

    switch (ins.OpName) {
        case "Move":
            return `R${ins.A} = R${ins.B}`
        case "LoadK":
            return `R${ins.A} = ${get_const_str(constants, ins.B)}`
        case "LoadBool":
            return `R${ins.A} = ${String(Boolean(ins.B))} ${ins.C != 0 ? "; goto " + (ins.PC + 2) : ""}`
        case "LoadNil":
            let src = ""

            for (let i = ins.A + 1; i < ins.A + ins.B; i++) {
                src += `R${i}, `
            }

            src = src.substring(0, src.length - 2)

            return `${src} = nil`
        case "GetUpval":
            return `R${ins.A} = Upvalues[${ins.B}]`
        case "GetGlobal":
            return `R${ins.A} = _ENV[${get_const_str(constants, ins.B)}]`
        case "GetTable":
            return `R${ins.A} = R${ins.B}[${rk(ins.C)}]`
        case "SetUpval":
            return `Upvalues[${ins.B}] = R${ins.A}`
        case "SetGlobal":
            return `_ENV[${get_const_str(constants, ins.B)}] = R${ins.A}`
        case "SetTable":
            return `R${ins.A}[${rk(ins.B)}] = ${rk(ins.C)}`
        case "NewTable":
            return `R${ins.A} = {}`
        case "Self":
            return `R${ins.A + 1} = R${ins.B}; R${ins.A} = R${ins.B}[${rk(ins.C)}]`
        case "Add":
            return `R${ins.A} = ${rk(ins.B)} + ${rk(ins.C)}`
        case "Sub":
            return `R${ins.A} = ${rk(ins.B)} - ${rk(ins.C)}`
        case "Mul":
            return `R${ins.A} = ${rk(ins.B)} * ${rk(ins.C)}`
        case "Div":
            return `R${ins.A} = ${rk(ins.B)} / ${rk(ins.C)}`
        case "Mod":
            return `R${ins.A} = ${rk(ins.B)} % ${rk(ins.C)}`
        case "Pow":
            return `R${ins.A} = ${rk(ins.B)} ^ ${rk(ins.C)}`
        case "Unm":
            return `R${ins.A} = -R${ins.B}`
        case "Not":
            return `R${ins.A} = not R${ins.B}`
        case "Len":
            return `R${ins.A} = #R${ins.B}`
        case "Concat":
            return `R${ins.A} = R${ins.B} .. R${ins.C}`
        case "Jmp":
            return `goto ${ins.PC + ins.B + 1}`
        case "Eq":
            return `if ${rk(ins.B)} ${ins.A == 0 ? "==" : "~="} ${rk(ins.C)} goto ${ins.PC + 2}`;
        case "Lt":
            return `if ${rk(ins.B)} ${ins.A == 0 ? "< " : "> "} ${rk(ins.C)} goto ${ins.PC + 2}`;
        case "Le":
            return `if ${rk(ins.B)} ${ins.A == 0 ? "<=" : ">="} ${rk(ins.C)} goto ${ins.PC + 2}`;
        case "Test":
            return ``
        case "TestSet":
            return ``
        case "Call":
            let str = ""

            if (ins.C == 0) {
                str += `R${ins.A + 1} -> ??? = `
            } else if (ins.C == 1) {
                
            } else {
                // str += `R${ins.A} -> R${ins.A + ins.C - 2} = `

                for (let i = ins.A; i < ins.A + ins.C - 1; i++) {
                    str += `R${i}, `
                }

                str = str.substring(0, str.length - 2)
                str += " = "
            }

            str += `R${ins.A}(`

            if (ins.B == 0) {
                str += `R${ins.A} -> R${chunk.Registers}`
            } else if (ins.B == 1) {

            } else {
                // str += `R${ins.A + 1} -> R${ins.A + ins.B - 1}`

                for (let i = ins.A + 1; i < ins.A + ins.B; i++) {
                    str += `R${i}, `
                }

                str = str.substring(0, str.length - 2)
            }

            return str + ")"
    }
}

module.exports = function(devirtualized) {
    let chunk_count = 1

    console.log(" ")

    let do_print = function(chunk, depth) {
        const padding = "\t".repeat(depth)
        const chunk_idx = chunk_count
    
        chunk_count += 1
    
        console.log(padding + `function func${chunk_idx}(${Array.from({length: chunk.Parameters}, (_, i) => `arg${i + 1}`).join(", ")})`)
        console.log()
    
        for (let i = 0; i < chunk.Constants.length; i++) {
            let constant = chunk.Instructions[i]
    
            console.log(padding + `\t.const ${get_const_str(chunk.Constants, i)}`)
        }
    
        console.log()
    
        let longest_opname = -1
        let counter_len = String(chunk.Instructions.length).length
    
        for (let i = 0; i < chunk.Instructions.length; i++) {
            let instruction = chunk.Instructions[i]
            let instruction_len = instruction.OpName.length
    
            if (instruction_len > longest_opname) {
                longest_opname = instruction_len
            }
        }
    
        for (let i = 0; i < chunk.Instructions.length; i++) {
            let instruction = chunk.Instructions[i]
    
            let info = get_operation(chunk, instruction)
            
            info = info ? " | " + info : ""
    
            // console.log(instruction)
    
            console.log(padding + `\t[${String(i).padStart(counter_len, "0")}] => ${instruction.OpName.padStart(longest_opname)}: {   -,   -,   - }${info}`)
        }
    
        console.log()
    
        for (let i = 0; i < chunk.Prototypes.length; i++) {
            do_print(chunk.Prototypes[i], depth + 1)
        }
    
        console.log(padding + "end")
    }
    
    do_print(devirtualized, 0)
}