import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata = {
  title: 'Investment Platform',
  description: 'Professional investment management platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
