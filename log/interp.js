'use strict';

// ---------------------------------------------------------
// classes that represent AST nodes
// (feel free to add your own methods!)
// ---------------------------------------------------------

class Program extends AST {
  constructor(rules, query) {
    super();
    this.rules = rules;
    this.query = query;
  }
}

class Rule extends AST {
  constructor(head, body) {
    super();
    this.head = head;
    this.body = body;
  }
}

class Clause extends AST {
  constructor(name, args = []) {
    super();
    this.name = name;
    this.args = args;
  }
}

class Var extends AST {
  constructor(name) {
    super();
    this.name = name;
  }
}

Var.prototype.deconstruct = function () {
  return [this.name];
};

Clause.prototype.deconstruct = function () {
  return [this.name, this.args];
};
// Substitutions

class Subst {
  constructor() {
    this.bindings = new Map();
  }

  lookup(varName) {
    return this.bindings.get(varName);
  }

  bind(varName, term) {
    this.bindings.set(varName, term);
    for (const [key, val] of this.bindings.entries()) { // added this so that unify gives me solved form
      this.bindings.set(key, val.rewrite(this));        // not particularly efficient, rewriting everything
    }                                                   // for every new binding
    return this;
  }

  clone() {
    const clone = new Subst();
    for (const [varName, term] of this.bindings.entries()) {
      clone.bind(varName, term);
    }
    return clone;
  }
}

// ---------------------------------------------------------
// your mission, should you choose to accept it...
// ---------------------------------------------------------

// ---------------------------------------------------------
// Part I: Rule.prototype.makeCopyWithFreshVarNames() and
//         {Clause, Var}.prototype.rewrite(subst)
// ---------------------------------------------------------

let freshVarCounter = 0;

Rule.prototype.makeCopyWithFreshVarNames = function () {
  const mapping = {};
  const newHead = renameVars(this.head, mapping);
  const newBody = (this.body || []).map(clause => renameVars(clause, mapping));
  return new Rule(newHead, newBody);
};

function renameVars(node, mapping) {
  if (node instanceof Var) {
    if (!(node.name in mapping)) {
      mapping[node.name] = new Var("$v" + freshVarCounter++);
    }
    return mapping[node.name];

  } else if (node instanceof Clause) {
    const renamedArgs = node.args.map(arg => renameVars(arg, mapping));
    return new Clause(node.name, renamedArgs)
  }
};

Clause.prototype.rewrite = function (subst) {
  const rewritten = this.args.map(arg => arg.rewrite(subst));
  return new Clause(this.name, rewritten)
};

Var.prototype.rewrite = function (subst) {
  const bound = subst.lookup(this.name);
  if (bound) {
    return bound.rewrite(subst);
  }
  return this;
};

// ---------------------------------------------------------
// Part II: Subst.prototype.unify(term1, term2)
// ---------------------------------------------------------

Subst.prototype.unify = function (term1, term2) {
  term1 = term1.rewrite(this);
  term2 = term2.rewrite(this);

  return match([term1, term2],
    [inst(Var, _), inst(Var, _)], (name1, name2) =>{
      if (name1 === name2) {
        return this;
      }
      this.bind(name1, new Var(name2))
      return this;
    },

    [inst(Var, _), inst(Clause, _, _)], (vName, cName, cArgs) =>{
      this.bind(vName, new Clause(cName, cArgs));
      return this;
    },

    [inst(Clause, _, _), inst(Var, _)], (cName, cArgs, vName) => {
      return this.unify(new Var(vName), new Clause(cName, cArgs)) // just call to above instance
    },

    [inst(Clause, _, _), inst(Clause, _, _)], (name1, args1, name2, args2) => {
      if (name1 !== name2 || args1.length !== args2.length ) {
        throw new Error('unification failed');
      }
      for (let i = 0; i < args1.length; i++) {
        this.unify(args1[i], args2[i]);
      }
      return this;
    }
  );
};

// ---------------------------------------------------------
// Part III: solve()
// ---------------------------------------------------------

