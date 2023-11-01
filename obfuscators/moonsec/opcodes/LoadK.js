module.exports = {
    LoadK: {
        Thorough: true,
        String: "Stk[Inst[OP_A]] = Inst[OP_B];",
        Create: function(instruction) {
            instruction.B--

            //console.log(instruction)
            
            return instruction
        }
    }
}