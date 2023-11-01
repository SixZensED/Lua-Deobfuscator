module.exports = {
    Mul: {
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]]*Stk[Inst[OP_C]]",
        Create: function(instruction) {
            return instruction
        }
    },
    MulB: {
        String: "Stk[Inst[OP_A]] = Inst[OP_B] * Stk[Inst[OP_C]]",
        Create: function(instruction) {
            instruction.B += 255
            
            return instruction
        }
    },
    MulC: {
        String: "Stk[Inst[OP_A]] = Stk[Inst[OP_B]] * Inst[OP_C]",
        Create: function(instruction) {
            instruction.C += 255
            
            return instruction
        }
    },
    MulBC: {
        String: "Stk[Inst[OP_A]] = Inst[OP_B] * Inst[OP_C]",
        Create: function(instruction) {
            instruction.B += 255
	        instruction.C += 255
            
            return instruction
        }
    }
}