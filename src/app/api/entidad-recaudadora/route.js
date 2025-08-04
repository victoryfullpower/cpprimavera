import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const entidades = await db.entidad_recaudadora.findMany({
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
      orderBy: { identidad_recaudadora: 'asc' }
    })

    return NextResponse.json(entidades)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener entidades recaudadoras: " + error.message },
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

    const nuevaEntidad = await db.entidad_recaudadora.create({
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

    return NextResponse.json(nuevaEntidad, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear entidad recaudadora: " + error.message },
      { status: 500 }
    )
  }
}