'use strict';

const g = ohm.grammar(String.raw`

F {

  Exp
    = let PriPat "=" Exp in Exp                           -- let
    | let rec ident "=" Exp in Exp                        -- letrec
    | let rec "(" ident ":" Type ")" "=" Exp in Exp       -- typedLetrec
    | fun PriPat+ "->" Exp                                -- fun
    | if Exp then Exp else Exp                            -- if
    | match Exp with "|"? NonemptyListOf<PatAndExp, "|">  -- match
    | OrExp

  PatAndExp
    = Pat "->" Exp

  Pat
    = ctor PriPat  -- datum
    | PriPat

  PriPat
    = ctor                      -- emptyDatum
    | "(" Pat ")"               -- paren
    | "(" Pat ":" Type ")"      -- typed
    | "(" ListOf<Pat, ","> ")"  -- tuple
    | "[" ListOf<Pat, ";"> "]"  -- list
    | "_"                       -- wild
    | ident                     -- ident
    | number                    -- number
    | trueK                     -- true
    | falseK                    -- false

  OrExp
    = OrExp "||" AndExp  -- or
    | AndExp

  AndExp
    = AndExp "&&" EqExp  -- and
    | EqExp

  EqExp
    = RelExp "="  RelExp  -- eq
    | RelExp "!=" RelExp  -- neq
    | RelExp

  RelExp
    = AddExp "<" AddExp  -- lt
    | AddExp ">" AddExp  -- gt
    | AddExp

  AddExp
    = AddExp "+" MulExp  -- plus
    | AddExp "-" MulExp  -- minus
    | MulExp

  MulExp
    = MulExp "*" CallExp  -- times
    | MulExp "/" CallExp  -- divide
    | MulExp "%" CallExp  -- modulus
    | CallExp

  CallExp
    =  CallExp PriExp  -- call
    |  UnExp

  UnExp
    = "+" DatumExp    -- pos
    | "-" DatumExp    -- neg
    | delay DatumExp  -- delay
    | force DatumExp  -- force
    | DatumExp

  DatumExp
    = ctor PriExp  -- datum
    | PriExp

  PriExp
    = ctor                                     -- emptyDatum
    | "(" Exp ")"                              -- paren
    | "(" Exp ":" Type ")"                     -- typed
    | "(" ListOf<Exp, ","> ")"                 -- tuple
    | "[" Exp "|" Pat "<-" Exp ("," Exp)? "]"  -- listComp
    | "[" ListOf<Exp, ";"> "]"                 -- list
    | ident                                    -- ident
    | number                                   -- number
    | trueK                                    -- true
    | falseK                                   -- false

  Type
    = FunType

  FunType
    = TupleType "->" FunType  -- fun
    | TupleType

  TupleType
    = ListOrDelayedType ("*" ListOrDelayedType)+  -- tuple
    | ListOrDelayedType

  ListOrDelayedType
    = ListOrDelayedType list     -- list
    | ListOrDelayedType delayed  -- delayed
    | PriType

  PriType
    = "(" Type ")"  -- paren
    | int           -- int
    | bool          -- bool
    | unit          -- unit
    | typeVar

  typeVar  (a type variable)
    = "'" ident

  // Lexical rules

  ident  (an identifier)
    = ~keyword lower alnum*

  ctor  (a data constructor)
    = ~keyword upper alnum*

  number  (a number)
    = digit* "." digit+  -- fract
    | digit+             -- whole

  fun = "fun" ~alnum

  let    = "let" ~alnum
  rec    = "rec" ~alnum
  in     = "in" ~alnum

  if   = "if" ~alnum
  then = "then" ~alnum
  else = "else" ~alnum

  match = "match" ~alnum
  with  = "with" ~alnum

  trueK  = "true" ~alnum
  falseK = "false" ~alnum

  delay = "delay" ~alnum
  force = "force" ~alnum

  int = "int" ~alnum
  bool = "bool" ~alnum
  unit = "unit" ~alnum
  list = "list" ~alnum
  delayed = "delayed" ~alnum

  keyword
    = fun   | let  | rec   | in      | if    | then  | else
    | match | with | trueK | falseK  | delay | force | int
    | bool  | unit | list  | delayed

  space
   += comment

  comment
    = "/*" (~"*/" any)* "*/"  -- multiLine
    | "//" (~"\n" any)*       -- singleLine

  tokens
    = (keyword | ident | ctor | number | comment | any)*

}

`);

