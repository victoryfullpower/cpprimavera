import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar que el parámetro id existe
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID de detalle no proporcionado" },
        { status: 400 }
      )
    }

    // Convertir el id a número
    const detalleId = parseInt(params.id)
    if (isNaN(detalleId)) {
      return NextResponse.json(
        { error: "ID de detalle no válido" },
        { status: 400 }
      )
    }

    const detalle = await db.reg_deuda_detalle.findUnique({
      where: {
        idregdeuda_detalle: detalleId
      },
      include: {
        concepto: true,
        stand: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            username: true
          }
        },
        updatedBy: {
          select: {
            username: true
          }
        },
        detallesReciboIngreso: {
          select: {
            monto: true
          }
        }
      }
    })

    if (!detalle) {
      return NextResponse.json(
        { error: "Detalle de deuda no encontrado" },
        { status: 404 }
      )
    }

    // Transformar para asegurar tipos correctos
    const totalPagado = detalle.detallesReciboIngreso.reduce(
      (sum, det) => sum + parseFloat(det.monto.toString()),
      0
    );
    
    const montoTotal = parseFloat(detalle.monto.toString());
    const saldoPendiente = montoTotal - totalPagado;
    
    const detalleTransformado = {
      ...detalle,
      monto: montoTotal,
      mora: detalle.mora ? parseFloat(detalle.mora.toString()) : 0,
      totalPagado,
      saldoPendiente: Math.max(0, saldoPendiente) // Asegurar que no sea negativo
    }

    return NextResponse.json(detalleTransformado)

  } catch (error) {
    console.error("Error en GET /api/reg-deuda-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error al obtener detalle de deuda: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar que el parámetro id existe
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID de detalle no proporcionado" },
        { status: 400 }
      )
    }

    const detalleId = parseInt(params.id)
    if (isNaN(detalleId)) {
      return NextResponse.json(
        { error: "ID de detalle no válido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      idconcepto_deuda,
      idstand,
      fechadeudaStand,
      monto,
      mora = 0,
      estado = true,
      lote = false
    } = body

    // Validaciones
    if (!idconcepto_deuda || !idstand || !fechadeudaStand || !monto) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben estar presentes" },
        { status: 400 }
      )
    }

    // Actualizar el detalle
    const detalleActualizado = await db.reg_deuda_detalle.update({
      where: {
        idregdeuda_detalle: detalleId
      },
      data: {
        idconcepto_deuda: parseInt(idconcepto_deuda),
        idstand: parseInt(idstand),
        fechadeudaStand: new Date(fechadeudaStand),
        monto: parseFloat(monto),
        mora: parseFloat(mora),
        estado: Boolean(estado),
        lote: Boolean(lote),
        updatedby: session.user.id
      },
      include: {
        concepto: true,
        stand: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            username: true
          }
        },
        updatedBy: {
          select: {
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      ...detalleActualizado,
      monto: parseFloat(detalleActualizado.monto.toString()),
      mora: detalleActualizado.mora ? parseFloat(detalleActualizado.mora.toString()) : 0
    })

  } catch (error) {
    console.error("Error en PUT /api/reg-deuda-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error al actualizar detalle de deuda: " + error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar que el parámetro id existe
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID de detalle no proporcionado" },
        { status: 400 }
      )
    }

    const detalleId = parseInt(params.id)
    if (isNaN(detalleId)) {
      return NextResponse.json(
        { error: "ID de detalle no válido" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { estado } = body

    if (typeof estado !== 'boolean') {
      return NextResponse.json(
        { error: "El campo estado debe ser un booleano" },
        { status: 400 }
      )
    }

    // Actualizar solo el estado
    const detalleActualizado = await db.reg_deuda_detalle.update({
      where: {
        idregdeuda_detalle: detalleId
      },
      data: {
        estado,
        updatedby: session.user.id
      },
      include: {
        concepto: true,
        stand: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            username: true
          }
        },
        updatedBy: {
          select: {
            username: true
          }
        }
      }
    })

    return NextResponse.json({
      ...detalleActualizado,
      monto: parseFloat(detalleActualizado.monto.toString()),
      mora: detalleActualizado.mora ? parseFloat(detalleActualizado.mora.toString()) : 0
    })

  } catch (error) {
    console.error("Error en PATCH /api/reg-deuda-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error al actualizar estado del detalle: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar que el usuario sea SUPERADMIN
    if (session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: "Solo los super administradores pueden eliminar detalles de deuda" },
        { status: 403 }
      )
    }

    // Verificar que el parámetro id existe
    if (!params?.id) {
      return NextResponse.json(
        { error: "ID de detalle no proporcionado" },
        { status: 400 }
      )
    }

    const detalleId = parseInt(params.id)
    if (isNaN(detalleId)) {
      return NextResponse.json(
        { error: "ID de detalle no válido" },
        { status: 400 }
      )
    }

    // Verificar si el detalle existe
    const detalleExistente = await db.reg_deuda_detalle.findUnique({
      where: {
        idregdeuda_detalle: detalleId
      }
    })

    if (!detalleExistente) {
      return NextResponse.json(
        { error: "Detalle de deuda no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si tiene registros relacionados
    const tieneRelaciones = await db.recibo_ingreso_detalle.count({
      where: {
        idregdeuda_detalle: detalleId
      }
    })

    if (tieneRelaciones > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el detalle porque tiene recibos de ingreso asociados" },
        { status: 400 }
      )
    }

    // Eliminar el detalle
    await db.reg_deuda_detalle.delete({
      where: {
        idregdeuda_detalle: detalleId
      }
    })

    return NextResponse.json({ message: "Detalle de deuda eliminado correctamente" })

  } catch (error) {
    console.error("Error en DELETE /api/reg-deuda-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error al eliminar detalle de deuda: " + error.message },
      { status: 500 }
    )
  }
}