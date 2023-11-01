module.exports = {
    Lt: {
        Thorough: true,
        String: "if(Stk[Inst[OP_A]] < Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 0 

            return instruction
        }
    },
    LtB: {
        Thorough: true,
        String: "if(Inst[OP_A] < Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 0
            
            return instruction
        }
    },
    LtC: {
        Thorough: true,
        String: "if(Stk[Inst[OP_A]] < Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 0
            
            return instruction
        }
    },
    LtBC: {
        Thorough: true,
        String: "if(Inst[OP_A] < Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 0 
            
            return instruction
        }
    },
    Ge: {
        Thorough: true,
        String: "if (Stk[Inst[OP_A]]<Stk[Inst[OP_C]])then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 1

            return instruction
        }
    },
    GeB: {
        Thorough: true,
        String: "if (Inst[OP_A] < Stk[Inst[OP_C]]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 1
            
            return instruction
        }
    },
    GeC: {
        Thorough: true,
        String: "if (Stk[Inst[OP_A]] < Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    },
    GeBC: {
        Thorough: true,
        String: "if (Inst[OP_A] < Inst[OP_C]) then InstrPoint=Inst[OP_B]; else InstrPoint=InstrPoint+1; end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    }
}