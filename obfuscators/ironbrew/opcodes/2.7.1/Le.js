module.exports = {
    Le: {
        Thorough: true,
        String: "if(Stk[Inst[OP_A]]<=Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 0 

            return instruction
        }
    },
    LeB: {
        Thorough: true,
        String: "if(Inst[OP_A] <= Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 0
            
            return instruction
        }
    },
    LeC: {
        Thorough: true,
        String: "if(Stk[Inst[OP_A]] <= Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 0
            
            return instruction
        }
    },
    LeBC: {
        Thorough: true,
        String: "if(Inst[OP_A] <= Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 0 
            
            return instruction
        }
    },
    Gt: {
        Thorough: true,
        String: "if (Stk[Inst[OP_A]] <= Stk[Inst[OP_C]]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 1

            return instruction
        }
    },
    GtB: {
        Thorough: true,
        String: "if (Inst[OP_A] <= Stk[Inst[OP_C]]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 1
            
            return instruction
        }
    },
    GtC: {
        Thorough: true,
        String: "if (Stk[Inst[OP_A]] <= Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    },
    GtBC: {
        Thorough: true,
        String: "if (Inst[OP_A] <= Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    }
}