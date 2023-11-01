module.exports = {
    LoadBool: {
        String: "Stk[Inst[OP_A]]=(Inst[OP_B]~=0);",
        Create: function(instruction) {
            return instruction
        }
    },
    LoadBoolC: {
        String: "Stk[Inst[OP_A]]=(Inst[OP_B]~=0);InstrPoint=InstrPoint+1;",
        Create: function(instruction) {
            instruction.C = 1

            return instruction
        }
    }
}