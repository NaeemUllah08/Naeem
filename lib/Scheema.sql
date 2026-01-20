-- =====================================================
-- COMPLETE INVESTMENT PLATFORM SCHEMA
-- =====================================================
-- Drop existing tables if needed (BE CAREFUL!)
-- DROP TABLE IF EXISTS profits CASCADE;
-- DROP TABLE IF EXISTS withdrawals CASCADE;
-- DROP TABLE IF EXISTS investments CASCADE;
-- DROP TABLE IF EXISTS deposits CASCADE;
-- DROP TABLE IF EXISTS investment_plans CASCADE;
-- DROP TABLE IF EXISTS admin_logs CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Financial columns
    wallet_balance DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    referral_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    total_invested DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    withdrawn_email_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL, -- Tracks withdrawn email earnings

    -- Referral system
    referral_code VARCHAR(50) UNIQUE NOT NULL,
    referred_by VARCHAR(50), -- referral code of who referred this user

    -- Account status
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_withdrawn_email_earnings ON users(withdrawn_email_earnings);

-- =====================================================
-- 2. INVESTMENT_PLANS TABLE (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS investment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,

    -- Investment range
    min_amount DECIMAL(12, 2) NOT NULL,
    max_amount DECIMAL(12, 2) NOT NULL,

    -- Profit distribution percentages
    profit_percentage DECIMAL(5, 2) NOT NULL, -- Custom profit you set (e.g., 10%, 15%)
    referral_commission_percentage DECIMAL(5, 2) DEFAULT 7.00 NOT NULL, -- Referral gets this %
    company_percentage DECIMAL(5, 2) DEFAULT 80.00 NOT NULL, -- Company takes this %
    user_keeps_percentage DECIMAL(5, 2) DEFAULT 20.00 NOT NULL, -- User keeps this %

    -- Duration settings (flexible)
    min_duration_days INTEGER NOT NULL, -- e.g., 30 days
    max_duration_days INTEGER NOT NULL, -- e.g., 60 days

    -- Optional fields
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT chk_amount_range CHECK (min_amount > 0 AND max_amount > min_amount),
    CONSTRAINT chk_duration_range CHECK (min_duration_days > 0 AND max_duration_days >= min_duration_days)
);

CREATE INDEX idx_investment_plans_active ON investment_plans(is_active);

-- =====================================================
-- 3. DEPOSITS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    transaction_id VARCHAR(255),
    receipt_url TEXT, -- URL to payment receipt/proof
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,

    -- Admin notes
    admin_note TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT chk_deposit_status CHECK (status IN ('pending', 'approved', 'rejected')),
    CONSTRAINT chk_deposit_amount CHECK (amount > 0)
);

CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_deposits_created_at ON deposits(created_at DESC);

-- =====================================================
-- 4. INVESTMENTS TABLE (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES investment_plans(id) ON DELETE RESTRICT,

    -- Investment details
    amount DECIMAL(12, 2) NOT NULL, -- Total amount invested
    company_amount DECIMAL(12, 2) NOT NULL, -- Amount going to company (80%)
    user_keeps_amount DECIMAL(12, 2) NOT NULL, -- Amount user keeps (20%)

    -- Profit tracking
    profit_percentage DECIMAL(5, 2) NOT NULL, -- Profit % at time of investment
    expected_profit DECIMAL(12, 2) NOT NULL, -- Calculated expected profit
    earned_profit DECIMAL(12, 2) DEFAULT 0.00 NOT NULL, -- Actual earned profit

    -- Referral commission (if referrer exists)
    referral_commission DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    referrer_id UUID REFERENCES users(id), -- Who gets the commission

    -- Duration
    duration_days INTEGER NOT NULL,

    -- Status and dates
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    maturity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT chk_investment_status CHECK (status IN ('active', 'matured', 'completed', 'cancelled')),
    CONSTRAINT chk_investment_amount CHECK (amount > 0)
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_plan_id ON investments(plan_id);
CREATE INDEX idx_investments_referrer_id ON investments(referrer_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_maturity_date ON investments(maturity_date);

-- =====================================================
-- 5. WITHDRAWALS TABLE (UPDATED)
-- =====================================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Withdrawal details
    amount DECIMAL(12, 2) NOT NULL,
    withdrawal_type VARCHAR(50) NOT NULL, -- 'referral_earnings', 'investment_profit', 'both'

    -- Breakdown
    referral_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    profit_amount DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,

    -- Payment details
    withdrawal_method VARCHAR(100) NOT NULL, -- 'bank', 'jazzcash', 'easypaisa', etc.
    account_details TEXT NOT NULL, -- JSON or text with account info
    transaction_id VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'pending' NOT NULL,

    -- Admin handling
    admin_note TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT chk_withdrawal_status CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed')),
    CONSTRAINT chk_withdrawal_type CHECK (withdrawal_type IN ('referral_earnings', 'investment_profit', 'both')),
    CONSTRAINT chk_withdrawal_amount CHECK (amount > 0)
);

CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
CREATE INDEX idx_withdrawals_type ON withdrawals(withdrawal_type);
CREATE INDEX idx_withdrawals_created_at ON withdrawals(created_at DESC);

-- =====================================================
-- 6. PROFITS TABLE (TRANSACTION LOG)
-- =====================================================
CREATE TABLE IF NOT EXISTS profits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE SET NULL,

    amount DECIMAL(12, 2) NOT NULL,
    profit_type VARCHAR(50) NOT NULL,
    description TEXT,

    -- Metadata
    is_withdrawn BOOLEAN DEFAULT FALSE NOT NULL,
    withdrawn_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT chk_profit_type CHECK (profit_type IN ('investment_profit', 'referral_commission', 'bonus', 'admin_adjustment'))
);

