'use strict';

// ---------------------------------------------------------
// classes that represent AST nodes
// (feel free to add your own methods!)
// ---------------------------------------------------------

// ---------------------------------------------------------
class Lit extends AST {
  constructor(primValue) {
    super();
    this.primValue = primValue;
  }
  deconstruct() {
    return [this.primValue];
  }
}

class BinOp extends AST {
  constructor(op, e1, e2) {
    super();
    this.op = op;
    this.e1 = e1;
    this.e2 = e2;
  }

  deconstruct() {
    return [this.op, this.e1, this.e2];
  }
}

class If extends AST {
  constructor(e1, e2, e3) {
    super();
    this.e1 = e1;
    this.e2 = e2;
    this.e3 = e3;
  }

  deconstruct() {
    return [this.e1, this.e2, this.e3];
  }
}

class Var extends AST {
  constructor(x) {
    super();
    this.x = x;
  }

  deconstruct() {
    return [this.x];
  }
}

class Let extends AST {
  constructor(p, e1, e2) {
    super();
    this.p = p;
    this.e1 = e1;
    this.e2 = e2;
  }

  deconstruct() {
    return [this.p, this.e1, this.e2];
  }
}

class Fun extends AST {
  constructor(p, e) {
    super();
    this.p = p;
    this.e = e;
  }

  deconstruct() {
    return [this.p, this.e];
  }
}

class Call extends AST {
  constructor(ef, ea) {
    super();
    this.ef = ef;
    this.ea = ea;
  }

  deconstruct() {
    return [this.ef, this.ea];
  }
}

class Closure {
  constructor(fun, env) {
    this.fun = fun;
    this.env = env;
  }
}

// classes for Homework 2

class LetRec extends AST {
  constructor(x, e1, e2) {
    super();
    this.x = x;
    this.e1 = e1;
    this.e2 = e2;
  }

  deconstruct() {
    return [this.x, this.e1, this.e2];
  }
}

class TypedLetRec extends AST {
  constructor(x, t, e1, e2) {
    super();
    this.x = x;
    this.t = t;
    this.e1 = e1;
    this.e2 = e2;
  }

  deconstruct() {
    return [this.x, this.t, this.e1, this.e2];
  }
}

class Thunk {
  constructor(expr, env) {
    this.expr = expr;
    this.env = env;
    this.evaled = false;
    this.val = null;
  }
}

class Tuple extends AST {
  constructor(es) {
    super();
    this.es = es;
  }

  deconstruct() {
    return [this.es];
  }

  get vs() {
    return this.es;
  }

  get ps() {
    return this.es;
  }
}

class Datum extends AST {
  constructor(C, e) {
    super();
    this.C = C;
    this.e = e;
  }

  deconstruct() {
    return [this.C, this.e];
  }

  get v() {
    return this.e;
  }

  get p() {
    return this.e;
  }
}

class Match extends AST {
  constructor(e, ps, es) {
    super();
    this.e = e;
    this.ps = ps;
    this.es = es;
  }

  deconstruct() {
    return [this.e, this.ps, this.es];
  }
}

class Wildcard extends AST {
  constructor() {
    super();
  }

  deconstruct() {
    return [];
  }
}

class ListComp extends AST {
  constructor(e, p, elist, epred) {
    super();
    this.e = e;
    this.p = p;
    this.elist = elist;
    this.epred = epred;
  }

  deconstruct() {
    return [this.e, this.p, this.elist, this.epred];
  }
}

class Delay extends AST {
  constructor(e) {
    super();
    this.e = e;
  }

  deconstruct() {
    return [this.e];
  }
}

class Force extends AST {
  constructor(e) {
    super();
    this.e = e;
  }

  deconstruct() {
    return [this.e];
  }
}

class Typed extends AST {
  constructor(e, t) {
    super();
    this.e = e;
    this.t = t;
  }

  get p() {
    return this.e;
  }

  get v() {
    return this.e;
  }
}

class Type extends AST {
  constructor() {
    super();
  }

  deconstruct() {
    return [];
  }
}

class FunType extends Type {
  constructor(ta, tr) {
    super();
    this.ta = ta;
    this.tr = tr;
  }
}

class TupleType extends Type {
  constructor(ts) {
    super();
    this.ts = ts;
  }
}

class ListType extends Type {
  constructor(t) {
    super();
    this.t = t;
  }
}

class DelayedType extends Type {
  constructor(t) {
    super();
    this.t = t;
  }
}

class IntType extends Type {
  constructor() {
    super();
  }
}

class BoolType extends Type {
  constructor() {
    super();
  }
}

class TypeVar extends Type {
  constructor(x) {
    super();
    this.x = x;
  }
}

// a type to denote an unannotated Nil value
class NilType extends Type {
  constructor() {
    super();
  }
}

