import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const concepto = await db.concepto_deuda.findUnique({
      where: {
        idconcepto: parseInt(params.id)
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

    if (!concepto) {
      return NextResponse.json(
        { error: "Concepto no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(concepto)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener concepto: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descripcion, estado, deuda } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const conceptoActualizado = await db.concepto_deuda.update({
      where: {
        idconcepto: parseInt(params.id)
      },
      data: {
        descripcion,
        estado,
        deuda, // Nuevo campo
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

    return NextResponse.json(conceptoActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar concepto: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.concepto_deuda.delete({
      where: {
        idconcepto: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar concepto: " + error.message },
      { status: 500 }
    )
  }
}