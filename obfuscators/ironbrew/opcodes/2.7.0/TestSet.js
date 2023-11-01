module.exports = {
    TestSet: {
        String: "local B=Stk[Inst[OP_C]];if B then InstrPoint=InstrPoint+1;else Stk[Inst[OP_A]]=B;InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.C
	        instruction.C = 0
            
            return instruction
        }
    },
    TestSetC: {
        String: "local B=Stk[Inst[OP_C]];if not B then InstrPoint=InstrPoint+1;else Stk[Inst[OP_A]]=B;InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.C
	        instruction.C = 1
            
            return instruction
        }
    }
}