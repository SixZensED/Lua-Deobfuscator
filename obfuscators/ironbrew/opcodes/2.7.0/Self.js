module.exports = {
    Self: {
        String: "local A=Inst[OP_A];local B=Stk[Inst[OP_B]];Stk[A+1]=B;Stk[A]=B[Stk[Inst[OP_C]]];",
        Create: function(instruction) {
            return instruction
        }
    },
    SelfC: {
        String: "local A=Inst[OP_A];local B=Stk[Inst[OP_B]];Stk[A+1]=B;Stk[A]=B[Const[Inst[OP_C]]];",
        Create: function(instruction) {
            instruction.C += 255
            
            return instruction
        }
    }
}