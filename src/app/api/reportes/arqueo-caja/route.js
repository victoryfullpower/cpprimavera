import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function POST(request) {
  try {
    const { fechaCorte } = await request.json()
    
    // Ajustar la fecha para incluir todo el día
    const fechaCorteObj = new Date(`${fechaCorte}T23:59:59.999`)

    // Obtener todos los ingresos hasta la fecha de corte
    const ingresos = await db.recibo_ingreso.findMany({
      where: {
        fecharecibo: {
          lte: fechaCorteObj
        },
        estado: true
      },
      include: {
        detalles: {
          include: {
            concepto: true,
            detalleDeuda: {
              include: {
                stand: {
                  include: {
                    client: true
                  }
                }
              }
            }
          }
        },
        metodoPago: true,
        stand: {
          include: {
            client: true
          }
        }
      }
    })

    // Transformar ingresos para incluir detalles expandidos
    const ingresosTransformados = ingresos.map(ingreso => ({
      ...ingreso,
      detalles: ingreso.detalles.map(detalle => ({
        ...detalle,
        concepto: detalle.concepto,
        descripcion: detalle.descripcion || detalle.concepto?.descripcion || 'Sin descripción',
        clienteStand: detalle.detalleDeuda?.stand?.client?.nombre || ingreso.stand?.client?.nombre || 'Sin cliente',
        stand: detalle.detalleDeuda?.stand?.descripcion || ingreso.stand?.descripcion || 'Sin stand'
      }))
    }))

    // Obtener todos los egresos hasta la fecha de corte
    const egresos = await db.recibo_egreso.findMany({
      where: {
        fecharecibo_egreso: {
          lte: fechaCorteObj
        },
        estado: true
      },
      include: {
        detalles: {
          include: {
            concepto: true
          }
        }
      }
    })

    // Transformar egresos para incluir detalles expandidos
    const egresosTransformados = egresos.map(egreso => ({
      ...egreso,
      detalles: egreso.detalles.map(detalle => ({
        ...detalle,
        concepto: detalle.concepto,
        descripcion: detalle.descripcion || detalle.concepto?.descripcion || 'Sin descripción'
      }))
    }))

    // Calcular totales
    const totalIngresos = ingresosTransformados.reduce((sum, ingreso) => sum + Number(ingreso.total), 0)
    const totalEgresos = egresosTransformados.reduce((sum, egreso) => sum + Number(egreso.total), 0)
    const saldo = totalIngresos - totalEgresos

    // Agrupar por método de pago
    const ingresosPorMetodo = ingresosTransformados.reduce((acc, ingreso) => {
      const metodo = ingreso.metodoPago.descripcion
      if (!acc[metodo]) {
        acc[metodo] = 0
      }
      acc[metodo] += Number(ingreso.total)
      return acc
    }, {})

    return NextResponse.json({
      fechaCorte: fechaCorte,
      totalIngresos,
      totalEgresos,
      saldo,
      ingresosPorMetodo: Object.entries(ingresosPorMetodo).map(([metodo, monto]) => ({ metodo, monto })),
      detalleIngresos: ingresosTransformados,
      detalleEgresos: egresosTransformados
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al generar reporte de arqueo: " + error.message },
      { status: 500 }
    )
  }
}