import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { getServerSession } from "next-auth/next"
import db from '@/libs/db'

export async function getSession() {
  const session = await getServerSession(authOptions)
  if (session) {
    // Asegúrate de que el ID está incluido en el objeto user
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        role: true
       }
    })
    session.user.id = user.id
    session.user.role = user.role
  }
  return session
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}