import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'BPJS Ketenagakerjaan – Dashboard Monitoring Binaan',
  description: 'Sistem monitoring perusahaan binaan BPJS Ketenagakerjaan',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'custom-toast',
            duration: 3500,
            style: {
              background: '#1a2540',
              color: '#f1f5f9',
              border: '1px solid rgba(148,163,184,0.1)',
              fontSize: '13px',
              borderRadius: '10px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
