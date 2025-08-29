import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const registro = await db.registro_compra.findUnique({
      where: {
        idcompra: parseInt(params.id)
      },
      include: {
        tipoCompra: { select: { descripcion: true } },
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

    if (!registro) {
      return NextResponse.json(
        { error: "Registro de compra no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(registro)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener registro de compra: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { 
      idtipocompra, 
      fecharegistro, 
      numcomprobante, 
      descripcion, 
      monto, 
      observaciones, 
      estado 
    } = await request.json()
    
    if (!idtipocompra || !fecharegistro || !numcomprobante || !descripcion || !monto) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos excepto observaciones" },
        { status: 400 }
      )
    }

    const registroActualizado = await db.registro_compra.update({
      where: {
        idcompra: parseInt(params.id)
      },
      data: {
        idtipocompra: parseInt(idtipocompra),
        fecharegistro: new Date(fecharegistro),
        numcomprobante,
        descripcion,
        monto: parseFloat(monto),
        observaciones: observaciones || '',
        estado,
        updatedby: session.user.id,
        updatedAt: getPeruTime()
      },
      include: {
        tipoCompra: { select: { descripcion: true } },
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

    return NextResponse.json(registroActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar registro de compra: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await db.registro_compra.delete({
      where: {
        idcompra: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar registro de compra: " + error.message },
      { status: 500 }
    )
  }
}


