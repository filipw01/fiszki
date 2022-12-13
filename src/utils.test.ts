import { describe, expect, it } from 'vitest'
import { clsx, seededShuffle } from '~/utils'

describe('clsx', () => {
  it('should merge objects only', () => {
    expect(clsx({ a: true }, { b: false })).toBe('a')
    expect(clsx({ a: true }, { b: true })).toBe('a b')
  })

  it('should merge properties of an object', () => {
    expect(clsx({ a: true, b: false })).toBe('a')
    expect(clsx({ a: true, b: true })).toBe('a b')
  })

  it('should merge strings', () => {
    expect(clsx('a', 'b')).toBe('a b')
  })

  it('should merge objects and strings', () => {
    expect(clsx({ a: true, b: true }, 'c')).toBe('a b c')
    expect(clsx('a', { b: true, c: false })).toBe('a b')
  })

  it('should not override properties', () => {
    expect(clsx({ a: true, b: true }, { b: false, c: true })).toBe('a b c')
  })

  it('should return empty string if no arguments', () => {
    expect(clsx()).toBe('')
  })
})

describe('seededShuffle', () => {
  it('should shuffle the same way based only on seed', () => {
    const baseArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    const shuffledArray = seededShuffle(baseArray)
    const arrayChanges = Object.fromEntries(
      baseArray.map((value, index) => [index, shuffledArray.findIndex((v) => v === value)])
    )
    expect(shuffledArray).toStrictEqual(seededShuffle(baseArray))
    const otherArray = ['z', 'y', 'x', 'w', 'v', 'u', 't', 's', 'r', 'q']
    const otherShuffledArray = seededShuffle(otherArray)
    const recreatedShuffledArray = (otherArray.map((value, index) => [index, value]) as [number, string][])
      .sort((a, b) => arrayChanges[a[0]] > arrayChanges[b[0]] ? 1 : -1)
      .map((a) => a[1])

    expect(otherShuffledArray).toStrictEqual(seededShuffle(otherArray))
    expect(otherShuffledArray).toStrictEqual(
      recreatedShuffledArray
    )
  })

  it('should shuffle differently based on seed', () => {
    const baseArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
    expect(seededShuffle(baseArray, 1000)).not.toStrictEqual(seededShuffle(baseArray, 500))
  })
})
