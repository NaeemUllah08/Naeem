// ========================================
// SUPABASE-POWERED API ROUTES
// ========================================
// This file contains all API routes optimized for Supabase
// Copy each section to the corresponding route.js file

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ========================================
// HELPER FUNCTIONS
// ========================================

// Generate referral code
function generateReferralCode() {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

// Hash password (simple version - Supabase Auth handles this better)
import crypto from 'crypto'
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

function comparePassword(password, hash) {
  return hashPassword(password) === hash
}

// Generate simple token (use Supabase Auth for production)
function generateToken(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function verifyToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString())
  } catch {
    return null
  }
}

// Middleware for authentication
async function authMiddleware(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  const decoded = verifyToken(token)

  if (!decoded) {
    return { error: 'Invalid token', status: 401 }
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      isBlocked: true,
    },
  })

  if (!user) {
    return { error: 'User not found', status: 404 }
  }

  if (user.isBlocked) {
    return { error: 'Account is blocked', status: 403 }
  }

  return { user }
}

async function adminMiddleware(req) {
  const authResult = await authMiddleware(req)

  if (authResult.error) {
    return authResult
  }

  if (!authResult.user.isAdmin) {
    return { error: 'Admin access required', status: 403 }
  }

  return authResult
}

// ========================================
// AUTH ROUTES
// ========================================

// FILE: app/api/auth/register/route.js
export async function POST(req) {
  try {
    const { name, email, password, referredBy } = await req.json()

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Validate referral code if provided
    if (referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referredBy },
      })

      if (!referrer) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        )
      }
    }

    // Create user in Supabase database
    const hashedPassword = hashPassword(password)
    const referralCode = generateReferralCode()

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        referralCode,
        referredBy: referredBy || null,
      },
    })

    return NextResponse.json(
      { message: 'User registered successfully', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}

// ========================================
// FILE: app/api/auth/login/route.js
export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Your account has been blocked' },
        { status: 403 }
      )
    }

    const isValidPassword = comparePassword(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken({ userId: user.id, isAdmin: user.isAdmin })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}

// ========================================
// USER API ROUTES
// ========================================

// FILE: app/api/user/dashboard/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    // Get user with wallet balance
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { walletBalance: true, referralCode: true },
    })

    // Get all investments for this user
    const investments = await prisma.investment.findMany({
      where: { userId: auth.user.id },
    })

    // Calculate total investments
    const totalInvestments = investments.reduce((sum, inv) => sum + inv.amount, 0)

    // Get all profits
    const profits = await prisma.profit.findMany({
      where: { userId: auth.user.id },
    })

    const totalProfit = profits.reduce((sum, profit) => sum + profit.amount, 0)

    // Get referrals count
    const referrals = await prisma.user.count({
      where: { referredBy: user.referralCode },
    })

    // Get recent activities (last 5 profits)
    const recentActivities = await prisma.profit.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      stats: {
        walletBalance: user.walletBalance,
        totalInvestments,
        totalProfit,
        referrals,
      },
      recentActivities,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

// FILE: app/api/user/wallet/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { walletBalance: true },
    })

    const deposits = await prisma.deposit.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      balance: user.walletBalance,
      deposits,
    })
  } catch (error) {
    console.error('Wallet error:', error)
    return NextResponse.json({ error: 'Failed to load wallet' }, { status: 500 })
  }
}

// FILE: app/api/user/deposit/route.js
export async function POST(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { amount, paymentMethod, transactionId } = await req.json()

    const deposit = await prisma.deposit.create({
      data: {
        userId: auth.user.id,
        amount: parseFloat(amount),
        paymentMethod,
        transactionId: transactionId || null,
        status: 'pending',
      },
    })

    return NextResponse.json({ deposit }, { status: 201 })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 })
  }
}

// FILE: app/api/user/withdraw/route.js
export async function POST(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { amount, withdrawalMethod, accountDetails } = await req.json()

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })

    if (user.walletBalance < parseFloat(amount)) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: auth.user.id,
        amount: parseFloat(amount),
        withdrawalMethod,
        accountDetails,
        status: 'pending',
      },
    })

    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 })
  }
}

// FILE: app/api/user/investments/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const investments = await prisma.investment.findMany({
      where: { userId: auth.user.id },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ investments })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load investments' }, { status: 500 })
  }
}

// FILE: app/api/user/investment-plans/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const plans = await prisma.investmentPlan.findMany({
      where: { isActive: true },
      orderBy: { profitPercentage: 'asc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
  }
}

// FILE: app/api/user/invest/route.js
export async function POST(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { planId, amount } = await req.json()

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })
    const plan = await prisma.investmentPlan.findUnique({ where: { id: planId } })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (amount < plan.minAmount || amount > plan.maxAmount) {
      return NextResponse.json({ error: 'Amount out of range' }, { status: 400 })
    }

    if (user.walletBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Use Supabase transaction
    const investment = await prisma.investment.create({
      data: {
        userId: auth.user.id,
        planId,
        amount: parseFloat(amount),
        status: 'active',
      },
    })

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { walletBalance: user.walletBalance - parseFloat(amount) },
    })

    return NextResponse.json({ investment }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Investment failed' }, { status: 500 })
  }
}

