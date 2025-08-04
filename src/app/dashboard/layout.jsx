// app/layout.jsx
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { getSession } from '@/libs/auth'
import { SessionProvider } from '@/context/SessionContext'

import SidebarWrapper from '@/components/SidebarWrapper'
import UserDropdown from '@/components/UserDropdown'

export default async function Layout({ children }) {
  const session = await getSession()
  
  return (
    <SessionProvider session={session}>
      <div className='flex h-screen bg-black overflow-hidden'>
        <SidebarWrapper />
        
        <div className="flex-1 flex flex-col">
          <header className="bg-gray-900 p-4 flex justify-end items-center border-b border-gray-800">
            <UserDropdown user={session?.user} />
          </header>
          
          <main className="flex-1 p-6 overflow-y-auto">
            {children}
            <ToastContainer position="bottom-right" />
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}