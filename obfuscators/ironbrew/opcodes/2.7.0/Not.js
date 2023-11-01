module.exports = {
    Not: {
        Thorough: true,
        String: "Stk[Inst[OP_A]]=(not Stk[Inst[OP_B]]);",
        Create: function(instruction) {
            return instruction
        }
    }
}