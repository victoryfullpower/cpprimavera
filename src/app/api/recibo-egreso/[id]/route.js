import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const recibo = await db.recibo_egreso.findUnique({
      where: {
        idrecibo_egreso: parseInt(params.id)
      },
      include: {
        detalles: {
          include: {
            concepto: true
          }
        },
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

    if (!recibo) {
      return NextResponse.json(
        { error: "Recibo de egreso no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(recibo)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener recibo de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { detalles } = await request.json();
    
    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: "Debe agregar al menos un detalle" },
        { status: 400 }
      )
    }

    // Calcular el total
    const total = detalles.reduce((sum, detalle) => {
      return sum + (parseFloat(detalle.monto) || 0);
    }, 0);

    // Primero eliminamos los detalles existentes
    await db.recibo_egreso_detalle.deleteMany({
      where: { cabecera_re: parseInt(params.id) }
    })

    // Luego actualizamos el recibo y creamos los nuevos detalles
    const reciboActualizado = await db.recibo_egreso.update({
      where: {
        idrecibo_egreso: parseInt(params.id)
      },
      data: {
        total: total,
        createdby: session.user.id, // Usar el campo directo
        updatedby: session.user.id, // Usar el campo directo
        updatedAt: getPeruTime(),
        detalles: {
          create: detalles.map(detalle => ({
            idconcepto_egreso: parseInt(detalle.idconcepto_egreso),
            monto: parseFloat(detalle.monto),
            descripcion: detalle.descripcion || '',
            
          }))
        }
      },
      include: {
        detalles: {
          include: {
            concepto: true
          }
        },
        createdBy: true,
        updatedBy: true
      }
    })

    return NextResponse.json(reciboActualizado)
  } catch (error) {
    console.error('Error completo:', error)
    return NextResponse.json(
      { error: "Error al actualizar recibo de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Primero eliminamos los detalles
    await db.recibo_egreso_detalle.deleteMany({
      where: { cabecera_re: parseInt(params.id) }
    })

    // Luego eliminamos el recibo
    await db.recibo_egreso.delete({
      where: {
        idrecibo_egreso: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar recibo de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { estado } = await request.json()

    const reciboActualizado = await db.recibo_egreso.update({
      where: { idrecibo_egreso: parseInt(params.id) },
      data: {
        estado,
        updatedby: session.user.id
      }
    })

    return NextResponse.json(reciboActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al cambiar estado: " + error.message },
      { status: 500 }
    )
  }
}