import { describe, expect, it } from 'vitest'
import { sha256Hex } from '../../utils/hash'

describe('sha256Hex', () => {
  it('produces the correct hex digest for a known input', async () => {
    // SHA-256 of empty string
    const empty = new ArrayBuffer(0)
    const result = await sha256Hex(empty)
    expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('produces a 64-character lowercase hex string', async () => {
    const buf = new TextEncoder().encode('hello world').buffer as ArrayBuffer
    const result = await sha256Hex(buf)
    expect(result).toHaveLength(64)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('produces different hashes for different inputs', async () => {
    const a = new TextEncoder().encode('foo').buffer as ArrayBuffer
    const b = new TextEncoder().encode('bar').buffer as ArrayBuffer
    expect(await sha256Hex(a)).not.toBe(await sha256Hex(b))
  })
})