CREATE INDEX idx_profits_user_id ON profits(user_id);
CREATE INDEX idx_profits_investment_id ON profits(investment_id);
CREATE INDEX idx_profits_type ON profits(profit_type);
CREATE INDEX idx_profits_withdrawn ON profits(is_withdrawn);
CREATE INDEX idx_profits_created_at ON profits(created_at DESC);

-- =====================================================
-- 7. ADMIN_LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB, -- Additional data

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

-- =====================================================
-- 8. REFERRAL_STATS TABLE (NEW - For tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS referral_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Referral statistics
    total_referrals INTEGER DEFAULT 0 NOT NULL,
    active_referrals INTEGER DEFAULT 0 NOT NULL,
    total_referral_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    pending_referral_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,
    withdrawn_referral_earnings DECIMAL(12, 2) DEFAULT 0.00 NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    UNIQUE(user_id)
);

CREATE INDEX idx_referral_stats_user_id ON referral_stats(user_id);

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATING updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON investment_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profits_updated_at BEFORE UPDATE ON profits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_logs_updated_at BEFORE UPDATE ON admin_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_stats_updated_at BEFORE UPDATE ON referral_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert admin user (password: admin123 - hash this with bcrypt in production!)
INSERT INTO users (email, name, password, referral_code, is_admin, wallet_balance)
VALUES (
    'admin@investment.com',
    'Admin User',
    '$2a$10$rF5HQVl/yL0LjnZKZp6zEOQxHJx5K7Y.nP6vYxK0gZLjHJx5K7Y.n', -- Replace with actual bcrypt hash
    'ADMIN001',
    TRUE,
    0.00
) ON CONFLICT (email) DO NOTHING;

-- Insert sample investment plans
INSERT INTO investment_plans (
    name,
    min_amount,
    max_amount,
    profit_percentage,
    referral_commission_percentage,
    company_percentage,
    user_keeps_percentage,
    min_duration_days,
    max_duration_days,
    description,
    is_active
)
VALUES
    (
        'Starter Plan',
        600.00,
        1000.00,
        10.00,
        7.00,
        80.00,
        20.00,
        30,
        60,
        'Flexible investment between 600-1000 PKR. Earn 10% profit on your 20% kept amount. Company invests 80% in business. Maturity: 1-2 months.',
        TRUE
    ),
    (
        'Growth Plan',
        1000.00,
        5000.00,
        15.00,
        7.00,
        80.00,
        20.00,
        60,
        90,
        'Invest 1000-5000 PKR. Earn 15% profit on your 20% kept amount. Company invests 80% in business. Maturity: 2-3 months.',
        TRUE
    ),
    (
        'Premium Plan',
        5000.00,
        20000.00,
        20.00,
        7.00,
        80.00,
        20.00,
        90,
        120,
        'Premium investment 5000-20000 PKR. Earn 20% profit on your 20% kept amount. Company invests 80% in business. Maturity: 3-4 months.',
        TRUE
    ),
    (
        'Elite Plan',
        20000.00,
        100000.00,
        25.00,
        7.00,
        80.00,
        20.00,
        120,
        180,
        'Elite investment 20000-100000 PKR. Earn 25% profit on your 20% kept amount. Company invests 80% in business. Maturity: 4-6 months.',
        TRUE
    )
ON CONFLICT DO NOTHING;

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View for user dashboard stats
CREATE OR REPLACE VIEW user_dashboard_stats AS
SELECT
    u.id AS user_id,
    u.name,
    u.email,
    u.wallet_balance,
    u.referral_earnings,
    u.total_invested,
    u.total_withdrawn,
    u.referral_code,
    COUNT(DISTINCT i.id) AS total_investments,
    COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'active') AS active_investments,
    COALESCE(SUM(i.amount) FILTER (WHERE i.status = 'active'), 0) AS active_investment_amount,
    COALESCE(SUM(i.earned_profit), 0) AS total_profit_earned,
    (SELECT COUNT(*) FROM users WHERE referred_by = u.referral_code) AS total_referrals,
    (SELECT COUNT(*) FROM users ur
     JOIN investments ir ON ir.user_id = ur.id
     WHERE ur.referred_by = u.referral_code AND ir.status = 'active') AS active_referrals
FROM users u
LEFT JOIN investments i ON i.user_id = u.id
WHERE u.is_admin = FALSE
GROUP BY u.id;

-- View for admin analytics
CREATE OR REPLACE VIEW admin_analytics AS
SELECT
    (SELECT COUNT(*) FROM users WHERE is_admin = FALSE) AS total_users,
    (SELECT COUNT(*) FROM users WHERE is_admin = FALSE AND created_at > NOW() - INTERVAL '30 days') AS new_users_this_month,
    (SELECT COALESCE(SUM(amount), 0) FROM deposits WHERE status = 'approved') AS total_deposits,
    (SELECT COALESCE(SUM(amount), 0) FROM investments) AS total_invested,
    (SELECT COALESCE(SUM(company_amount), 0) FROM investments WHERE status = 'active') AS active_company_funds,
    (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed') AS total_withdrawals,
    (SELECT COUNT(*) FROM investments WHERE status = 'active') AS active_investments,
    (SELECT COUNT(*) FROM deposits WHERE status = 'pending') AS pending_deposits,
    (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') AS pending_withdrawals;

-- =====================================================
-- END OF SCHEMA
-- =====================================================






-- Create payment_gateways table
CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    account_title VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_gateways_active ON payment_gateways(is_active);

CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON payment_gateways
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();





ALTER TABLE payment_gateways ADD COLUMN IF NOT EXISTS logo_url TEXT;