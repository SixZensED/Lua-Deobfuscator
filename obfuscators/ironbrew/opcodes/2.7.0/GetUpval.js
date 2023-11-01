module.exports = {
    GetUpval: {
        Thorough: true,
        String: "Stk[Inst[OP_A]]=Upvalues[Inst[OP_B]];",
        Create: function(instruction) {
            return instruction
        }
    }
}