const F = new Language(
  g,
  g.createSemantics().addOperation('toAST', {
    Exp_let(_let, p, _eq, e1, _in, e2) {
      return new Let(p.toAST(), e1.toAST(), e2.toAST());
    },

    Exp_letrec(_let, _rec, x, _eq, e1, _in, e2) {
      return new LetRec(x.toAST(), e1.toAST(), e2.toAST());
    },

    Exp_typedLetrec(_let, _rec, _op, x, _colon, t, _cp, _eq, e1, _in, e2) {
      return new TypedLetRec(x.toAST(), t.toAST(), e1.toAST(), e2.toAST());
    },

    Exp_fun(_fun, ps, _arr, e) {
      return ps
        .toAST()
        .reverse()
        .reduce((body, p) => new Fun(p, body), e.toAST());
    },

    Exp_if(_if, cond, _then, tb, _else, fb) {
      return new If(cond.toAST(), tb.toAST(), fb.toAST());
    },

    Exp_match(_match, e, _with, _optBar, pes) {
      const pesAST = pes.toAST();
      return new Match(
        e.toAST(),
        pesAST.map(pe => pe.p),
        pesAST.map(pe => pe.e)
      );
    },

    PatAndExp(p, _arr, e) {
      return { p: p.toAST(), e: e.toAST() };
    },

    Pat_datum(C, p) {
      return new Datum(C.toAST(), p.toAST());
    },

    PriPat_emptyDatum(C) {
      return new Datum(C.toAST(), new Tuple([]));
    },

    PriPat_paren(_op, p, _cp) {
      return p.toAST();
    },

    PriPat_typed(_op, p, _colon, t, _cp) {
      return new Typed(p.toAST(), t.toAST());
    },

    PriPat_tuple(_op, ps, _cp) {
      return new Tuple(ps.toAST());
    },

    PriPat_list(_os, ps, _cs) {
      return ps
        .toAST()
        .reverse()
        .reduce(
          (lst, p) => new Datum('Cons', new Tuple([p, lst])),
          new Datum('Nil', new Tuple([]))
        );
    },

    PriPat_wild(x) {
      return new Wildcard();
    },

    PriPat_ident(x) {
      return new Var(x.toAST());
    },

    PriPat_number(n) {
      return new Lit(n.toAST());
    },

    PriPat_true(_true) {
      return new Lit(true);
    },

    PriPat_false(_false) {
      return new Lit(false);
    },

    OrExp_or(x, _or, y) {
      return new BinOp('||', x.toAST(), y.toAST());
    },

    AndExp_and(x, _and, y) {
      return new BinOp('&&', x.toAST(), y.toAST());
    },

    EqExp_eq(x, _eq, y) {
      return new BinOp('=', x.toAST(), y.toAST());
    },

    EqExp_neq(x, _neq, y) {
      return new BinOp('!=', x.toAST(), y.toAST());
    },

    RelExp_lt(x, _lt, y) {
      return new BinOp('<', x.toAST(), y.toAST());
    },

    RelExp_gt(x, _gt, y) {
      return new BinOp('>', x.toAST(), y.toAST());
    },

    AddExp_plus(x, _plus, y) {
      return new BinOp('+', x.toAST(), y.toAST());
    },

    AddExp_minus(x, _minus, y) {
      return new BinOp('-', x.toAST(), y.toAST());
    },

    MulExp_times(x, _times, y) {
      return new BinOp('*', x.toAST(), y.toAST());
    },

    MulExp_divide(x, _div, y) {
      return new BinOp('/', x.toAST(), y.toAST());
    },

    MulExp_modulus(x, _mod, y) {
      return new BinOp('%', x.toAST(), y.toAST());
    },

    CallExp_call(f, e) {
      return new Call(f.toAST(), e.toAST());
    },

    UnExp_pos(_plus, e) {
      return e.toAST();
    },

    UnExp_neg(_minus, e) {
      return new BinOp('-', new Lit(0), e.toAST());
    },

    UnExp_delay(_delay, e) {
      return new Delay(e.toAST());
    },

    UnExp_force(_force, e) {
      return new Force(e.toAST());
    },

    DatumExp_datum(C, e) {
      return new Datum(C.toAST(), e.toAST());
    },

    PriExp_emptyDatum(C) {
      return new Datum(C.toAST(), new Tuple([]));
    },

    PriExp_paren(_op, e, _cp) {
      return e.toAST();
    },

    PriExp_typed(_op, e, _colon, t, _cp) {
      return new Typed(e.toAST(), t.toAST());
    },

    PriExp_tuple(_op, es, _cp) {
      return new Tuple(es.toAST());
    },

    PriExp_listComp(_os, e, _bar, p, _arr, el, _optComma, optEp, _cs) {
      return new ListComp(e.toAST(), p.toAST(), el.toAST(), optEp.toAST()[0]);
    },

    PriExp_list(_os, es, _cs) {
      return es
        .toAST()
        .reverse()
        .reduce(
          (lst, e) => new Datum('Cons', new Tuple([e, lst])),
          new Datum('Nil', new Tuple([]))
        );
    },

    PriExp_ident(x) {
      return new Var(x.toAST());
    },

    PriExp_number(n) {
      return new Lit(n.toAST());
    },

    PriExp_true(_true) {
      return new Lit(true);
    },

    PriExp_false(_false) {
      return new Lit(false);
    },

    FunType_fun(ta, _arr, tr) {
      return new FunType(ta.toAST(), tr.toAST());
    },

    TupleType_tuple(t, _timeses, ts) {
      return new TupleType([t.toAST()].concat(ts.toAST()));
    },

    ListOrDelayedType_list(t, _list) {
      return new ListType(t.toAST());
    },

    ListOrDelayedType_delayed(t, _delayed) {
      return new DelayedType(t.toAST());
    },

    PriType_paren(_op, t, _cp) {
      return t.toAST();
    },

    PriType_int(_) {
      return new IntType();
    },

    PriType_bool(_) {
      return new BoolType();
    },

    PriType_unit(_) {
      return new TupleType([]);
    },

    typeVar(_quote, x) {
      return new TypeVar(x.toAST());
    },

    ident(_first, _rest) {
      return this.sourceString;
    },

    ctor(_first, _rest) {
      return this.sourceString;
    },

    number(_) {
      return parseFloat(this.sourceString);
    },

    NonemptyListOf(x, _sep, xs) {
      return [x.toAST()].concat(xs.toAST());
    },

    EmptyListOf() {
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

// F.prettyPrintAST and F.prettyPrintValue are declared in prettyPrint.js
