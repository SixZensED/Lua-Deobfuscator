module.exports = {
    Div: {
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]]/Stk[Inst[OP_C]]",
        Create: function(instruction) {
            return instruction
        }
    },
    DivB: {
        String: "Stk[Inst[OP_A]] = Const[Inst[OP_B]] / Stk[Inst[OP_C]]",
        Create: function(instruction) {
            instruction.B += 255
            
            return instruction
        }
    },
    DivC: {
        String: "Stk[Inst[OP_A]] = Stk[Inst[OP_B]] / Const[Inst[OP_C]]",
        Create: function(instruction) {
            instruction.C += 255
            
            return instruction
        }
    },
    DivBC: {
        String: "Stk[Inst[OP_A]] = Const[Inst[OP_B]] / Const[Inst[OP_C]]",
        Create: function(instruction) {
            instruction.B += 255
	        instruction.C += 255
            
            return instruction
        }
    }
}