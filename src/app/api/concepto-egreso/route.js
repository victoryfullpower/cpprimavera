import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conceptos = await db.concepto_egreso.findMany({
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
      },
      orderBy: { idconcepto_egreso: 'asc' }
    })

    return NextResponse.json(conceptos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener conceptos de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descripcion, estado } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const nuevoConcepto = await db.concepto_egreso.create({
      data: {
        descripcion,
        estado: estado || false,
        createdby: session.user.id,
        updatedby: session.user.id,
         updatedAt: getPeruTime(),
         createdAt: getPeruTime(),
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

    return NextResponse.json(nuevoConcepto, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear concepto de egreso: " + error.message },
      { status: 500 }
    )
  }
}