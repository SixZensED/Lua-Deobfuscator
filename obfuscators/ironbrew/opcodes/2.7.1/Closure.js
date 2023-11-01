module.exports = {
    Closure: {
        Match: function(instruction) {
            if (instruction.length > 3 && instruction[3].Type == "AssignmentStat") {
                const s = instruction[3]
        
                if (s.Rhs[0].Type == "CallExpr") {
                    const r = s.Rhs[0]
                    const l = r.FunctionArguments.ArgList.length > 1 ? r.FunctionArguments.ArgList[1] : null
        
                    if (l != null && l.Type == "TableLiteral" && l.EntryList.length > 1) {
                        if (l.EntryList[0].Field.Source == "__index") {
                            return true
                        }
                    }
                }
            }
        },
        Create: function(instruction) {
            return instruction
        }
    },
    ClosureNU: {
        String: "Stk[Inst[OP_A]]=Wrap(Proto[Inst[OP_B]],nil,Env);",
        Create: function(instruction) {
            return instruction
        }
    }
}

/*
local NewProto = Proto[Inst[OP_B]];
local NewUvals;
local Indexes = {};
NewUvals = Setmetatable({}, {
	__index = function(_, Key)
		local Val = Indexes[Key];
		return Val[1][Val[2]];
	end,
	__newindex = function(_, Key, Value)
		local Val = Indexes[Key]
		Val[1][Val[2]] = Value;
	end;
});
for Idx = 1, Inst[OP_C] do
	InstrPoint = InstrPoint + 1;
	local Mvm = Instr[InstrPoint];
	if Mvm[OP_ENUM] == OP_MOVE then
		Indexes[Idx - 1] = {
			Stk,
			Mvm[OP_B]
		};
	else
		Indexes[Idx - 1] = {
			Upvalues,
			Mvm[OP_B]
		};
	end;
	Lupvals[#Lupvals + 1] = Indexes;
end;
Stk[Inst[OP_A]] = Wrap(NewProto, NewUvals, Env);
*/