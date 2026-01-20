'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import toast from 'react-hot-toast'

export default function AdminReportsPage() {
  const [logs, setLogs] = useState([])

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/logs', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs)
      }
    } catch (error) {
      toast.error('Failed to load logs')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports & Logs</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">View system logs and admin activities</p>
      </div>

      <Card>
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Admin Activity Logs</h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin ID</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="hidden md:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="hidden lg:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                  <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 font-mono truncate max-w-[120px]">{log.adminId}</td>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-semibold text-gray-800">{log.action}</span>
                          <span className="md:hidden text-xs text-gray-500 mt-1">{log.description || 'N/A'}</span>
                          <span className="sm:hidden text-xs text-gray-500 mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">{log.description || 'N/A'}</td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 font-mono">{log.ipAddress || 'N/A'}</td>
                      <td className="hidden sm:table-cell px-3 sm:px-6 py-4 text-xs sm:text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-3 sm:px-6 py-8 text-center text-gray-500 text-sm">
                      No logs available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
