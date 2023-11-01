module.exports = {
    Test: {
        String: "if Stk[Inst[OP_A]] then InstrPoint=InstrPoint + 1; else InstrPoint = Inst[OP_B]; end;",
        Create: function(instruction) {
            instruction.B = 0
            instruction.C = 0
            
            return instruction
        }
    },
    TestC: {
        String: "if not Stk[Inst[OP_A]] then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = 0
            instruction.C = 1
            
            return instruction
        }
    }
}