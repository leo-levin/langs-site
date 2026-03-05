'use strict';

// Poor man's test harness
// TODO: make this into a class

const TestHarness = {
  equals: __equals__,
};

class TODO extends Error {
  constructor(message) {
    super();
    this.message = message;
  }
}

function tests(L /* , testCase1, testCase2, ... */) {
  const tests = toDOM(['testCases']);
  const numTests = arguments.length - 1;
  let numPasses = 0;

  for (let idx = 1; idx < arguments.length; idx++) {
    const testCase = arguments[idx];
    let actualValue;
    let exception;
    const details = [
      'details',
      ['summary', testCase.name],
      ['code', testCase.code],
    ];
    try {
      if (L.parse) {
        const ast = L.parse(testCase.code);
        details.push(['ast', L.prettyPrintAST(ast)]);
        if (L.transAST) {
          const translation = prettyPrintJS(L.transAST(ast));
          details.push(['translation', ['conc', translation]]);
          actualValue = JS.eval(translation);
        } else {
          actualValue = L.evalAST(ast);
        }
      } else {
        actualValue = JS.eval(testCase.code);
      }
      details.push(['actual', ['conc', L.prettyPrintValue(actualValue)]]);
    } catch (e) {
      exception = e;
      details.push([
        'exception',
        ['conc', e instanceof TODO ? 'TODO: ' + e.message : e.toString()],
      ]);
      if (!testCase.shouldThrow) {
        console.info('test', JSON.stringify(testCase.name), 'threw', e);
      }
    }
    details.push([
      'expected',
      testCase.shouldThrow
        ? ['span', 'an exception']
        : ['conc', L.prettyPrintValue(testCase.expected)],
    ]);
    const node = toDOM(['testCase', details]);
    tests.appendChild(node);
    if (
      (exception && testCase.shouldThrow && !(exception instanceof TODO)) ||
      (!exception &&
        !testCase.shouldThrow &&
        (testCase.shouldPass
          ? testCase.shouldPass(actualValue)
          : TestHarness.equals(actualValue, testCase.expected)))
    ) {
      numPasses++;
    } else {
      node.className = 'failed';
    }
  }

  tests.insertBefore(
    toDOM(['testStats', ['numPasses', numPasses], ['numTests', numTests]]),
    tests.firstChild
  );

  const scripts = document.getElementsByTagName('script');
  const thisScriptTag = scripts[scripts.length - 1];
  thisScriptTag.parentNode.appendChild(tests);
}
