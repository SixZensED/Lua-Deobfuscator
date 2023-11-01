module.exports = {
    Pow: {
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]]^Stk[Inst[OP_C]]",
        Create: function(instruction) {
            return instruction
        }
    },
    PowB: {
        String: "Stk[Inst[OP_A]] = Inst[OP_B] ^ Stk[Inst[OP_C]]",
        Create: function(instruction) {
            instruction.B += 255
            
            return instruction
        }
    },
    PowC: {
        String: "Stk[Inst[OP_A]] = Stk[Inst[OP_B]] ^ Inst[OP_C]",
        Create: function(instruction) {
            instruction.C += 255
            
            return instruction
        }
    },
    PowBC: {
        String: "Stk[Inst[OP_A]] = Inst[OP_B] ^ Inst[OP_C]",
        Create: function(instruction) {
            instruction.B += 255
	        instruction.C += 255
            
            return instruction
        }
    }
}