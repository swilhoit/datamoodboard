import crypto from 'crypto'

const ALGO = 'aes-256-gcm'

export function encryptString(plaintext: string, secret?: string) {
  const key = crypto.createHash('sha256').update(String(secret || process.env.ENCRYPTION_KEY || '')).digest()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptString(ciphertextB64: string, secret?: string) {
  const buffer = Buffer.from(ciphertextB64, 'base64')
  const iv = buffer.subarray(0, 12)
  const tag = buffer.subarray(12, 28)
  const data = buffer.subarray(28)
  const key = crypto.createHash('sha256').update(String(secret || process.env.ENCRYPTION_KEY || '')).digest()
  const decipher = crypto.createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return decrypted.toString('utf8')
}


