module.exports = {
    Return: {
        String: "local A = Inst[OP_A];\ndo return Unpack(Stk, A, A + Inst[OP_B]) end;",
        Create: function(instruction) {
            instruction.B += 2
            
            return instruction
        }
    },
    ReturnB2: {
        String: "do return Stk[Inst[OP_A]] end",
        Create: function(instruction) {
            return instruction
        }
    },
    ReturnB3: {
        String: "local A = Inst[OP_A];\ndo return Stk[A], Stk[A + 1] end",
        Create: function(instruction) {
            return instruction
        }
    },
    ReturnB0: {
        String: "local A = Inst[OP_A];\ndo return Unpack(Stk, A, Top) end;",
        Create: function(instruction) {
            return instruction
        }
    },
    ReturnB1: {
        String: "do return end;",
        Create: function(instruction) {
            return instruction
        }
    }
}