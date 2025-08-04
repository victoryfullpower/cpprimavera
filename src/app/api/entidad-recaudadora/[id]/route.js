import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const entidad = await db.entidad_recaudadora.findUnique({
      where: {
        identidad_recaudadora: parseInt(params.id)
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

    if (!entidad) {
      return NextResponse.json(
        { error: "Entidad recaudadora no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(entidad)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener entidad recaudadora: " + error.message },
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

    const entidadActualizada = await db.entidad_recaudadora.update({
      where: {
        identidad_recaudadora: parseInt(params.id)
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

    return NextResponse.json(entidadActualizada)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar entidad recaudadora: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.entidad_recaudadora.delete({
      where: {
        identidad_recaudadora: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar entidad recaudadora: " + error.message },
      { status: 500 }
    )
  }
}