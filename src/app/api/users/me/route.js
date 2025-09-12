import { NextResponse } from 'next/server'
import { getSession } from '@/libs/auth'

export async function GET() {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      username: session.user.name,
      role: session.user.role
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
