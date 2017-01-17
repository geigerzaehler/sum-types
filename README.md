Sum Types in Javascript
=======================

[![Build Status](https://travis-ci.org/geigerzaehler/sum-types.svg?branch=master)](https://travis-ci.org/geigerzaehler/sum-types)

This is a library to define sum type constructors and open values by matching
against different constructors. The package will help you to write more
readable, robust, and expressive Javascript code.

*When should I use sum types?* If you have `switch ... case` or multiple
`if ... else if` statements in your code there is a good chance sum types will
make your code more readable, expressive, and robust. This is especially the
case if multiple functions with switch statements operate on the same type of
values.

[API](#api) | [Motivation](#motivation)

API
---

Install from NPM
~~~
npm install --save sum-types
~~~

### `import 'sum-types'`

~~~js
import {makeSum, caseof} from 'sum-types'
~~~

#### `makeSum()`

Creates an map of constructor functions from constructor definitions

~~~js
let T = makeSum({
  A (x, y, z) {
    return {x, y, z, all: [x, y, z]}
  },
  // More constructors ...
})
~~~

The return value `T` is a map that has a constructor functions for each function
given in the argument object. The constructors need not be invoked with the
`new` operator. In particular the following is true.

~~~js
T.A() instanceof T.A
T.B() instanceof T.B
~~~

If the value for a key in the constructor definition is a function it is called
with the arguments passed to the constructor. The result must be an object that
is then assigned to the instance.

~~~js
let a = T.A('x', 'y', 'z')
a.x === 'x'
// ...
a.all[2] === 'z'
~~~

If the value of for a key is an array of strings the constructor arguments are
mapped to properties according to the names in the array.

~~~js
let T = makeSum({
  B: ['foo', 'bar'],
})
let b = T.B(0, 1)
b.foo === 0
b.bar === 1
~~~


#### `caseof()`

The `caseof()` function accepts to arguments. The first is the value to be
matched and the second is a list of constructor-function pairs. The function
checks if the value is an instance of a constructor in the list, applies the
corresponding function and returns the result.

~~~js
let value = new C();
let result = caseof(value, [
  [C, (c) => c],
  [D, (d) => null]
])
result === value
~~~

In this example the function `(c) => c` will be called with `value` and its
result we be returned by `caseof()`.

The function will throw a `TypeError` when the result is unhandled.

You can give multiple constructors for the same value
~~~js
caseof(value, [
  [[C,D], handle],
  // ...
])
~~~
The `handle` function will be called for values that are either an instance of
`C` or `D`.

You can provide a default handler by specifying `null` as the constructor
~~~js
caseof(value, [
  // ...
  [null, handleOtherValues]
])
~~~


### `caseofEq()`

_Added in v0.9.4_

~~~js
import {caseofEq, otherwise} from 'sum-types'
~~~

The `caseofEq()` function matches against patterns using strict equality (`===`).

~~~js
const result = caseofEq(value, [
  ['A', () => 'a'],
  ['B', 'C', () => 'bc'],
  [otherwise, () => 'otherwise'],
])
~~~

If the value is `A` the result will be `a`. If the value is either `B` or `C`
the result will be `bc`. In all other cases the result will be `otherwise`.

Note that the syntax is slightly different from `caseof()`: Multiple patterns
are not wrapped in an array.


Motivation
----------

This is a small example motivating the use of sum types in data modelling and
the use of this library in particular.

### The Use Case

We want to write a function `parseAndPrint` that will parse a string into a JSON
object and print it on the console. If the parsing fails we want to print an
error. As an additional twist we also want to print information on how many atomic
values (string, number, booleans, `null`) the parsed object contains.

To make our code modular we want to separate the parsing and the
printing.
~~~js
function parseAndPrint (str) {
  printResult(parse(str))
}
~~~
(Note that we decided not to throw an error when parsing fails. This is a
conscious choice to make our code compose better.)

Lets look at the implementation of `printResult` first. The key point is that we
need to distinguish between a parsing success and failure.
~~~js
function printResult (result) {
  if (result.type === 'success') {
    console.log(`String parsed as ${result.value} with ${result.atoms} atoms`)
  } else if (result.type === 'failure')
    console.log(`Failed to parse string: ${result.message}`)
  }
}
~~~
The function accepts the parser result as an argument. To distinguish between a
success result and a failure we use a simple `type` tag on the result object.

With the shape of a parsing result defined we implement our parser.
~~~js
function parse (str) {
  try {
    let value = JSON.parse(str)
    return {type: 'success', atoms: getAtomNumber(value), value: value}
  } catch (e) {
    return {type: 'failure', message: e.message}
  }
}
~~~
Although the implementation seems concise, we will see that there are a number of
problems with this approach when we want to extend our code.

### Adding a Parser

Assume that we want to create another implementation of `parse` that uses a
different parser internally but returns the same result object. That other
parser is called `rawParseFast` and returns an object or `null` if parsing
failed.

~~~js
function parseFast (str) {
  let value = rawParseFast(str);
  if (value === null) {
    return {type: 'failure', message: 'Parsing failed'}
  } else {
    return {type: 'success', atoms: getAtomNumber(value), value: value}
  }
}
~~~

We immediately see that we have duplicated code in our two parsing
implementations. To abstract this we create two constructors.

~~~js
function ResultSuccess (value) {
  this.value = value
  this.atoms = getAtomNumber(value)
}

function ResultFailure (message) {
  this.message = message
}
~~~

Note that we have omitted the `type` property from the constructors. This is
because we also change the printing function to something more robust

~~~js
function printResult (result) {
  if (result instanceof ResultSuccess) {
    console.log(`String parsed as ${result.value} with ${result.atoms} atoms`)
  } else if (result instanceof ResultFailure)
    console.log(`Failed to parse string: ${result.error}`)
  } else {
    throw new TypeError(`expected ${result} to be parse result`)
  }
}
~~~
This function now catches wrong parameters and does not use the brittle string
approach to select the result case. In turn our parsing functions now looks like
this

~~~js
function parse (str) {
  try {
    let value = JSON.parse(str)
    return new ParseSuccess(value)
  } catch (e) {
    return new ParseFailure(e.message)
  }
}

function parseFast (str) {
  let value = rawParseFast(str);
  if (value === null) {
    return ParseFailure('Parsing failed')
  } else {
    return ParseSuccess(value)
  }
}
~~~

### Handling Parser Results

We now turn our eye towards the `printResult` function. We want print horizontal
lines before and after the actual message to highlight it in the console. We
could accomplish this by adding two `console.log` statements to each case but we
choose a different route.

~~~js
function printResult (result) {
  let message
  if (result instanceof ResultSuccess) {
    message = `String parsed as ${result.value} with ${result.atoms} atoms`
  } else if (result instanceof ResultFailure)
    message = `Failed to parse string: ${result.error}`
  } else {
    throw new TypeError(`expected ${result} to be parse result`)
  }
  console.log('=============')
  console.log(message)
  console.log('=============')
}
~~~

