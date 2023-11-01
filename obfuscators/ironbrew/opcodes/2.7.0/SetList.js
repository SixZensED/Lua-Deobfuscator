module.exports = {
    SetList: {
        String: "local A = Inst[OP_A]; local T = Stk[A]; for Idx = A + 1, Inst[OP_B] do Insert(T, Stk[Idx]) end;",
        Create: function(instruction) {
            instruction.B -= instruction.A

            return instruction
        }
    },
    SetListB0: {
        String: "local A = Inst[OP_A]; local T = Stk[A]; for Idx = A + 1, Top do Insert(T, Stk[Idx]) end;",
        Create: function(instruction) {
            instruction.C = 0

            return instruction
        }
    },
    SetListC0: {
        String: "InstrPoint = InstrPoint + 1 local A = Inst[OP_A]; local T = Stk[A]; for Idx = A + 1, Inst[OP_B] do Insert(T, Stk[Idx]) end;",
        Create: function(instruction) {
            throw "big ass fucking table fuck"

            return instruction
        }
    }
}