// ---------------------------------------------------------
// your mission, should you choose to accept it...
// ---------------------------------------------------------

function interp(ast) {
  const env = {};

  function evaluate(node) {
    return match(node,
      inst(Lit, _), n => n,
      inst (BinOp, _, _, _), (op, e1, e2) => {
        const v1 = evaluate(e1);
        const v2 = evaluate(e2);
        return match([op, typeof v1, typeof v2],
          ["+", 'number', "number"], () => v1 + v2,
          ["*", 'number', "number"], () => v1 * v2,
          ["-", 'number', "number"], () => v1 - v2,
          ["/", 'number', "number"], () => v1 / v2,
          ["^", 'number', "number"], () => v1 ** v2,
          ["%", 'number', "number"], () => v1 % v2,
          ["<", 'number', "number"], () => v1 < v2,
          [">", 'number', "number"], () => v1 > v2,
          ["=", 'boolean', "boolean"], () => v1 === v2,
          ["=", 'number', "number"], () => v1 === v2,
          ["!==", 'boolean', "boolean"], () => v1 !== v2,
          ["&&", 'boolean', "boolean"], () => v1 && v2,
          ["||", 'boolean', "boolean"], () => v1 || v2,
          _, ([op]) => {throw new Error(`bad operation: ${op} on ${typeof v1}, ${typeof v2} is not allowed`);}
        )
      },
      inst(Var, _), varName => {
        if (varName in env) {return env[varName]}
        throw new Error(`unbound variable: ${varName}`)
      },
      inst (If, _, _, _), (e1, e2, e3) => {
        if (evaluate(e1)) {return evaluate(e2)} else {return evaluate(e3)}
      },
      inst(Let, _, _, _), (pattern, e1, e2) => {
        const val = evaluate(e1);
        const binds = matchPatternWithValue(pattern, val);

        if (binds === null) {
          throw new Error ("let pattern match failed");
        }

        const oldVals = {};

        Object.keys(binds).forEach(varName => {
          oldVals[varName] = env[varName];
        });
        Object.assign(env, binds);
        const result = evaluate(e2);

        Object.keys(binds).forEach(varName => {
          if (oldVals[varName] !== undefined) {
            env[varName] = oldVals[varName];
          } else {
            delete env[varName];
          }
        });
        return result;
      },
      inst(Fun, _, _), (param, body) => {
        return new Closure(new Fun(param, body), {...env});
      },
      inst (Call, _,_), (funExp, argExp) => {
        const closure = evaluate(funExp);
        const argVal = evaluate(argExp);

        if (!(closure instanceof Closure)) {throw new Error("cannot call")}

        const fun = closure.fun;
        return match(fun,
      inst(Fun, _, _), (pattern, body) => {
            const bindings = matchPatternWithValue(pattern, argVal);

            if (bindings === null) {
              throw new Error("Function parameter pattern match failed");
            };

            const oldEnv = {...env};
            Object.assign(env, closure.env);
            Object.assign(env, bindings);

            const result = evaluate(body);

            Object.assign(env, oldEnv);
            return result;
          },
          _, () => {throw new Error("invalid function")}
        )
      },
      inst(Tuple, _), (exprs) => {
        const vals = exprs.map(expr => evaluate(expr));
        return new Tuple(vals);
      },
      inst(LetRec, _, _, _), (x,e1,e2) => {
        const oldVal = env[x];
        env[x] = undefined;

        const value = evaluate(e1);
        if (value instanceof Closure) {value.env[x] = value;}
        env[x] = value;
        const result = evaluate(e2);
        if (oldVal !== undefined) {env[x] = oldVal;}
        return result;
      },
      inst(Datum, _,_), (C,e) => {
        const val = evaluate(e);
        return new Datum(C,val);
      },
      inst(Match, _, _, _), (e, ps, es) => {
        const val = evaluate(e);
        for (let i = 0; i < ps.length; i++) {
          const bindings = matchPatternWithValue(ps[i], val);
          if (bindings !== null) {
            const oldEnv = {...env};
            Object.assign(env, bindings);
            const result = evaluate(es[i]);
            Object.assign(env, oldEnv);
            return result;
          }
        }
        throw new Error("Match failure: no pattern matched");
      },
      inst(ListComp, _, _, _, _), (e, p, elist, epred) => {
        const sourceList = evaluate(elist);
        const elements = listToArray(sourceList);
        const results = [];

        for (const element of elements) {
          const binds = matchPatternWithValue(p, element);
          if (binds !== null) {
            const oldEnv = {...env}
            Object.assign(env, binds);

            let includeElem = true;
            if (epred !== null && epred !== undefined) {
              includeElem = evaluate(epred);
            }

            if (includeElem) {
              const result = evaluate(e);
              results.push(result);
            }
            Object.assign(env, oldEnv);
          }
        }
        return arrayToList(results);
      },
      inst(Delay, _), (e) => {
        return new Thunk(e, {...env});
      },
      inst(Force, _), (e) => {N
        const value = evaluate(e);
        if (!(value instanceof Thunk)) {
          throw new Error("cannot force un-thunk value");
        }

        if (!value.evaled) {
          const oldEnv = {...env};
          Object.assign(env, value.env);
          value.val = evaluate(value.expr);
          value.evaled = true;
          Object.assign(env, oldEnv);
        }
        return value.val;
      }
    )
  }
  return evaluate(ast)
}

