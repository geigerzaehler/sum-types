import {otherwise, caseof} from '../src/caseof-eq.js'
import assert from 'assert'

describe('#caseof() with equality match', function () {
  it('matches correct case', function () {
    const cases = [
      ['A', () => 'A'],
      ['B', () => 'B'],
      ['C', 'D', () => 'CD'],
      [otherwise, () => null],
    ]

    assert.equal(caseof('A', cases), 'A')
    assert.equal(caseof('B', cases), 'B')
    assert.equal(caseof('C', cases), 'CD')
    assert.equal(caseof('D', cases), 'CD')
    assert.equal(caseof('X', cases), null)
  })

  it('throws for unmatched target', function () {
    assert.throws(() => {
      caseof('A', [['B', () => null]])
    }, /Unmatched case for/)
  })
})
