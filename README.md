# Investment Platform - Next.js 🚀

A comprehensive, fully responsive investment management platform built with Next.js 14, featuring separate user and admin dashboards with modern UI/UX design.

## ✨ Key Highlights

- 📱 **Fully Responsive Design** - Optimized for mobile, tablet, and desktop
- 🎨 **Modern UI/UX** - Beautiful gradients, smooth transitions, and intuitive interfaces
- 🔐 **Secure Authentication** - JWT-based auth with password hashing
- 💰 **Investment Management** - Complete investment lifecycle management
- 👥 **Referral System** - Built-in referral tracking and rewards
- ⚡ **Fast & Optimized** - Built with Next.js 14 App Router

## Features

### User Side
- ✅ User registration & login with JWT authentication
- ✅ Responsive wallet balance management
- ✅ Browse and invest in multiple investment plans
- ✅ Real-time profit calculations
- ✅ Withdrawal request management
- ✅ Referral system with unique codes and social sharing
- ✅ Mobile-friendly dashboard with quick actions
- ✅ Transaction history tracking
- ✅ **Shopping System** - Browse and purchase products
- ✅ **Product Categories** - Filter products by category
- ✅ **My Investments** - Track active investments with progress bars

### Admin Panel
- ✅ Comprehensive admin dashboard with statistics
- ✅ Approve/reject deposit requests
- ✅ Process withdrawal requests
- ✅ Create and manage investment plans
- ✅ User management (block/unblock accounts)
- ✅ View user referral networks
- ✅ Financial overview with charts
- ✅ Fully responsive tables and layouts
- ✅ Activity logs and reports
- ✅ **Products Management** - Complete CRUD for products
- ✅ **Category Management** - Organize products by categories
- ✅ **Sample Data Seeding** - Quick setup with sample products

## 🛠️ Tech Stack

- **Framework:** Next.js 14.2.35 (App Router)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS 3.4.3
- **Database:** Supabase (PostgreSQL)
- **Authentication:** JWT with bcryptjs
- **Icons:** React Icons 5.2.1
- **Notifications:** React Hot Toast 2.4.1
- **Currency:** Pakistani Rupee (PKR) formatting

## 📱 Responsive Design Features

This platform is fully optimized for all screen sizes with the following breakpoints:

- **Mobile First**: Base styles for devices < 640px
- **sm**: 640px and up (Small tablets)
- **md**: 768px and up (Tablets)
- **lg**: 1024px and up (Laptops)
- **xl**: 1280px and up (Desktops)

### Mobile Optimizations:
- ✅ Hamburger menu for navigation on mobile
- ✅ Collapsible sidebar with smooth animations
- ✅ Touch-friendly buttons and inputs
- ✅ Responsive tables with horizontal scroll
- ✅ Optimized font sizes for readability
- ✅ Adaptive padding and spacing
- ✅ Stacked layouts on small screens

## Installation

### 1. Install Dependencies

```bash
cd investment-platform
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and update with your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# JWT Secret for authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 3. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `database/schema.sql` in Supabase SQL Editor
3. (Optional) Run `database/dummy-data.sql` for test data

### 4. Create Admin User

Use the dummy data SQL file or register through the app and update the user in Supabase:
- Default admin credentials: `admin@investment.com` / `admin123`

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
business Details/
├── app/
│   ├── (auth)/                     # Authentication routes (public)
│   │   ├── login/page.js          # Login page
│   │   └── register/page.js       # Registration page with referral support
│   ├── (dashboard)/               # Protected dashboard routes
│   │   ├── user/                  # User dashboard
│   │   │   ├── layout.js          # User layout with responsive sidebar
│   │   │   ├── page.js            # User dashboard home
│   │   │   ├── wallet/page.js     # Wallet & deposits
│   │   │   ├── investments/page.js # Investment plans
│   │   │   ├── withdrawals/page.js # Withdrawal requests
│   │   │   ├── referrals/page.js  # Referral management
│   │   │   ├── profile/page.js    # User profile
│   │   │   └── email-submissions/page.js
│   │   └── admin/                 # Admin dashboard
│   │       ├── layout.js          # Admin layout with auth check
│   │       ├── page.js            # Admin dashboard home
│   │       ├── deposits/page.js   # Deposit management
│   │       ├── withdrawals/page.js # Withdrawal management
│   │       ├── users/page.js      # User management
│   │       ├── investments/page.js # Investment plan CRUD
│   │       ├── products/page.js   # Product management
│   │       ├── emails/page.js     # Email management
│   │       ├── reports/page.js    # Reports & logs
│   │       └── settings/page.js   # Settings
│   ├── api/                       # API routes
│   │   ├── auth/                  # Authentication endpoints
│   │   │   ├── login/route.js
│   │   │   └── register/route.js
│   │   ├── user/                  # User API endpoints
│   │   │   ├── dashboard/route.js
│   │   │   ├── wallet/route.js
│   │   │   ├── deposit/route.js
│   │   │   ├── invest/route.js
│   │   │   ├── investment-plans/route.js
│   │   │   ├── referrals/route.js
│   │   │   └── profile/route.js
│   │   └── admin/                 # Admin API endpoints
│   │       ├── deposits/route.js
│   │       ├── withdrawals/route.js
│   │       ├── users/route.js
│   │       ├── investments/route.js
│   │       └── logs/route.js
│   ├── layout.js                  # Root layout
│   └── page.js                    # Landing page
├── components/
│   ├── layout/
│   │   └── Sidebar.js            # Responsive sidebar with mobile menu
│   └── ui/
│       ├── Card.js               # Reusable card wrapper
│       ├── StatCard.js           # Statistics display (responsive)
│       └── Table.js              # Table component
├── lib/
│   ├── supabase.js               # Supabase client initialization
│   ├── supabase-browser.js       # Browser-side Supabase
│   ├── auth.js                   # JWT & password utilities
│   ├── currency.js               # PKR formatting
│   └── middleware.js             # Auth middleware
└── public/                       # Static assets
```

