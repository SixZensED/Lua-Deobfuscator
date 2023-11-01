module.exports = {
    Eq: {
        String: "if(Stk[Inst[OP_A]]==Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 0 

            return instruction
        }
    },
    EqB: {
        String: "if(Inst[OP_A] == Stk[Inst[OP_C]]) then InstrPoint = InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 0
            
            return instruction
        }
    },
    EqC: {
        String: "if(Stk[Inst[OP_A]] == Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 0
            
            return instruction
        }
    },
    EqBC: {
        String: "if(Inst[OP_A] == Inst[OP_C]) then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 0 
            
            return instruction
        }
    },
    Ne: {
        String: "if(Stk[Inst[OP_A]]~=Stk[Inst[OP_C]])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.A = 1

            return instruction
        }
    },
    NeB: {
        String: "if(Inst[OP_A] ~= Stk[Inst[OP_C]]) then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.A = 1
            
            return instruction
        }
    },
    NeC: {
        String: "if(Stk[Inst[OP_A]] ~= Inst[OP_C]) then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    },
    NeBC: {
        String: "if(Inst[OP_A] ~= Inst[OP_C])then InstrPoint=InstrPoint+1;else InstrPoint=Inst[OP_B];end;",
        Create: function(instruction) {
            instruction.B = instruction.A + 255
	        instruction.C += 255
	        instruction.A = 1
            
            return instruction
        }
    }

}