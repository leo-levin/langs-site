'use strict';

const g = ohm.grammar(String.raw`

L {

  Program
    = Rule* Query

  Rule  (a rule)
    = Clause ":-" Clauses "."  -- body
    | Clause "."               -- noBody

  Query  (a query)
    = Clauses "?"

  Clause  (a clause)
    = symbol "(" Terms ")"  -- args
    | symbol                -- noArgs

  Clauses
    = NonemptyListOf<Clause, ",">

  Terms
    = ListOf<Term, ",">

  Term
    = Clause
    | List
    | number
    | variable

  List
    = "[" Contents? "]"

  Contents
    = Term "," Contents  -- cons1
    | Term "|" Term      -- cons2
    | Term               -- single

  // Lexical rules

  variable  (a variable)
    = upper alnum*

  number  (a number)
    = digit+

  symbol  (a symbol)
    = lower alnum*

  space
   += comment

  comment
    = "/*" (~"*/" any)* "*/"  -- multiLine
    | "//" (~"\n" any)*       -- singleLine

  tokens
    = (variable | symbol | comment | any)*

}

`);

const L = new Language(
  g,
  g.createSemantics().addOperation('toAST', {
    Program: function (rules, query) {
      return new Program(rules.toAST(), query.toAST());
    },

    Rule_body: function (head, _if, body, _dot) {
      return new Rule(head.toAST(), body.toAST());
    },

    Rule_noBody: function (head, _) {
      return new Rule(head.toAST(), []);
    },

    Query: function (c, _) {
      return c.toAST();
    },

    Clause_args: function (sym, _oparen, as, _cparen) {
      return new Clause(sym.toAST(), as.toAST());
    },

    Clause_noArgs: function (sym) {
      return new Clause(sym.toAST(), []);
    },

    List: function (_obracket, xs, _cbracket) {
      return xs.toAST()[0] || new Clause('_nil', []);
    },

    Contents_cons1: function (x, _, xs) {
      return new Clause('_cons', [x.toAST(), xs.toAST()]);
    },

    Contents_cons2: function (x, _, xs) {
      return new Clause('_cons', [x.toAST(), xs.toAST()]);
    },

    Contents_single: function (x) {
      return new Clause('_cons', [x.toAST(), new Clause('_nil', [])]);
    },

    number: function (_digits) {
      return new Clause(this.sourceString, []);
    },

    variable: function (_first, _rest) {
      return new Var(this.sourceString);
    },

    symbol: function (_first, _rest) {
      return this.sourceString;
    },

    NonemptyListOf: function (x, _, xs) {
      return [x.toAST()].concat(xs.toAST());
    },

    EmptyListOf: function () {
      return [];
    },

    _iter(...children) {
      return children.map(c => c.toAST());
    },

    _terminal() {
      return this.sourceString;
    },
  })
);

// L.prettyPrintAST and L.prettyPrintValue are declared in prettyPrint.js
