'use strict';

class AST {
  __equals__(that) {
    if (that instanceof AST && this.constructor === that.constructor) {
      for (const p in this) {
        if (this.hasOwnProperty(p) && !__equals__(this[p], that[p])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

function prettyPrintJS(code) {
  if (typeof code === 'string') {
    return js_beautify(code);
  } else {
    throw new Error('expected a string, but got ' + code + ' instead');
  }
}

function __equals__(x, y) {
  if (typeof x?.__equals__ === 'function') {
    return x.__equals__(y);
  } else if (x instanceof Array) {
    return __arrayEquals__(x, y);
  } else if (x instanceof Map) {
    return __mapEquals__(x, y);
  } else if (x && typeof x === 'object' && y && typeof y === 'object') {
    return __objEquals__(x, y);
  } else {
    return x === y;
  }
}

function __mapEquals__(x, y) {
  if (!(y instanceof Map)) {
    return false;
  }
  for (const k of x.keys()) {
    if (!__equals__(x.get(k), y.get(k))) {
      return false;
    }
  }
  for (const k of y.keys()) {
    if (!x.has(k)) {
      return false;
    }
  }
  return true;
}

function __objEquals__(x, y) {
  for (const k in x) {
    if (!__equals__(x[k], y[k])) {
      return false;
    }
  }
  for (const k in y) {
    if (!(k in x)) {
      return false;
    }
  }
  return true;
}

function __arrayEquals__(xs, ys) {
  if (xs instanceof Array && ys instanceof Array && xs.length === ys.length) {
    for (let idx = 0; idx < xs.length; idx++) {
      if (!__equals__(xs[idx], ys[idx])) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function toDOM(x) {
  if (x instanceof Node) {
    return x;
  } else if (x instanceof Array) {
    var xNode = document.createElement(x[0]);
    x.slice(1)
      .map(toDOM)
      .forEach(yNode => xNode.appendChild(yNode));
    return xNode;
  } else {
    return document.createTextNode(x);
  }
}
