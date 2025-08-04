import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const metodo = await db.metodo_pago.findUnique({
      where: {
        idmetodo_pago: parseInt(params.id)
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

    if (!metodo) {
      return NextResponse.json(
        { error: "Método de pago no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(metodo)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener método de pago: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
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

    const metodoActualizado = await db.metodo_pago.update({
      where: {
        idmetodo_pago: parseInt(params.id)
      },
      data: {
        descripcion,
        estado,
        updatedby: session.user.id,
        updatedAt: getPeruTime()
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

    return NextResponse.json(metodoActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar método de pago: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.metodo_pago.delete({
      where: {
        idmetodo_pago: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar método de pago: " + error.message },
      { status: 500 }
    )
  }
}