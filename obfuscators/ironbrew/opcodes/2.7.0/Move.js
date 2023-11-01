module.exports = {
    Move: {
        Thorough: true,
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]];",
        Create: function(instruction) {
            return instruction
        }
    }
}