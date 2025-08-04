// app/components/SidebarWrapper.js
import Sidebar from "./Sidebar"
import { getSession } from '@/libs/auth'

export default async function SidebarWrapper() {
      const session = await getSession()
  return <Sidebar userRole={session?.user?.role} />
}