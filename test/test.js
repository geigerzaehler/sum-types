import {makeSum, caseof} from '../src/index.js'
import assert from 'assert'

describe('#makeSum() value', function () {
  it('is instance of constructor', function () {
    let T = makeSum({A: []})
    assert(T.A() instanceof T.A)
  })

  it('is instance of type', function () {
    let T = makeSum({A: []})
    assert(T.A() instanceof T)
  })

  it('gets properties from arguments', function () {
    let T = makeSum({A: ['x', 'y', 'z']})
    let a = T.A('X', 'Y', 'Z')
    let data = Object.assign({}, a)
    assert.deepStrictEqual(data, {x: 'X', y: 'Y', z: 'Z'})
  })

  it('gets properties from constructor function', function () {
    let T = makeSum({
      A (x, y, z) {
        return {x, y: z, z: y}
      },
    })
    let a = T.A('X', 'Y', 'Z')
    let data = Object.assign({}, a)
    assert.deepStrictEqual(data, {x: 'X', y: 'Z', z: 'Y'})
  })
})


// We actually use `makeEliminator` to test `caseof`.
describe('#caseof()', function () {
  let T = makeSum({A: [], B: [], C: []})

  function makeEliminator (handlers) {
    return (x) => caseof(x, handlers)
  }

  it('deconstructs value', function () {
    let elim = makeEliminator([
      [T.A, id],
      [T.B, id],
      [T.C, id],
    ])

    ;[T.A, T.B, T.C].forEach((Ctor) => {
      let val = Ctor()
      assert.equal(elim(val), val)
    })
  })

  it('throws TypeError if value is not matched', function () {
    let elim = makeEliminator([
      [T.A, () => {}],
    ])
    assert.doesNotThrow(() => elim(T.A()))
    assert.throws(() => elim(T.B()), TypeError)
    assert.throws(() => elim(T.C()), TypeError)
  })

  it('matches all values against "null"', function () {
    let elim = makeEliminator([
      [T.A, () => 'a'],
      [null, () => 'def'],
    ])
    assert.equal(elim(T.A()), 'a')
    assert.equal(elim(T.B()), 'def')
    assert.equal(elim(T.C()), 'def')
    assert.equal(elim(0), 'def')
  })

  it('handles multiple matchers', function () {
    let elim = makeEliminator([
      [[T.A, T.B], () => 'a or b'],
      [T.C, () => 'c'],
    ])
    assert.equal(elim(T.A()), 'a or b')
    assert.equal(elim(T.B()), 'a or b')
    assert.equal(elim(T.C()), 'c')
  })
})

function id (x) {
  return x
}
