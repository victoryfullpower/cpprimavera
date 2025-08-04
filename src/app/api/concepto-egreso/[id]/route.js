import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const concepto = await db.concepto_egreso.findUnique({
      where: {
        idconcepto_egreso: parseInt(params.id)
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
        { error: "Concepto de egreso no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(concepto)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener concepto de egreso: " + error.message },
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

    const conceptoActualizado = await db.concepto_egreso.update({
      where: {
        idconcepto_egreso: parseInt(params.id)
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

    return NextResponse.json(conceptoActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar concepto de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.concepto_egreso.delete({
      where: {
        idconcepto_egreso: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar concepto de egreso: " + error.message },
      { status: 500 }
    )
  }
}