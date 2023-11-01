module.exports = {
    Closure: {
        String: "local A=Inst[OP_A];local B=Inst[OP_B];for Idx=A,B do Stk[Idx]=Vararg[Idx-A];end;",
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    ClosureNU: {
        String: "local A=Inst[OP_A];Top=A+Varargsz-1;for Idx=A,Top do local VA=Vararg[Idx-A];Stk[Idx]=VA;end;",
        Create: function(instruction) {
            return instruction
        }
    }
}