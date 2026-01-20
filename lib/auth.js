import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

export function comparePassword(password, hash) {
  return hashPassword(password) === hash
}

export function generateToken(data) {
  return jwt.sign(data, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function generateReferralCode(name = '') {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const namePrefix = name.substring(0, 2).toUpperCase() || 'RF'
  return `${namePrefix}${random}`
}