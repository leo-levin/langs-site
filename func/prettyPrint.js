'use strict';

// prettyPrintAST

F.prettyPrintAST = function (x) {
  const out = Object.create(new IndentingOutputStream());
  out.visited = [];
  prettyPrintAST(x, out);
  return out.contents();
};

function prettyPrintAST(x, out) {
  if (out.visited.indexOf(x) >= 0) {
    out.write('...');
  } else if (x instanceof AST) {
    x.prettyPrintAST(out);
  } else if (x instanceof Array) {
    out.write('[');
    if (x.length > 1) {
      out.indentToHere();
    }
    x.forEach((xi, idx) => {
      if (idx > 0) {
        out.write(', ');
        if (x.length > 1) {
          out.nl();
        }
      }
      prettyPrintAST(xi, out);
    });
    out.write(']');
    if (x.length > 1) {
      out.dedent();
    }
  } else {
    out.write(JS.prettyPrintValue(x));
  }
}

AST.prototype.prettyPrintAST = function (out) {
  out.indentFromHere();
  out.write('new ' + this.constructor.name + '(');
  const keys = Object.keys(this);
  if (keys.length > 1) {
    out.nl();
  }
  Object.keys(this).forEach((key, idx) => {
    if (idx > 0) {
      out.write(',');
      out.nl();
    }
    prettyPrintAST(this[key], out);
  });
  out.write(')');
  out.dedent();
};

// prettyPrintValue

F.prettyPrintValue = function (x) {
  const out = Object.create(new IndentingOutputStream());
  out.visited = [];
  prettyPrintValue(x, out);
  return out.contents();
};

function prettyPrintValue(x, out) {
  if (out.visited.indexOf(x) >= 0) {
    out.write('...');
  } else if (
    x instanceof AST ||
    (typeof x === 'object' && x.prettyPrintValue)
  ) {
    x.prettyPrintValue(out);
  } else if (x instanceof Array) {
    out.write('[');
    if (x.length > 1) {
      out.indentToHere();
    }
    x.forEach((xi, idx) => {
      if (idx > 0) {
        out.write(', ');
        if (x.length > 1) {
          out.nl();
        }
      }
      prettyPrintValue(xi, out);
    });
    out.write(']');
    if (x.length > 1) {
      out.dedent();
    }
  } else {
    out.write(JS.prettyPrintValue(x));
  }
}

AST.prototype.prettyPrintValue = function (out) {
  out.indentFromHere();
  out.write('new ' + this.constructor.name + '(');
  const keys = Object.keys(this);
  if (keys.length > 1) {
    out.nl();
  }
  Object.keys(this).forEach((key, idx) => {
    if (idx > 0) {
      out.write(',');
      out.nl();
    }
    prettyPrintValue(this[key], out);
  });
  out.write(')');
  out.dedent();
};

Closure.prototype.prettyPrintValue = function (out) {
  out.write('{closure}');
};

Tuple.prototype.prettyPrintValue = function (out) {
  out.indentFromHere();
  out.write('(');
  this.vs.forEach((v, idx) => {
    if (idx > 0) {
      out.write(', ');
    }
    prettyPrintValue(v, out);
  });
  out.write(')');
  out.dedent();
};

Datum.prototype.prettyPrintValue = function (out) {
  // detect Cons/Nil list chains and print as [a; b; c]
  if (this.C === 'Cons' || this.C === 'Nil') {
    const elems = [];
    let cur = this;
    let isList = true;
    while (cur instanceof Datum && cur.C === 'Cons') {
      if (cur.v instanceof Tuple && cur.v.vs.length === 2) {
        elems.push(cur.v.vs[0]);
        cur = cur.v.vs[1];
      } else {
        isList = false;
        break;
      }
    }
    if (isList && cur instanceof Datum && cur.C === 'Nil') {
      out.write('[');
      elems.forEach((elem, idx) => {
        if (idx > 0) out.write('; ');
        prettyPrintValue(elem, out);
      });
      out.write(']');
      return;
    }
  }
  out.write(this.C);
  if (
    (this.v instanceof Tuple && this.v.vs.length > 0) ||
    !(this.v instanceof Tuple)
  ) {
    out.write(' ');
    prettyPrintValue(this.v, out);
  }
};

Typed.prototype.prettyPrintValue = function (out) {
  prettyPrintValue(this.v, out);
  out.write(' : ');
  prettyPrintValue(this.t, out);
};

Type.prototype.prettyPrintValue = function (out) {
  throw new TODO('implement prettyPrintValue for ' + this.constructor.name);
};

FunType.prototype.prettyPrintValue = function (out) {
  const needParens = this.ta instanceof FunType;
  if (needParens) {
    out.write('(');
  }
  prettyPrintValue(this.ta, out);
  if (needParens) {
    out.write(')');
  }
  out.write(' -> ');
  prettyPrintValue(this.tr, out);
};

TupleType.prototype.prettyPrintValue = function (out) {
  if (this.ts.length == 0) {
    out.write('unit');
    return;
  }

  this.ts.forEach((t, idx) => {
    if (idx > 0) {
      out.write(' * ');
    }
    const needParens = t instanceof FunType || t instanceof TupleType;
    if (needParens) {
      out.write('(');
    }
    prettyPrintValue(t, out);
    if (needParens) {
      out.write(')');
    }
  });
};

ListType.prototype.prettyPrintValue = function (out) {
  const needParens = this.t instanceof FunType || this.t instanceof TupleType;
  if (needParens) {
    out.write('(');
  }
  prettyPrintValue(this.t, out);
  if (needParens) {
    out.write(')');
  }
  out.write(' list');
};

DelayedType.prototype.prettyPrintValue = function (out) {
  const needParens = this.t instanceof FunType || this.t instanceof TupleType;
  if (needParens) {
    out.write('(');
  }
  prettyPrintValue(this.t, out);
  if (needParens) {
    out.write(')');
  }
  out.write(' delayed');
};

IntType.prototype.prettyPrintValue = function (out) {
  out.write('int');
};

BoolType.prototype.prettyPrintValue = function (out) {
  out.write('bool');
};

TypeVar.prototype.prettyPrintValue = function (out) {
  out.write("'" + this.x);
};
