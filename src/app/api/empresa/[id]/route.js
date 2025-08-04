import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empresa = await db.empresa.findUnique({
      where: {
        idempresa: parseInt(params.id)
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

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(empresa)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener empresa: " + error.message },
      { status: 500 }
    )
  }
}
export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      nombre_empresa,
      ruc,
      nombre_comercial,
      direccion,
      telefono,
      celular,
      correo,
      estado
    } = await request.json()
    
    if (!nombre_empresa || !ruc) {
      return NextResponse.json(
        { error: "Nombre de empresa y RUC son requeridos" },
        { status: 400 }
      )
    }

    const empresaActualizada = await db.empresa.update({
      where: {
        idempresa: parseInt(params.id)
      },
      data: {
        nombre_empresa,
        ruc,
        nombre_comercial,
        direccion,
        telefono,
        celular,
        correo,
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

    return NextResponse.json(empresaActualizada)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar empresa: " + error.message },
      { status: 500 }
    )
  }
}
export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.empresa.delete({
      where: {
        idempresa: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar empresa: " + error.message },
      { status: 500 }
    )
  }
}