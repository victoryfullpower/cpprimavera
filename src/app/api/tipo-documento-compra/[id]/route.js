import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tipoDocumento = await db.tipo_documento_compra.findUnique({
      where: {
        idtipodocumento: parseInt(params.id)
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

    if (!tipoDocumento) {
      return NextResponse.json(
        { error: "Tipo de documento no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(tipoDocumento)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener tipo de documento: " + error.message },
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

    const tipoDocumentoActualizado = await db.tipo_documento_compra.update({
      where: {
        idtipodocumento: parseInt(params.id)
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

    return NextResponse.json(tipoDocumentoActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar tipo de documento: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.tipo_documento_compra.delete({
      where: {
        idtipodocumento: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar tipo de documento: " + error.message },
      { status: 500 }
    )
  }
}


