module.exports = {
    GetTable: {
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]][Stk[Inst[OP_C]]];",
        Create: function(instruction) {
            return instruction
        }
    },
    GetTableConst: {
        String: "Stk[Inst[OP_A]]=Stk[Inst[OP_B]][Inst[OP_C]];",
        Create: function(instruction) {
            instruction.C += 255
            
            return instruction
        }
    }
}