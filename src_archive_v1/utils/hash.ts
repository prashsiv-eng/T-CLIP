/**
 * Compute a SHA-256 hex digest of an ArrayBuffer using the Web Crypto API.
 * Works in all modern browsers and Node 20+ without any external dependency.
 */
export async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
