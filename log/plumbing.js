// The code in this file is the plumbing that connects your prototype to our test harness and playground.

Subst.prototype.toString = function () {
  return this.bindings.size === 0
    ? 'yes'
    : Array.from(this.bindings.entries())
        .map(([v, t]) => `${v} = ${t}`)
        .join(', ');
};

Subst.prototype.filter = function (names) {
  const filteredSubst = new Subst();
  for (const name of names) {
    const term = this.lookup(name);
    if (term) {
      filteredSubst.bind(name, term);
    }
  }
  return filteredSubst;
};

Subst.prototype.__equals__ = function (that) {
  return that instanceof Subst && __equals__(this.bindings, that.bindings);
};

// It's your job is to implement `Program.prototype.solve()`, which should return an iterator
// of substitutions. The implementation of the `evalAST` method below calls that method, and
// filters out the bindings that don't have anything to do with the query. It also wraps the
// iterator to provide a `rewind` method that is used by the test harness.

L.evalAST = progAST => {
  const iter = solve(progAST);
  if (!iter || !iter.next) {
    throw new Error('expected an iterator but got ' + JSON.stringify(iter));
  }

  let noMoreSolutions = false;
  const solutions = [];
  let idx = 0;
  return {
    next() {
      if (idx < solutions.length) {
        return solutions[idx++];
      } else if (noMoreSolutions) {
        return false;
      }

      let solution = iter.next();
      if (solution) {
        const queryVarNames = getVarNames(progAST.query);
        solution = solution.filter(queryVarNames);
        solutions[idx++] = solution;
      } else {
        noMoreSolutions = true;
      }
      return solution;
    },
    rewind() {
      idx = 0;
    },
  };
};

function getVarNames(ast) {
  const varNames = new Set();
  visit(ast);
  return [...varNames];

  function visit(ast) {
    if (Array.isArray(ast)) {
      ast.forEach(visit);
    } else if (ast instanceof Clause) {
      ast.args.forEach(visit);
    } else if (ast instanceof Var) {
      varNames.add(ast.name);
    } else {
      // ignore it
    }
  }
}