const cutPoint = stack.length;
stack.push({ goals: frame.goals, subst: frame.subst, ruleIdx: i + 1 });
stack.push({ goals: [...rule.body, ...restGoals], subst: cloned, ruleIdx: 0, cutPoint });

function solve(prog) {
  const rules = prog.rules;
  const query = prog.query;
  const stack = [{ goals: [...query], subst: new Subst(), ruleIdx: 0 }];

  return {
    next() {
      while (stack.length > 0) {
        const frame = stack.pop();

        if (frame.goals.length === 0) {
          return frame.subst;
        }

        const [goal, ...restGoals] = frame.goals;

        // use match here :(
        if (goal.name === 'cut' && goal.args.length === 0) {
          if (frame.cutPoint !== undefined) {
            stack.length = frame.cutPoint;
          }
          stack.push({ goals: restGoals, subst: frame.subst, ruleIdx: 0, cutPoint: frame.cutPoint });
          continue;
        }
        if (goal.name === 'assert' && goal.args.length === 1) {
          handleAssert(goal, restGoals, frame, stack, rules);
          continue;
        }
        if (goal.name === 'retract' && goal.args.length === 1) {
          handleRetract(goal, restGoals, frame, stack, rules);
          continue;
        }
        if (goal.name === 'is' && goal.args.length === 2) {
          handleIs(goal, restGoals, frame, stack);
          continue;
        }

        for (let i = frame.ruleIdx; i < rules.length; i++) {
          const rule = rules[i].makeCopyWithFreshVarNames();
          const cloned = frame.subst.clone();

          try {
            cloned.unify(goal, rule.head);
            const cutPoint = stack.length;
            stack.push({ goals: frame.goals, subst: frame.subst, ruleIdx: i + 1 });
            stack.push({ goals: [...rule.body, ...restGoals], subst: cloned, ruleIdx: 0, cutPoint });
            break;
          } catch (e) {
          }
        }
      }
      return false;
    },
  };
}

function handleAssert(goal, restGoals, frame, stack, rules) {
  const term = goal.args[0].rewrite(frame.subst);
  rules.push(new Rule(term, []))
  stack.push({ goals: restGoals, subst: frame.subst, ruleIdx: 0 });
}

function handleRetract(goal, restGoals, frame, stack, rules) {
  for (let i = frame.ruleIdx; i < rules.length; i++) {
    const cloned = frame.subst.clone();
    try {
      cloned.unify(goal.args[0], rules[i].head);
      stack.push({ goals: frame.goals, subst: frame.subst, ruleIdx: i + 1 });

      rules.splice(i, 1);
      stack.push({ goals: restGoals, subst: cloned, ruleIdx: 0 });
      break;
    } catch (e) {
    }
  }
}

function handleIs(goal, restGoals, frame, stack) {
  const lhs = goal.args[0].rewrite(frame.subst);
  const expr = goal.args[1].rewrite(frame.subst);
  try {
    const result = evalArith(expr);
    const resultTerm = new Clause(String(result), []);
    const cloned = frame.subst.clone();
    cloned.unify(lhs, resultTerm);
    stack.push({ goals: restGoals, subst: cloned, ruleIdx: 0 });
  } catch (e) {}
}

function evalArith(term) {
  if (term instanceof Clause && term.args.length === 0) {
    const n = parseFloat(term.name);
    if (!isNaN(n)) return n;
    throw new Error('not a number: ' + term.name);
  }
  if (term instanceof Clause && term.args.length === 2) {
    const a = evalArith(term.args[0]);
    const b = evalArith(term.args[1]);
    switch (term.name) {
      case 'plus':  return a + b;
      case 'minus': return a - b;
      case 'times': return a * b;
      case 'div':   return Math.floor(a / b);
      case 'mod':   return ((a % b) + b) % b;
      default: throw new Error('unknown op: ' + term.name);
    }
  }
  throw new Error('cannot evaluate: ' + term);
}
