JS.prettyPrintValue = function (x) {
  return x instanceof AST ? L.prettyPrintAST(x) : String(x);
};

// --------------------------------------------------------------

L.prettyPrintValue = function (iter) {
  if (!iter || !iter.next) {
    throw new Error('expected iterator but got ' + JSON.stringify(iter));
  }
  const output = [];
  const N = 5;
  let soln;
  for (let idx = 0; idx < N; idx++) {
    soln = iter.next();
    if (idx > 0) {
      output.push('\n');
    }
    if (!soln) {
      output.push('** no more answers **');
      break;
    } else if (!(soln instanceof Subst)) {
      throw new Error('expected substitution but got ' + JSON.stringify(soln));
    } else {
      output.push(soln.toString());
    }
  }
  if (soln) {
    output.push('\n...');
  }
  return output.join('');
};

Clause.prototype.toString = function () {
  if (this.name === '_nil') {
    return '[]';
  } else if (this.name === '_cons') {
    const strm = new IndentingOutputStream();
    strm.write('[');
    let first = true;
    let curr = this;
    while (curr.name === '_cons') {
      if (first) {
        first = false;
      } else {
        strm.write(',');
      }
      strm.write(curr.args[0].toString());
      curr = curr.args[1];
    }
    if (curr.name !== '_nil') {
      strm.write('|');
      strm.write(curr.toString());
    }
    strm.write(']');
    return strm.contents();
  } else {
    return this.args.length === 0
      ? this.name
      : this.name + '(' + this.args.map(arg => arg.toString()).join(', ') + ')';
  }
};

Var.prototype.toString = function () {
  return this.name;
};

// --------------------------------------------------------------

L.prettyPrintAST = function (ast) {
  let strm = new IndentingOutputStream();
  ast.prettyPrint(strm);
  return strm.contents();
};

AST.prototype.prettyPrint = function (strm) {
  throw new Error(this.constructor.name + ' is missing an implementation for prettyPrint(strm)');
};

Program.prototype.prettyPrint = function (strm) {
  strm.indentFromHere();
  strm.write('new Program(');
  strm.nl();
  strm.write('/* rules */');
  strm.nl();
  prettyPrintList(this.rules, strm);
  strm.write(',');
  strm.nl();
  strm.write('/* query */');
  strm.nl();
  prettyPrintList(this.query, strm);
  strm.write(')');
  strm.dedent();
};

Rule.prototype.prettyPrint = function (strm) {
  strm.indentFromHere();
  strm.write('new Rule(');
  strm.nl();
  this.head.prettyPrint(strm);
  strm.write(', /* :- */');
  if (this.body.length > 0) {
    strm.nl();
  } else {
    strm.write(' ');
  }
  prettyPrintList(this.body, strm);
  strm.write(')');
  strm.dedent();
};

Clause.prototype.prettyPrint = function (strm) {
  strm.write('new Clause("' + this.name + '"');
  strm.write(', [');
  this.args.forEach((arg, idx) => {
    if (idx > 0) {
      strm.write(', ');
    }
    this.args[idx].prettyPrint(strm);
  });
  strm.write('])');
};

Var.prototype.prettyPrint = function (strm) {
  strm.write('new Var("' + this.name + '")');
};

function prettyPrintList(xs, strm) {
  strm.write('[');
  strm.indentToHere();
  xs.forEach((x, idx) => {
    if (idx > 0) {
      strm.write(',');
      strm.nl();
    }
    x.prettyPrint(strm);
  });
  strm.dedent();
  strm.write(']');
}
