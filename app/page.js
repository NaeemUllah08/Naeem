import Link from 'next/link'
import {
  FiUsers,
  FiMail,
  FiTrendingUp,
  FiShoppingBag,
  FiDollarSign,
  FiAward,
  FiShield,
  FiTarget
} from 'react-icons/fi'

export default function Home() {
  const earningMethods = [
    {
      icon: <FiUsers className="w-8 h-8" />,
      title: "Referral Earnings",
      description: "Earn commissions by inviting friends and family to join our platform. Get rewarded for every successful referral.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <FiMail className="w-8 h-8" />,
      title: "Gmail Earnings",
      description: "Submit your Gmail for verified opportunities and earn money through our email partnership program.",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <FiTrendingUp className="w-8 h-8" />,
      title: "Airdrop Rewards",
      description: "Participate in exclusive airdrops and token distributions. Access multiple earning opportunities daily.",
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: <FiShoppingBag className="w-8 h-8" />,
      title: "Product Sales",
      description: "Sell products through our marketplace and earn profits. Easy listing and secure transactions guaranteed.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <FiDollarSign className="w-8 h-8" />,
      title: "Business Investment",
      description: "Invest in verified business opportunities and earn steady returns. Multiple investment plans available.",
      color: "from-indigo-500 to-indigo-600"
    }
  ]

  const features = [
    {
      icon: <FiShield className="w-6 h-6" />,
      title: "Secure Platform",
      description: "Bank-level security with encrypted transactions"
    },
    {
      icon: <FiTarget className="w-6 h-6" />,
      title: "Reliable Returns",
      description: "Consistent earnings with transparent tracking"
    },
    {
      icon: <FiAward className="w-6 h-6" />,
      title: "Trusted by Thousands",
      description: "Join our growing community of successful investors"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      {/* Header with Login/Register Buttons */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FiDollarSign className="w-8 h-8 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">Investment Platform</h1>
          </div>

          <div className="flex space-x-2 sm:space-x-4">
            <Link
              href="/login"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2 px-4 sm:px-6 rounded-lg transition duration-200 border border-white/30"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-white hover:bg-gray-100 text-blue-600 font-semibold py-2 px-4 sm:px-6 rounded-lg transition duration-200 shadow-lg"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">

          {/* Hero Section */}
          <section className="text-center mb-16 animate-fadeIn">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
              Start Your Investment Journey
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              Grow your wealth with multiple earning opportunities. Secure, reliable, and profitable investment platform trusted by thousands.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              <Link
                href="/register"
                className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-xl transition duration-200 shadow-2xl text-lg"
              >
                Get Started Now
              </Link>
              <Link
                href="/login"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-4 px-8 rounded-xl transition duration-200 border-2 border-white/50 text-lg"
              >
                Existing User? Login
              </Link>
            </div>
          </section>

          {/* Earning Methods Section */}
          <section className="mb-16">
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-semibold border border-white/30">
                  MULTIPLE INCOME STREAMS
                </span>
              </div>
              <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                5 Ways to Earn Money
              </h3>
              <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
                Multiple income streams designed to maximize your profits
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {earningMethods.map((method, index) => (
                <Link
                  key={index}
                  href="/register"
                  className="group relative bg-white rounded-3xl shadow-2xl p-8 hover:shadow-blue-500/30 overflow-hidden transform hover:-translate-y-2 transition-all duration-500 animate-slideUp border border-gray-100 block cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Gradient Background on Hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                  {/* Decorative Corner Element */}
                  <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${method.color} rounded-full opacity-10 group-hover:opacity-20 transition-opacity duration-500`}></div>

                  {/* Icon Container with Gradient Border */}
                  <div className="relative mb-6">
                    <div className={`absolute inset-0 bg-gradient-to-br ${method.color} rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                    <div className={`relative bg-gradient-to-br ${method.color} w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                      {method.icon}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
                      {method.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {method.description}
                    </p>

                    {/* Animated Arrow */}
                    <div className="flex items-center text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Learn More</span>
                      <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom Border Accent */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${method.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left`}></div>
                </Link>
              ))}

              {/* Call to Action Card - Enhanced */}
              <div className="group relative bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-3xl shadow-2xl p-8 overflow-hidden transform hover:-translate-y-2 hover:shadow-orange-500/50 transition-all duration-500 animate-slideUp flex flex-col justify-center items-center text-center">
                {/* Animated Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
                  <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>

                {/* Glowing Effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  {/* Icon with Animation */}
                  <div className="relative mb-4">
                    <div className="absolute inset-0 bg-white rounded-full blur-xl opacity-40 animate-pulse"></div>
                    <FiAward className="relative w-20 h-20 text-white transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                  </div>

                  <h4 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                    Ready to Start Earning?
                  </h4>
                  <p className="text-white/95 mb-6 text-lg">
                    Join thousands of successful investors and start your journey today!
                  </p>
                  <Link
                    href="/register"
                    className="inline-block bg-white hover:bg-gray-50 text-orange-600 font-bold py-4 px-8 rounded-xl transition-all duration-300 shadow-2xl transform hover:scale-105 hover:shadow-white/50"
                  >
                    Create Free Account
                    <span className="ml-2 inline-block transform group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="mb-16">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 sm:p-12 border border-white/20">
              <h3 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
                Why Choose Us?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-xl flex items-center justify-center text-white mx-auto mb-4 border border-white/30">
                      {feature.icon}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-white/80">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { number: "10,000+", label: "Active Users" },
                { number: "Rs. 50M+", label: "Total Earnings" },
                { number: "5", label: "Earning Methods" },
                { number: "99.9%", label: "Uptime" }
              ].map((stat, index) => (
                <div key={index} className="bg-white/20 backdrop-blur-md rounded-xl p-6 text-center border border-white/30">
                  <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                    {stat.number}
                  </div>
                  <div className="text-white/80 text-sm sm:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA Section */}
          <section className="text-center">
            <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-12">
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
                Start Earning Today
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join our platform now and unlock multiple income streams. It's free to get started and you can begin earning immediately!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition duration-200 shadow-lg text-lg"
                >
                  Create Your Account
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold py-4 px-8 rounded-xl transition duration-200 text-lg"
                >
                  Already Have Account?
                </Link>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white/80">
            Secure • Reliable • Profitable
          </p>
          <p className="text-white/60 text-sm mt-2">
            © 2026 Investment Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
