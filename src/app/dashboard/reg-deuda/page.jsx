// app/reg-deuda/page.jsx
import { getSession } from '@/libs/auth'
import RegDeudaPage from '@/components/RegDeudaPage'

export default async function Page() {
        const session = await getSession()

  
  return <RegDeudaPage userRole={session?.user?.role} />
}