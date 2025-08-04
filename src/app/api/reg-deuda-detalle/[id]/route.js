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
        { error: "ID de deuda no proporcionado" },
        { status: 400 }
      )
    }

    // Convertir el id a número
    const deudaId = parseInt(params.id)
    if (isNaN(deudaId)) {
      return NextResponse.json(
        { error: "ID de deuda no válido" },
        { status: 400 }
      )
    }

    const deudaDetalle = await db.reg_deuda_detalle.findUnique({
      where: {
        idregdeuda_detalle: deudaId
      },
      include: {
        cabecera: {
          include: {
            concepto: true
          }
        },
        stand: {
          include: {
            client: true
          }
        }
      }
    })

    if (!deudaDetalle) {
      return NextResponse.json(
        { error: "Detalle de deuda no encontrado" },
        { status: 404 }
      )
    }

    // Transformar para asegurar tipos correctos
    const deudaTransformada = {
      ...deudaDetalle,
      monto: parseFloat(deudaDetalle.monto.toString()),
      cabecera: deudaDetalle.cabecera ? {
        ...deudaDetalle.cabecera,
        concepto: deudaDetalle.cabecera.concepto || null
      } : null,
      stand: deudaDetalle.stand ? {
        ...deudaDetalle.stand,
        client: deudaDetalle.stand.client || null
      } : null
    }

    return NextResponse.json(deudaTransformada)

  } catch (error) {
    console.error("Error en GET /api/reg-deuda-detalle/[id]:", error)
    return NextResponse.json(
      { error: "Error al obtener detalle de deuda: " + error.message },
      { status: 500 }
    )
  }
}