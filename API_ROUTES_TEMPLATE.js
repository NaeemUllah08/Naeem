// ========================================
// USER API ROUTES
// ========================================

// FILE: app/api/user/deposit/route.js
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/middleware'

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
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 })
  }
}

// ========================================
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
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 })
  }
}

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
// FILE: app/api/user/change-password/route.js
import { hashPassword, comparePassword } from '@/lib/auth'

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
import { adminMiddleware } from '@/lib/middleware'

export async function GET(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const totalUsers = await prisma.user.count()

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

// ========================================
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

// ========================================
// FILE: app/api/admin/approve-deposit/route.js
export async function POST(req) {
  const auth = await adminMiddleware(req)
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

  try {
    const { depositId } = await req.json()

    const deposit = await prisma.deposit.findUnique({ where: { id: depositId } })

    await prisma.deposit.update({
      where: { id: depositId },
      data: { status: 'approved' },
    })

    await prisma.user.update({
      where: { id: deposit.userId },
      data: { walletBalance: { increment: deposit.amount } },
    })

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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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

// ========================================
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
