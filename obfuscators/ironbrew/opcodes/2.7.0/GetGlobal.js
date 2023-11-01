module.exports = {
    GetGlobal: {
        Thorough: true,
        String: "Stk[Inst[OP_A]]=Env[Const[Inst[OP_B]]];",
        Create: function(instruction) {
            instruction.B--
            
            return instruction
        }
    }
}