We immediately make two observations: Firstly, the `if ... else if` is not an
expression which leads to some awkwardness with the `message` variable. And
secondly, there is a lot boilerplate involved: The segments `message = _` and
`else if (result instance of _)` are repeated multiple times.

If we are going to implement another printer we will run into the same issues in
addition to the repeated `throw new TypeError()` statement.

A quick look at the documentation of [`caseof`](#caseof) reveals that it is
exactly the kind of function that will remove this boilerplate.

### Putting It All Together

Using the `sum-types` library we obtain the following readable and robust
implementation.

~~~js
const Result = makeSum({
  Success (value) {
    let atoms = getAtomNumber(value)
    return {atoms, value}
  },
  Failure: ['message']
})

function parse (str) {
  try {
    let value = JSON.parse(str)
    return Result.Success(value)
  } catch (e) {
    return Result.Failure(e.message)
  }
}

function parseFast (str) {
  let value = rawParseFast(str);
  if (value === null) {
    return Result.Failure('Parsing failed')
  } else {
    return Result.Success(value)
  }
}

function printResult (result) {
  let message = caseof(result, [
    [Result.Success, ({value, atoms}) => {
      return `String parsed as ${value} with ${atoms} atoms`
    }],
    [Result.Failure, ({message}) => `Failed to parse string: ${message}`]
  ])
  console.log('=============')
  console.log(message)
  console.log('=============')
}
~~~
