// app/api/reportes/ingresos-conceptos/route.js
import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function GET() {
  try {
    const recibos = await db.recibo_ingreso.findMany({
      include: {
        detalles: {
          include: {
            concepto: true,
            detalleDeuda: {
              include: {
                concepto: true,
                stand: {
                  include: {
                    client: true
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
        metodoPago: true,
        createdBy: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        fecharecibo: 'desc'
      }
    })

    return NextResponse.json(recibos)
  } catch (error) {
    console.error('Error fetching recibos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