function matchPatternWithValue(pattern, value) {
    return match (pattern,
      inst(Wildcard), () => {return {};},
      inst (Var, _), (varName) => {return {[varName]: value};},
      inst(Datum, _,_), (cons, innerpattern) => {
        if (!(value instanceof Datum) || value.C !== cons) {
          return null;
        }
        return matchPatternWithValue(innerpattern, value.e);
      },
      inst(Tuple, _), (patterns) => {
        if (!(value instanceof Tuple) || value.es.length !== patterns.length) {
          return null;
        }
        const allBinds = {};
        for (let i=0; i< patterns.length; i++) {
          const binds = matchPatternWithValue(patterns[i], value.es[i]);
          if (binds === null) {
            return null;
          }
          Object.assign(allBinds, binds);
        }
        return allBinds;
      },
      inst(Lit, _), (literalValue) => {
        return literalValue === value ? {} : null;
      },
      _, () => {return pattern === value ? {}: null;}
    )
}

function listToArray(listValue) {
    const result = [];
    let current = listValue;
    while (current instanceof Datum) {
      if (current.C === "Nil") {
        break;
      } else if (current.C === "Cons") {
        const tuple = current.e;
        if (tuple instanceof Tuple && tuple.es.length === 2) {
          result.push(tuple.es[0]);
          current = tuple.es[1];
        } else {
          throw new Error("invalid cons structure");
        }
      } else {
        throw new Error("expected cons or nils");
      }
    }
    return result;
}
function arrayToList(array){
    let result = new Datum("Nil", new Tuple([]));
    for (let i = array.length - 1 ; i>= 0 ; i--) {
      result = new Datum("Cons", new Tuple([array[i], result]));
    }
    return result;
}
class MatchFailure extends Error {
  constructor() {
    super('match failed');
  }
}
const _ = {};
function match(value, ...args) {
  if (args.length %2 !== 0) {
    throw new Error('patterns and functions must come in pairs!')
  };

  for (let i = 0; i < args.length; i+=2) {
    const bindings = matchPattern(args[i], value)
    if (bindings !== null) {
      const func = args[i+1];
      if (func.length !== bindings.length) {
        throw new Error("Arity-error!!!")
      }
      return func(...bindings)
    }
  }
  throw new MatchFailure();
}
function matchPattern(pattern, value) {
  if (pattern === _) {
    return [value];
  }

  if (typeof pattern === 'function') {
    return pattern(value) ? [value] : null;
  }

  if (Array.isArray(pattern)) {
    if (!Array.isArray(value)) {
      return null;
    }

    const allBinds = [];
    let patternIndex = 0;
    let valueIndex = 0;

    while (patternIndex < pattern.length) {
      const curPattern = pattern[patternIndex];
      if (curPattern && curPattern.type === 'many') {
        const manyBinds = [];
        const innerPattern = curPattern.pattern;

        while (valueIndex < value.length) {
          const subBinds = matchPattern(innerPattern, value[valueIndex]);
          if (subBinds === null) {
            break;
          }
          manyBinds.push(subBinds);
          valueIndex++;
        }

        if (manyBinds.length === 0) {
          allBinds.push([]);
        } else {
          for (let col = 0; col < manyBinds[0].length; col++) {
            const column = manyBinds.map(row => row[col]);
            allBinds.push(column);
          }
        }
        patternIndex++;
      } else {
        if (valueIndex >= value.length) {
          return null;
        }
        const subBinds = matchPattern(curPattern, value[valueIndex]);
        if (subBinds === null) {
          return null;
        }
        allBinds.push(...subBinds);
        patternIndex++;
        valueIndex++;
      }
    }

    if (valueIndex !== value.length) {
      return null;
    }

    return allBinds;
  }

  if (pattern && pattern.type === "instance") {
    if (!(value instanceof pattern.cls)) {
      return null
    }
    const deconstructed = value.deconstruct();
    return matchPattern(pattern.patterns, deconstructed);
  }

  return value === pattern ? [] : null
}
function inst (cls, ...patterns) {
  return {type: "instance", cls: cls, patterns: patterns};
}
function many(pattern) {
  return {type: "many", pattern: pattern};
}