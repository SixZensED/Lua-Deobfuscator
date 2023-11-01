module.exports = {
    SetUpval: {
        Thorough: true,
        String: "Upvalues[Inst[OP_B]]=Stk[Inst[OP_A]];",
        Create: function(instruction) {
            return instruction
        }
    }
}