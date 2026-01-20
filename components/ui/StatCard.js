export default function StatCard({ icon: Icon, label, value, bgColor = 'bg-blue-500', iconColor = 'text-blue-500' }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
      <div className={`${bgColor} bg-opacity-10 p-3 sm:p-4 rounded-lg flex-shrink-0`}>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-600 text-xs sm:text-sm font-medium">{label}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-0.5 sm:mt-1 truncate">{value}</p>
      </div>
    </div>
  )
}
