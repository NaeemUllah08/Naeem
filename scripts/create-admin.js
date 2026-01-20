/**
 * Script to create an admin user
 * Run this with: node scripts/create-admin.js
 */

const crypto = require('crypto')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function generateReferralCode(name = '') {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const namePrefix = name.substring(0, 2).toUpperCase() || 'RF'
  return `${namePrefix}${random}`
}

// Admin credentials
const adminUser = {
  email: 'admin@investment.com',
  password: 'admin123', // Change this to your desired password
  name: 'Admin User',
}

console.log('\n=== Admin User Credentials ===')
console.log('Email:', adminUser.email)
console.log('Password:', adminUser.password)
console.log('Password Hash:', hashPassword(adminUser.password))
console.log('Referral Code:', generateReferralCode(adminUser.name))
console.log('\n=== SQL Query to Insert Admin ===')
console.log(`
INSERT INTO users (name, email, password, referral_code, is_admin, is_blocked, created_at)
VALUES (
  '${adminUser.name}',
  '${adminUser.email}',
  '${hashPassword(adminUser.password)}',
  '${generateReferralCode(adminUser.name)}',
  true,
  false,
  NOW()
);

-- Then create wallet for admin
INSERT INTO wallets (user_id, balance, referral_earnings, total_invested, total_withdrawn, created_at, updated_at)
SELECT id, 0, 0, 0, 0, NOW(), NOW()
FROM users WHERE email = '${adminUser.email}';
`)

console.log('\n=== Instructions ===')
console.log('1. Copy the SQL query above')
console.log('2. Run it in your Supabase SQL Editor')
console.log('3. Login with:')
console.log('   Email:', adminUser.email)
console.log('   Password:', adminUser.password)
console.log('\n')
