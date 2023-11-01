module.exports = {
    Concat: {
        String: "local B=Inst[OP_B];local K=Stk[B] for Idx=B+1,Inst[OP_C] do K=K..Stk[Idx];end;Stk[Inst[OP_A]]=K;",
        Create: function(instruction) {
            return instruction
        }
    }
}