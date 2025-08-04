// app/api/reportes/recibos-ingreso/route.js
import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function POST(req) {
  const { fechaInicio, fechaFin, page = 1, pageSize = 10, idConcepto, idMetodoPago } = await req.json()
  
  try {
    const where = {
      fecharecibo: {
        gte: new Date(`${fechaInicio}T00:00:00`),
        lte: new Date(`${fechaFin}T23:59:59.999`)
      },
      estado: true
    }
    
    // Aplicar filtros si existen
    if (idConcepto) {
      where.detalles = {
        some: {
          idconcepto: idConcepto
        }
      }
    }
    
    if (idMetodoPago) {
      where.idmetodo_pago = idMetodoPago
    }
    
    const [recibos, total] = await db.$transaction([
      db.recibo_ingreso.findMany({
        where,
        include: {
          detalles: {
            include: {
              concepto: true,
              detalleDeuda: {
                include: {
                  cabecera: {
                    include: {
                      concepto: true
                    }
                  }
                }
              }
            }
          },
          stand: {
            include: {
              client: true
            }
          },
          metodoPago: true
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          fecharecibo: 'desc'
        }
      }),
      db.recibo_ingreso.count({ where })
    ])
    
    return NextResponse.json({
      data: recibos,
      totalPages: Math.ceil(total / pageSize)
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}