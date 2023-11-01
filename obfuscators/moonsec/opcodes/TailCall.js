module.exports = {
    TailCall: {
        String: "local A = Inst[OP_A]; do return Stk[A](Unpack(Stk, A + 1, Inst[OP_B])) end;",
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1 
            
            return instruction
        }
    },
    TailCallB0: {
        String: "local A = Inst[OP_A]; do return Stk[A](Unpack(Stk, A + 1, Top)) end;",
        Create: function(instruction) {
            return instruction
        }
    },
    TailCallB1: {
        String: "do return Stk[Inst[OP_A]](); end;",
        Create: function(instruction) {
            return instruction
        }
    },
}