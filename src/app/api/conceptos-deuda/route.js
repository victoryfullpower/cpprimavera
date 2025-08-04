import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const conceptos = await db.concepto_deuda.findMany({
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
      orderBy: { idconcepto: 'asc' }
    })
    return NextResponse.json(conceptos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener conceptos: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descripcion, estado, deuda } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const nuevoConcepto = await db.concepto_deuda.create({
      data: {
        descripcion,
        estado: estado || false,
        deuda: deuda || false, // Nuevo campo con valor por defecto
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
    console.error('Error detallado:', error)
    return NextResponse.json(
      { error: "Error al crear concepto: " + error.message },
      { status: 500 }
    )
  }
}