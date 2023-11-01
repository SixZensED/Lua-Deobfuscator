module.exports = {
    LoadNil: {
        String: "for Idx=Inst[OP_A],Inst[OP_B] do Stk[Idx]=nil;end;",
        Create: function(instruction) {
            return instruction
        }
    }
}