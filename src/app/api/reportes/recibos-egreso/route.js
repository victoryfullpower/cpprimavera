import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function POST(request) {
  try {
    const { fechaInicio, fechaFin, page = 1, pageSize = 10 } = await request.json()

    const skip = (page - 1) * pageSize
    const take = parseInt(pageSize)

    // Ajustar las fechas para incluir todo el día
    const fechaInicioObj = new Date(`${fechaInicio}T00:00:00`)
    const fechaFinObj = new Date(`${fechaFin}T23:59:59.999`)
    
    const whereClause = {
      fecharecibo_egreso: {
        gte: fechaInicioObj,
        lte: fechaFinObj
      }
    }

    const [recibos, total] = await Promise.all([
      db.recibo_egreso.findMany({
        where: whereClause,
        include: {
          detalles: {
            include: {
              concepto: true
            }
          },
          createdBy: {
            select: {
              username: true
            }
          }
        },
        orderBy: { fecharecibo_egreso: 'desc' },
        skip,
        take
      }),
      db.recibo_egreso.count({ where: whereClause })
    ])

    return NextResponse.json({
      data: recibos,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al generar reporte: " + error.message },
      { status: 500 }
    )
  }
}