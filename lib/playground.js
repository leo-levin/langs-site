'use strict';

// TODO: make this into a Playground class

function insertPlayground(L, optSource) {
  // An Ohm semantics for generic syntax highlighting.
  const s = L.grammar?.createSemantics().addOperation('syntaxHighlight', {
    _nonterminal(...children) {
      const ruleName = this.ctorName;
      const doc = conc.doc;
      doc.markText(doc.posFromIndex(this.source.startIdx), doc.posFromIndex(this.source.endIdx), {
        className: ruleName,
      });

      // Only bother to mark up the first level of lexical rule.
      // (We don't care about the decomposition of a token for syntax highlighting.)
      if (
        this.isSyntactic() ||
        ruleName === 'tokens' ||
        ruleName === 'keyword' ||
        ruleName === 'space' ||
        ruleName === 'spaces'
      ) {
        children.forEach(child => child.syntaxHighlight());
      }
    },

    _iter(...children) {
      return children.map(c => c.syntaxHighlight());
    },

    _terminal() {
      return this.sourceString;
    },
  });

  function syntaxHighlight(src) {
    let matchResult = L.grammar.match(src);
    if (matchResult.succeeded()) {
      s(matchResult).syntaxHighlight();
      // TODO: figure out if there is a way to get back this functionality in Ohm!
      // (Pat removed this method, is there another way to get the discarded spaces?)
      // s(matchResult.getDiscardedSpaces()).syntaxHighlight();
    } else {
      // The input didn't parse, but we can at least highlight tokens individually.
      matchResult = L.grammar.match(src, 'tokens');
      s(matchResult).syntaxHighlight();
    }
  }

  const playground = toDOM(['div']);
  playground.className = 'playground';

  const scripts = document.getElementsByTagName('script');
  const thisScriptTag = scripts[scripts.length - 1];
  thisScriptTag.parentNode.appendChild(playground);

  function addEditor(label, width, height, optReadOnly) {
    const wrapper = toDOM(['div']);
    playground.appendChild(wrapper);
    const editor = CodeMirror(wrapper, {
      readOnly: optReadOnly,
      value: '',
      mode: 'text/plain',
      enterMode: 'flat',
      electricChars: false,
      lineNumbers: true,
      smartIndent: false,
      lineSpacing: 1.1,
    });
    editor.setSize(width, height);
    return editor;
  }

  const conc = addEditor('concrete syntax', '100%', 220);
  const abs = L.grammar ? addEditor('abstract syntax', '100%', 100, true) : undefined;
  const trans = L.transAST ? addEditor('translation', '100%', 100, true) : undefined;
  const res = addEditor('result', '100%', 60, true);

  let parseErrorWidget = undefined;

  function clearEverythingElse() {
    if (abs) {
      abs.setValue('');
    }
    if (trans) {
      trans.setValue('');
    }
    res.setValue('');
  }

  conc.on('change', () => haveSource(conc.getValue()));
  if (optSource) {
    conc.setValue(optSource);
  }

  function haveSource(src) {
    if (parseErrorWidget) {
      conc.removeLineWidget(parseErrorWidget);
      parseErrorWidget = undefined;
    }
    for (const mark of conc.getAllMarks()) {
      mark.clear();
    }

    if (src.trim().length === 0) {
      clearEverythingElse();
      return;
    }

    if (!L.grammar) {
      callAndShowResult(() => JS.eval(src));
      return;
    }

    syntaxHighlight(src);
    const matchResult = L.grammar.match(src);
    if (matchResult.succeeded()) {
      const ast = L.semanticsForParsing(matchResult).toAST();
      haveAST(ast);
    } else {
      showSyntaxError(matchResult, src);
    }
  }

  function haveAST(ast) {
    abs.setValue(L.prettyPrintAST(ast));
    if (L.transAST) {
      try {
        const code = L.transAST(ast);
        trans.setValue(prettyPrintJS(code));
        callAndShowResult(() => JS.eval(code));
      } catch (e) {
        trans.setValue(showException(e));
        return;
      }
    } else {
      callAndShowResult(() => L.evalAST(ast));
    }
  }

  function callAndShowResult(thunk) {
    try {
      haveResult(thunk());
    } catch (e) {
      res.setValue(showException(e));
    }
  }

  function haveResult(value) {
    res.setValue(L.prettyPrintValue(value));
  }

  function showSyntaxError(matchResult, src) {
    setTimeout(() => {
      if (conc.getValue() === src && !parseErrorWidget) {
        function repeat(x, n) {
          const xs = [];
          while (n-- > 0) {
            xs.push(x);
          }
          return xs.join('');
        }
        const msg = 'Expected: ' + matchResult.getExpectedText();
        const pos = conc.doc.posFromIndex(matchResult.getRightmostFailurePosition());
        const error = toDOM(['parseError', repeat(' ', pos.ch) + '^\n' + msg]);
        parseErrorWidget = conc.addLineWidget(pos.line, error);
        $(error).hide().slideDown();
      }
    }, 2500);
  }

  function showException(e) {
    if (e instanceof TODO) {
      return `TODO: ${e.message}`;
    } else if (typeof e !== 'object' || !e?.hasOwnProperty('stack')) {
      return '' + e;
    } else {
      const stack = '' + e.stack;
      return stack.startsWith('' + e) ? stack : `${e}\n${e.stack}`;
    }
  }
}

// insertPlayground('6 * 7')
