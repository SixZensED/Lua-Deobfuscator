module.exports = {
    Call: {
        String: `local A = Inst[OP_A]
        local Results = { Stk[A](Unpack(Stk, A + 1, Inst[OP_B])) };
        local Edx = 0;
        for Idx = A, Inst[OP_C] do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end`,
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    CallB2: {
        String: `local A = Inst[OP_A]
        local Results = { Stk[A](Stk[A + 1]) };
        local Edx = 0;
        for Idx = A, Inst[OP_C] do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end`,
        Create: function(instruction) {
            instruction.C = instruction.C - instruction.A + 2
            
            return instruction
        }
    },
    CallB0: {
        String: `local A = Inst[OP_A]
        local Results = { Stk[A](Unpack(Stk, A + 1, Top)) };
        local Edx = 0;
        for Idx = A, Inst[OP_C] do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end`,
        Create: function(instruction) {
            instruction.C = instruction.C - instruction.A + 2
            
            return instruction
        }
    },
    CallB1: {
        String: `local A = Inst[OP_A]
        local Results = { Stk[A]() };
        local Limit = Inst[OP_C];
        local Edx = 0;
        for Idx = A, Limit do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end`,
        Create: function(instruction) {
            instruction.C = instruction.C - instruction.A + 2
            
            return instruction
        }
    },
    CallC0: {
        String: `local A = Inst[OP_A]
        local Results, Limit = _R(Stk[A](Unpack(Stk, A + 1, Inst[OP_B])))
        Top = Limit + A - 1
        local Edx = 0;
        for Idx = A, Top do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end;`,
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    CallC0B2: {
        String: `local A = Inst[OP_A]
        local Results, Limit = _R(Stk[A](Stk[A + 1]))
        Top = Limit + A - 1
        local Edx = 0;
        for Idx = A, Top do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end;`,
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    CallC1: {
        String: "local A = Inst[OP_A]\nStk[A](Unpack(Stk, A + 1, Inst[OP_B]))",
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    CallC1B2: {
        String: "local A = Inst[OP_A]\nStk[A](Stk[A + 1])",
        Create: function(instruction) {
            return instruction
        }
    },
    CallB0C0: {
        String: `local A = Inst[OP_A]
        local Results, Limit = _R(Stk[A](Unpack(Stk, A + 1, Top)))
        Top = Limit + A - 1
        local Edx = 0;
        for Idx = A, Top do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end;`,
        Create: function(instruction) {
            return instruction
        }
    },

    CallB0C1: {
        String: "local A = Inst[OP_A]\nStk[A](Unpack(Stk, A + 1, Top))",
        Create: function(instruction) {
            return instruction
        }
    },
    CallB1C0: {
        String: `local A = Inst[OP_A]
        local Results, Limit = _R(Stk[A]())
        Top = Limit + A - 1
        local Edx = 0;
        for Idx = A, Top do 
            Edx = Edx + 1;
            Stk[Idx] = Results[Edx];
        end;`,
        Create: function(instruction) {
            return instruction
        }
    },
    CallB1C1: {
        String: "Stk[Inst[OP_A]]();",
        Create: function(instruction) {
            return instruction
        }
    },

    CallC2: {
        String: "local A = Inst[OP_A]\nStk[A] = Stk[A](Unpack(Stk, A + 1, Inst[OP_B]))",
        Create: function(instruction) {
            instruction.B = instruction.B - instruction.A + 1
            
            return instruction
        }
    },
    CallC2B2: {
        String: "local A = Inst[OP_A]\nStk[A] = Stk[A](Stk[A + 1]) ",
        Create: function(instruction) {
            return instruction
        }
    },
    CallB0C2: {
        String: "local A = Inst[OP_A]\nStk[A] = Stk[A](Unpack(Stk, A + 1, Top))",
        Create: function(instruction) {
            return instruction
        }
    },
    CallB1C2: {
        String: "local A = Inst[OP_A]\nStk[A] = Stk[A]()",
        Create: function(instruction) {
            return instruction
        }
    },
}