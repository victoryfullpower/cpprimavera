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

    // Obtener todas las compras hasta la fecha de corte
    const compras = await db.registro_compra.findMany({
      where: {
        fecharegistro: {
          lte: fechaCorteObj
        },
        estado: true
      },
      include: {
        tipoCompra: true,
        createdBy: true
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

    // Transformar compras para incluir detalles expandidos
    const comprasTransformadas = compras.map(compra => ({
      ...compra,
      detalles: [{
        idregistro_compra_detalle: compra.idcompra,
        concepto: { descripcion: compra.tipoCompra?.descripcion || 'Sin tipo' },
        descripcion: compra.descripcion || 'Sin descripción',
        monto: compra.monto,
        createdBy: compra.createdBy
      }]
    }))

    // Calcular totales
    const totalIngresos = ingresosTransformados.reduce((sum, ingreso) => sum + Number(ingreso.total), 0)
    const totalEgresos = egresosTransformados.reduce((sum, egreso) => sum + Number(egreso.total), 0)
    const totalCompras = comprasTransformadas.reduce((sum, compra) => sum + Number(compra.monto), 0)
    const totalEgresosConCompras = totalEgresos + totalCompras
    const saldo = totalIngresos - totalEgresosConCompras

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
      totalCompras,
      totalEgresosConCompras,
      saldo,
      ingresosPorMetodo: Object.entries(ingresosPorMetodo).map(([metodo, monto]) => ({ metodo, monto })),
      detalleIngresos: ingresosTransformados,
      detalleEgresos: egresosTransformados,
      detalleCompras: comprasTransformadas
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al generar reporte de arqueo: " + error.message },
      { status: 500 }
    )
  }
}