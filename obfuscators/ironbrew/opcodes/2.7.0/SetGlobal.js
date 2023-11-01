module.exports = {
    SetGlobal: {
        Thorough: true,
        String: "Env[Const[Inst[OP_B]]] = Stk[Inst[OP_A]];",
        Create: function(instruction) {
            instruction.B--

            return instruction
        }
    }
}