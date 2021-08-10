# tappedout

A simple "back to basics" JavaScript test runner for producing [TAP-formatted](https://testanything.org) results.

It is built using ES module syntax, drawing _inspiration_ from the [tape](https://github.com/substack/tape) library. It shares several similarities, but should not be considered "the same".

**This is for library authors...**

There are many beautiful test runners. They often come at the price of requiring many dependencies, which may be fine for a single complex project. I primarily write libraries, meaning lots of smaller repos containing small bits of code. The black hole of `node_modules` was way too heavy when multipled across multiple projects, and I grew very frustrated with all the needless pre-processing/transpiling just to run tests. Translation: my patience was tapped out with one too many rollup/browserify processes.

## Getting tappedout

#### Node.js

This library only supports versions of Node with ES Module support. This is available in Node 12 & 13 using the `--experimental-modules` flag. It is a native feature in Node 14+ (no flag needed). All versions need to specify `"type": "module"` in the `package.json` file.

_Obtaining the module:_

```sh
npm i tappedout --save-dev
```

_Implementing it in Node:_

```javascript
import test from 'tappedout'
```

#### Browser, Deno

![Version](https://img.shields.io/npm/v/tappedout?label=Latest&style=for-the-badge)

```javascript
import test from 'https://cdn.pika.dev/tappedout^0.0.1' // <-- Update the version
```

## Usage

Here's a basic example:

```javascript
import test from 'tappedout'

test('My Test Suite', t => {
  t.ok(true, 'I am OK.')
  t.ok(false, 'I am still OK.') // Expect a failure here!
})
```

**Output:**

```sh
TAP version 13
# My Test Suite
ok 1 - I am OK.
not ok 2 - I am still OK.
1..2
```

**_Alternative output formats:_**

TAP (Test Anything Protocol) is a language-agnostic format for documenting test results. However, there are [many different formatters](https://github.com/search?l=JavaScript&q=tap+format&type=Repositories) available if you search npm/github. It's actually pretty easy to create your own using [tap-parser](https://github.com/tapjs/tap-parser) or a similar library.

TAP producers generally output to stdout/stderr (console). However, there are some circumstances where an alternative output mechanism is desired. The `tappedout` library supports overriding the default output mechanism. For example, to use a custom handler, set the logger as:

```javascript
import test from 'tappedout'

test.logger = function () {
  // Prefix 'TAP:' to every line
  console.log(`TAP:`, ...arguments)
}

test('title', t => { ... }})
```

The most common reason for overriding the output mechanism is for writing results to a file.

## Overview: How to Make Simple/Awesome Tests

##### Really... you should read this section if you like making things easy on yourself.

The API is very simple, yet very powerful. There are some simple design principles that can make the experience of testing great. Write less code, more naturally.

1. **Directives**
   [TAP directives](https://testanything.org/tap-version-13-specification.html#directives) are special/optional "notes" in the output. There are only two options: `skip` and `todo`. These directives can be added/removed throughout the development lifecycle, making it easier to focus on the tests that matter. This can be really helpful as test suites grow. Many methods in this library support a directive option, and there are some special functions for applying directives in bulk (`test.only` and `test.skip`).`<br/><br/>`
2. **Detailed Output**
   Sometimes it is valuable to have detailed information about a particular test, such as info about why a test failed. The TAP protocol allows this to be [embedded in the output, via YAML](https://testanything.org/tap-version-13-specification.html#yaml-blocks). `<br/><br/>`

   Many of the methods in this library support key/value (JSON) arguments that will be properly embedded in the output.

   - `failinfo()` and `expect()` autocreate detail objects.
   - `info()` supports custom details.
   - All assertion/response methods support custom detail objects, wherever you see "`object` detail" as a method parameter.`<br/><br/>`

   A key usability feature of this library is the ability to add a **`DISPLAY_OUTPUT`** attribute to detail objects. By default, _passing tests do not output details_, while _non-passing tests do_. To override this behavior, make sure the detail object has an attribute called `DISPLAY_OUTPUT: true/false`.

## API

### comment (`string` message [, `object` detail])

```javascript
test('suite name', t => {
  t.comment('Comment goes here')
})
```

```sh
# Comment goes here
```

If the message is `null`, `undefined`, or blank, no output will be generated.

### pass (`string` message [, `string` directive, `object` detail])

```javascript
test('suite name', t => {
  t.pass('Looks good')
})
```

```sh
ok 1 - Looks good
```

The `directive` argument is optional. It accepts `todo` or `skip`.

### fail (`string` message [, `string` directive, `object` detail])

```javascript
test('suite name', t => {
  t.fail('Uh oh')
})
```

```sh
not ok 1 - Uh oh
```

The `directive` argument is optional. It accepts `todo` or `skip`.

### failinfo (`any` expected, `any` actual, `string` message [, `string` directive])

This is the same as the `fail` method, but it will output a detail message in YAML format (per the TAP spec).

```javascript
test('suite name', t => {
  t.failinfo(1, 2, 'Should be equal')
})
```

```sh
TAP version 13
# suite name
not ok 1 - Should be equal
  ---
  message: Unmet expectation
  severity: fail
  expected: 1
  actual: 2
  ...
1..1
```

### info (`object`)

Additional test information can be embedded in TAP results via YAML. The info method accepts a valid key/value JSON object, which will be embedded in the output in YAML format.

```javascript
test('suite name', t => {
  const passing = false

  t.ok(passing, 'test description')

  if (!passing) {
    t.info({
      message: 'Detail',
      got: {
        mytest: {
          result: false
        }
      },
      expected: {
        mytest: {
          result: true
        }
      }
    })
  }
})
```

```sh
TAP version 13
# suite name
not ok 1 - test description
  ---
  message: Detail
  got: {
    "mytest": {
      "result": false
    }
  }
  expected: {
    "mytest": {
      "result": true
    }
  }
  ...
1..1
```

### skip (`string` msg [, `object` detail])

Skip the test. This serves primarily as a placeholder for conditional tests. To skip an entire test suite, see [test.skip](#test_skip) and [test.only](#test_only).

```javascript
test('suite name', t => {
  t.skip('Not relevant to this runtime')
})
```

```sh
ok 1 # skip Not relevant to this runtime
```

### todo (`string` message, [`boolean` pass = true, `object` detail])

TODO items are a special directive in TAP. They always "pass", even if a test fails, because they're [considered to be a work in progress](https://testanything.org/tap-version-13-specification.html#todo-tests).

```javascript
test('suite name', t => {
  t.todo('Rule the world')
})
```

```sh
ok # todo Rule the world
```

To identify a "TODO" test that fails, specify the second optional argument:

```javascript
test('suite name', t => {
  t.todo('Rule the world', false)
})
```

```sh
not ok # todo Rule the world
```

_Remember_, these will still be considered "passing" tests, under the assumption something still needs to be done before they are actually part of the test suite.

### plan (`integer` count)

By specifying a plan count, it is possible to assure all of your tests run.

```javascript
test('suite name', t => {
  t.plan(1)
  t.ok(true, 'passing')
  t.ok(true, 'I should not be here')
})
```

```sh
Bail out! Expected 1 test, 2 ran.
```

If the plan count does not match the number of tests that actually run, tappedout will abort ("bail" in TAP terms) the entire process.

### ok (`boolean` condition, `string` message [, `string` directive])

A simple assertion test, expecting a boolean result.

```javascript
test('suite name', t => {
  t.ok(true, 'I expect to pass')
})
```

```sh
ok 1 - I expect to pass
```

It is also possible to supply a directive, either `todo` or `skip`:

```javascript
test('suite name', t => {
  t.ok(true, 'I expect to pass', 'skip')
})
```

```sh
ok 1 # skip I expect to pass
```

Supplying a directive is a good way to rapidly skip tests or identify things to be done later.

### throws (`function` fn, `string` message [, `string` directive])

This method accepts a function and expects it to throw an error.

```javascript
test('suite name', t => {
  t.throws(() => {
    throw new Error('Bad input')
  }, 'Error thrown when user supplies bad data')
})
```

```sh
ok 1 - Error thrown when user supplies bad data
```

It is possible to supply an optional `todo` or `skip` directive.

### doesNotThrow (`function` fn, `string` message [, `string` directive])

This method accepts a function and expects it **not** to throw an error.

```javascript
test('suite name', t => {
  t.throws(() => {
    throw new Error('Bad input')
  }, 'No problems')
})
```

```sh
not ok 1 - No problems
```

_(notice this is `not ok`)_

It is possible to supply an optional `todo` or `skip` directive.

### timeoutAfter (`integer` ms) {

Specify a timeout period for the test suite.

```javascript
test('suite name', t => {
  t.timeoutAfter(1000)

  myAsyncFunc(() => t.end())
})
```

If the timeout is exceeded, the test runner will abort the entire process (bail out).

### expect (`any` expected, `any` actual, `string` message [, `string` directive])

This is a special method which will compare the expected value to the actual value using a simple truthy/falsey check (i.e. `expected === actual`), just like the `ok` method. Unlike the `ok` method, this will output a YAML description of an error that occurs (uses `failinfo` internally). It is designed as a convenience method.

```javascript
test('suite name', t => {
  t.expect(1, 2, 'Values should be the same')
})
```

```sh
TAP version 13
# suite name
not ok 1 - Values should be the same
  ---
  message: Unmet expectation
  severity: fail
  expected: 1
  actual: 2
  ...
1..1
```

### bail (message)

Abort the process.

```javascript
test('suite name', t => {
  t.bail('Everybody PANIC')
})
```

```sh
TAP version 13
# suite name
Bail out! Everybody PANIC!
```

### end ()

Call this method to explicitly end the test.

```javascript
test('suite name', t => {
  t.ok(true, 'a-ok')
  myAsyncFunction(t.end) // Use as a callback
})
```

## Special Tests

TAP supports two main directives, `skip` and `todo`. These test methods make it easy to define an entire test suite as being "skipped" or "todo". There is also an `only` method, which ignores all other test suites.

### test.skip()

This is the same as `test()`, but with the `skip` directive applied to every test within the suite.

```javascript
test.skip('suite name', t => {
  t.ok(true, 'a-ok')
})
```

```sh
TAP version 13
# suite name
ok 1 # skip a-ok  <----- Notice "skip"
1..1
```

### test.todo()

This is the same as `test()`, but with the `todo` directive applied to every test within the suite.

```javascript
test.skip('suite name', t => {
  t.ok(true, 'a-ok')
})
```

```sh
TAP version 13
# suite name
ok 1 # todo a-ok  <----- Notice "todo"
1..1
```

### test.only()

This is the same as `test()`, but it tells the test runner to ignore all other tests which are not created using `test.only()`.

```javascript
test('suite name', t => {
  t.ok(true, 'did something')
})

test.only('suite I care about', t => {
  t.ok(true, 'a-ok')
})
```

Notice only one of the test suites is actually run.

```sh
TAP version 13
# suite I care about
ok 1 - a-ok
1..1
```

This method is very useful when a specific test within your suite breaks, allowing you to run just the tests you care about.

## Specifying Details (Example)

Providing custom detail is possible in several ways using special functions, but it is also possible to generate detailed output using any of the assertion methods. Assertion methods are those which "assert" whether a condition passes/fails. These methods include `pass()`, `fail()`, `ok()`, `throws()`, and `doesNotThrow()`.

For convenience, it is also possible to supply details for `skip()`, `todo()`, and `comment()` methods.

Here's an example of a basic "ok" assertion:

```javascript
test('suite name', t => {
  t.ok(false, 'message', {
    expected: 'my output',
    actual: 'actual result',
    hint: 'helpful information',
    myCustomAttribute: 'my custom value'
  })
})
```

```sh
TAP version 13
# suite name
not ok 1 - message
  ---
  expected: my output
  actual: actual result
  hint: helpful information
  myCustomAttribute: my custom value
  ...
1..1
```

---

MIT license. Written by Corey Butler, Copyright 2020.
