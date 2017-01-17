import {otherwise, caseofEq} from '../src'
import assert from 'assert'

describe('#caseofEq()', function () {
  it('matches correct case', function () {
    const cases = [
      ['A', () => 'A'],
      ['B', () => 'B'],
      ['C', 'D', () => 'CD'],
      [otherwise, () => null],
    ]

    assert.equal(caseofEq('A', cases), 'A')
    assert.equal(caseofEq('B', cases), 'B')
    assert.equal(caseofEq('C', cases), 'CD')
    assert.equal(caseofEq('D', cases), 'CD')
    assert.equal(caseofEq('X', cases), null)
  })

  it('throws for unmatched target', function () {
    assert.throws(() => {
      caseofEq('A', [['B', () => null]])
    }, /Unmatched case for/)
  })
})