## 🎯 Page Routes & Functionality

### Public Routes
- **`/`** - Landing page with login/register buttons
- **`/login`** - User & admin login
- **`/register`** - User registration with optional referral code

### User Routes (Protected)
- **`/user`** - Dashboard with stats and quick actions
- **`/user/wallet`** - Wallet balance, deposit form, and history
- **`/user/investments`** - Browse plans and create investments
- **`/user/my-investments`** - Track active investments with progress
- **`/user/withdrawals`** - Request and track withdrawals
- **`/user/referrals`** - View referral code, link, and social sharing
- **`/user/shopping`** - Browse and purchase products
- **`/user/profile`** - User profile management
- **`/user/email-submissions`** - Email submission handling

### Admin Routes (Admin Only)
- **`/admin`** - Admin dashboard with platform statistics
- **`/admin/deposits`** - Approve/reject deposit requests
- **`/admin/withdrawals`** - Process withdrawal requests
- **`/admin/users`** - Manage users, view referrals, block accounts
- **`/admin/investments`** - Full CRUD for investment plans
- **`/admin/products`** - Complete product and category management
- **`/admin/emails`** - Email service management
- **`/admin/reports`** - View activity logs and reports
- **`/admin/settings`** - Platform configuration

## 🛍️ Shopping System

The platform includes a complete shopping/e-commerce system. For detailed documentation on managing products and categories, see [SHOPPING_GUIDE.md](./SHOPPING_GUIDE.md).

### Quick Start
1. Login as admin
2. Navigate to **Products Management**
3. Click **"Add Sample Products"** to populate with 10 sample products across 4 categories
4. Users can now browse products in the **Shopping** section

## Default Credentials

After setting up, create users through the register page. To create an admin:

1. Register a regular user
2. Go to your database (Prisma Studio)
3. Find the user and set `isAdmin = true`

## 💼 Features Overview

### User Dashboard
- 📊 View wallet balance, total investments, profits, and referrals
- ⚡ Quick actions for deposits and investments
- 📈 Recent activity feed with transaction types
- 📱 Fully responsive stat cards

### User Wallet
- 💵 View current balance with PKR formatting
- 💳 Submit deposit requests (Bank Transfer, EasyPaisa, JazzCash, Crypto)
- 📝 Track deposit history with status badges
- 🔄 Real-time status updates (pending, approved, rejected)

### Investments
- 🎯 Browse available investment plans with beautiful card design
- 💰 Create new investments with custom amounts
- 📊 Real-time profit calculations
- ⏱️ Flexible duration selection
- 🎨 Modern oval-shaped plan cards with gradients

### Withdrawals
- 💸 Request withdrawals from wallet balance
- 📋 Track withdrawal status and history
- 🔍 Filter by status
- 📱 Mobile-optimized table views

### Referrals
- 🔗 Unique referral code and shareable link
- 👥 View all referred users with join dates
- 💰 Track referral earnings
- 📊 Referral statistics

### Admin Dashboard
- 📊 Comprehensive platform statistics
- ⚠️ Pending approvals count with quick access
- 📈 Financial overview with progress bars
- 🎯 Activity overview cards
- 📱 Fully responsive grid layout

### Admin Deposits Management
- 📋 View all deposits with filtering
- ✅ Approve or reject requests
- 👤 User details with email
- 💳 Payment method tracking
- 🆔 Transaction ID verification

### Admin Withdrawals Management
- 💸 Process withdrawal requests
- 🆔 Add transaction IDs
- ✅ Approve or reject with status updates
- 📱 Mobile-friendly interface

