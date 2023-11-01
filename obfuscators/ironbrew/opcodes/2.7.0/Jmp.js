module.exports = {
    Jmp: {
        Thorough: true,
        String: "InstrPoint = InstrPoint + Inst[OP_B]",
        Create: function(instruction) {
            return instruction
        }
    }
}