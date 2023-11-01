module.exports = {
    Jmp: {
        Thorough: true,
        String: "InstrPoint=Inst[OP_B];",
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.PC - 1 
            
            return instruction
        }
    }
}