// FILE: app/api/user/withdrawals/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ withdrawals })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load withdrawals' }, { status: 500 })
  }
}

// FILE: app/api/user/referrals/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { referralCode: true },
    })

    const referrals = await prisma.user.findMany({
      where: { referredBy: user.referralCode },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    const totalEarnings = await prisma.profit.aggregate({
      where: { userId: auth.user.id, type: 'referral' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      referralCode: user.referralCode,
      referrals,
      stats: {
        totalReferrals: referrals.length,
        totalEarnings: totalEarnings._sum.amount || 0,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 })
  }
}

// FILE: app/api/user/profile/route.js
export async function GET(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: {
        name: true,
        email: true,
        referralCode: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
  }
}

// FILE: app/api/user/change-password/route.js
export async function POST(req) {
  const auth = await authMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { currentPassword, newPassword } = await req.json()

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } })

    if (!comparePassword(currentPassword, user.password)) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: auth.user.id },
      data: { password: hashPassword(newPassword) },
    })

    return NextResponse.json({ message: 'Password updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}

// ========================================
// ADMIN API ROUTES
// ========================================

// FILE: app/api/admin/dashboard/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const totalUsers = await prisma.user.count({ where: { isAdmin: false } })

    const depositsSum = await prisma.deposit.aggregate({
      where: { status: 'approved' },
      _sum: { amount: true },
    })

    const investmentsSum = await prisma.investment.aggregate({
      _sum: { amount: true },
    })

    const pendingDeposits = await prisma.deposit.count({
      where: { status: 'pending' },
    })

    const pendingWithdrawals = await prisma.withdrawal.count({
      where: { status: 'pending' },
    })

    return NextResponse.json({
      stats: {
        totalUsers,
        totalDeposits: depositsSum._sum.amount || 0,
        totalInvestments: investmentsSum._sum.amount || 0,
        pendingDeposits,
        pendingWithdrawals,
      },
      recentActivities: [],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}

// FILE: app/api/admin/deposits/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const deposits = await prisma.deposit.findMany({
      where: { status },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ deposits })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load deposits' }, { status: 500 })
  }
}

// FILE: app/api/admin/approve-deposit/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { depositId } = await req.json()

    const deposit = await prisma.deposit.findUnique({ where: { id: depositId } })

    // Update deposit status
    await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'approved' },
    })

    // Add amount to user wallet
    await prisma.user.update({
      where: { id: deposit.userId },
      data: { walletBalance: { increment: deposit.amount } },
    })

    // Create admin log
    await prisma.adminLog.create({
      data: {
        adminId: auth.user.id,
        action: 'approve_deposit',
        description: `Approved deposit of $${deposit.amount}`,
      },
    })

    return NextResponse.json({ message: 'Deposit approved' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve deposit' }, { status: 500 })
  }
}

// FILE: app/api/admin/reject-deposit/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { depositId } = await req.json()

    await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'rejected' },
    })

    return NextResponse.json({ message: 'Deposit rejected' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject deposit' }, { status: 500 })
  }
}

// FILE: app/api/admin/withdrawals/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'pending'

    const withdrawals = await prisma.withdrawal.findMany({
      where: { status },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ withdrawals })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load withdrawals' }, { status: 500 })
  }
}

// FILE: app/api/admin/approve-withdrawal/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { withdrawalId, transactionId } = await req.json()

    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } })

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'approved', transactionId },
    })

    await prisma.user.update({
      where: { id: withdrawal.userId },
      data: { walletBalance: { decrement: withdrawal.amount } },
    })

    return NextResponse.json({ message: 'Withdrawal approved' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to approve withdrawal' }, { status: 500 })
  }
}

// FILE: app/api/admin/reject-withdrawal/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { withdrawalId, reason } = await req.json()

    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: 'rejected', rejectionReason: reason },
    })

    return NextResponse.json({ message: 'Withdrawal rejected' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reject withdrawal' }, { status: 500 })
  }
}

// FILE: app/api/admin/users/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const users = await prisma.user.findMany({
      where: { isAdmin: false },
      select: {
        id: true,
        name: true,
        email: true,
        walletBalance: true,
        referralCode: true,
        isBlocked: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

// FILE: app/api/admin/block-user/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { userId, isBlocked } = await req.json()

    await prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
    })

    return NextResponse.json({ message: 'User status updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// FILE: app/api/admin/investment-plans/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const plans = await prisma.investmentPlan.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load plans' }, { status: 500 })
  }
}

// FILE: app/api/admin/create-plan/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { name, minAmount, maxAmount, profitPercentage, duration, description } = await req.json()

    const plan = await prisma.investmentPlan.create({
      data: {
        name,
        minAmount,
        maxAmount,
        profitPercentage,
        duration,
        description: description || null,
        isActive: true,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create plan' }, { status: 500 })
  }
}

// FILE: app/api/admin/toggle-plan/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { planId, isActive } = await req.json()

    await prisma.investmentPlan.update({
      where: { id: planId },
      data: { isActive },
    })

    return NextResponse.json({ message: 'Plan status updated' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 })
  }
}

// FILE: app/api/admin/logs/route.js
export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const logs = await prisma.adminLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ logs })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load logs' }, { status: 500 })
  }
}
