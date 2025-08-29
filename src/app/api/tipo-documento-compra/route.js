// app/api/tipo-documento-compra/route.js
import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const descripcion = searchParams.get('descripcion')

    // Mantener el CRUD existente
    const tiposDocumento = await db.tipo_documento_compra.findMany({
      include: {
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      },
      orderBy: { idtipodocumento: 'asc' }
    })

    // Si se filtra por descripción
    if (descripcion) {
      const tipoDocumento = tiposDocumento.find(tipo => tipo.descripcion === descripcion)
      return NextResponse.json(tipoDocumento || null)
    }

    return NextResponse.json(tiposDocumento)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener tipos de documento: " + error.message },
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

    const nuevoTipoDocumento = await db.tipo_documento_compra.create({
      data: {
        descripcion,
        estado: estado !== undefined ? estado : true,
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

    return NextResponse.json(nuevoTipoDocumento, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear tipo de documento: " + error.message },
      { status: 500 }
    )
  }
}