### Admin User Management
- 👥 View all registered users
- 🔒 Block/unblock user accounts
- 💰 View wallet balances
- 🔗 See referral codes
- 👨‍👩‍👧‍👦 Expandable referral network view

### Admin Investment Plans
- ➕ Create new investment plans
- ✏️ Edit existing plans
- 🗑️ Delete plans with confirmation
- 🔄 Toggle plan status (active/inactive)
- 📸 Upload plan logos
- ⚙️ Configure profit %, min/max amounts, duration
- 💰 Set referral commission and profit split
- 📱 Beautiful modal forms

### Admin Reports
- 📊 View admin activity logs
- 🔍 Track system actions and changes
- 📈 Platform analytics

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#3B82F6, #2563EB, #0066CC)
- **Secondary**: Purple (#A855F7, #9333EA)
- **Success**: Green (approved status)
- **Warning**: Yellow (pending status)
- **Danger**: Red (rejected status)
- **Gradients**: Blue-to-Purple for headers and branding

### Component Patterns
- **Cards**: White background with shadow, rounded corners
- **Buttons**: Primary (blue), Secondary (outlined), Danger (red)
- **Status Badges**: Color-coded pills (green/yellow/red)
- **Modals**: Backdrop blur with smooth animations
- **Forms**: Consistent input styling with focus rings

### Responsive Implementation
All pages include:
- Progressive text sizing (`text-sm sm:text-base md:text-lg`)
- Adaptive padding (`p-4 sm:p-6 lg:p-8`)
- Responsive grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)
- Mobile-first approach with Tailwind breakpoints
- Touch-friendly minimum sizes (44px×44px for buttons)

## 💡 Development Notes

### Authentication
- JWT tokens stored in `localStorage`
- Token included in all API requests via `Authorization` header
- Admin routes check both token validity and `isAdmin` flag
- Blocked users cannot login (checked in auth API)

### Data Flow
- Client → API Route → Supabase → Response
- Real-time updates via data fetching on mount
- Optimistic UI updates for better UX

### Referral System
- Unique codes generated using `auth.js` utility
- Format: 2 uppercase letters + 4 digits (e.g., AB1234)
- Automatically tracked on registration
- Commission calculated on investment profits

### Currency Formatting
- All amounts displayed in Pakistani Rupee (PKR)
- Custom formatting utility in `lib/currency.js`
- Format: Rs 1,234.56 or PKR 1,234.56

## Production Deployment (Vercel)

### Required Environment Variables

Add these in **Vercel Project Settings → Environment Variables**:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-secure-random-secret
```

### Deployment Steps

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (all 4 required)
4. Deploy

**Note:** Vercel will automatically build and deploy on every push to main branch.

## 🔒 Security Features

- ✅ **Password Hashing**: bcryptjs with salt rounds
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Protected Routes**: Middleware for auth verification
- ✅ **Admin Authorization**: Separate admin access control
- ✅ **Account Blocking**: Prevent blocked users from logging in
- ✅ **Secure Referrals**: Validated referral code system
- ✅ **Input Validation**: Server-side validation for all inputs
- ✅ **SQL Injection Prevention**: Supabase parameterized queries

## 🚀 Performance Optimizations

- ⚡ Next.js 14 App Router for optimal performance
- 📦 Code splitting and lazy loading
- 🖼️ Optimized image handling
- 💾 Efficient data fetching with minimal re-renders
- 🎯 Tailwind CSS for minimal CSS bundle size
- 📱 Mobile-first responsive design

## 📝 Recent Updates

### Responsive Design Overhaul (Latest)
- ✅ Fully responsive user and admin dashboards
- ✅ Mobile-optimized sidebar with hamburger menu
- ✅ Touch-friendly buttons and form inputs
- ✅ Responsive tables with horizontal scroll
- ✅ Adaptive typography and spacing
- ✅ Improved StatCard component for mobile
- ✅ Enhanced authentication pages
- ✅ Updated landing page design
- ✅ Comprehensive README documentation

## 🛠️ Troubleshooting

### Common Issues

**Issue**: "Invalid JWT token" error
- **Solution**: Clear localStorage and login again. Ensure `JWT_SECRET` is set in environment variables.

**Issue**: Admin pages redirect to login
- **Solution**: Verify user has `isAdmin: true` in Supabase database.

**Issue**: Deposits not showing
- **Solution**: Check Supabase connection and verify API routes are working.

**Issue**: Mobile menu not opening
- **Solution**: Ensure JavaScript is enabled and check browser console for errors.

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)

## 🤝 Contributing

This is a private project. For feature requests or bug reports, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 📧 Support

For technical support or questions about this platform, please refer to the comprehensive documentation above or contact your system administrator.

---

**Built with ❤️ using Next.js 14 and Tailwind CSS**
