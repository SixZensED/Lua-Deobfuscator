module.exports = {
    SetGlobal: {
        Thorough: true,
        String: "Env[Inst[OP_B]] = Stk[Inst[OP_A]];",
        Create: function(instruction) {
            instruction.B--

            return instruction
        }
    }
}