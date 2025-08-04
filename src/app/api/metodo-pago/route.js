import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const metodos = await db.metodo_pago.findMany({
    
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
        
      },
      orderBy: { idmetodo_pago: 'asc' }
    })

    return NextResponse.json(metodos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener métodos de pago: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descripcion, estado } = await request.json()

    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const nuevoMetodo = await db.metodo_pago.create({
      data: {
        descripcion,
        estado: estado || false,
        createdby: session.user.id,
        updatedby: session.user.id,
        updatedAt: getPeruTime(),
        createdAt: getPeruTime(),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json(nuevoMetodo, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear método de pago: " + error.message },
      { status: 500 }
    )
  }
}