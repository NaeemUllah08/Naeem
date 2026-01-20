import { verifyToken } from './auth'
import { supabaseAdmin } from './supabase'

export async function authMiddleware(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  if (!token) {
    return { error: 'Unauthorized', status: 401 }
  }

  const decoded = verifyToken(token)

  if (!decoded) {
    return { error: 'Invalid token', status: 401 }
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, name, is_admin, is_blocked, referral_code, created_at')
    .eq('id', decoded.userId)
    .single()

  if (error || !user) {
    return { error: 'User not found', status: 404 }
  }

  if (user.is_blocked) {
    return { error: 'Account is blocked', status: 403 }
  }

  return { user: {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin,
    isBlocked: user.is_blocked,
    referralCode: user.referral_code,
    createdAt: user.created_at
  } }
}

export async function adminMiddleware(req) {
  const authResult = await authMiddleware(req)

  if (authResult.error) {
    return authResult
  }

  if (!authResult.user.isAdmin) {
    return { error: 'Admin access required', status: 403 }
  }

  return authResult
}
