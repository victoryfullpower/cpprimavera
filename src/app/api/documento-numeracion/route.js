// app/api/documento-numeracion/route.js
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
    const forRecibo = searchParams.get('forRecibo') === 'true'

    // Si es para el recibo, devolver solo el específico
    if (forRecibo) {
      const numeracion = await db.documento_numeracion.findFirst({
        where: {
          descripcion: 'recibo ingreso',
          estado: true
        },
        select: {
          numeroactual: true,
          apartir_de_numeracion: true
        }
      })

      if (!numeracion) {
        return NextResponse.json(
          { error: "No se encontró la numeración para recibos" },
          { status: 404 }
        )
      }

      return NextResponse.json({
        ...numeracion,
        proximoNumero: numeracion.numeroactual === 0
          ? numeracion.apartir_de_numeracion
          : numeracion.numeroactual + 1
      })
    }

    // Mantener el CRUD existente
    const documentos = await db.documento_numeracion.findMany({
      include: {
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      },
      orderBy: { iddocumento_numeracion: 'asc' }
    })

    // Si se filtra por descripción
    if (descripcion) {
      const documento = documentos.find(doc => doc.descripcion === descripcion)
      return NextResponse.json(documento || null)
    }

    return NextResponse.json(documentos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener documentos: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { descripcion, numeroactual, apartir_de_numeracion, estado } = await request.json()

    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const nuevoDocumento = await db.documento_numeracion.create({
      data: {
        descripcion,
        numeroactual: numeroactual || 1,
        apartir_de_numeracion: apartir_de_numeracion || 1,
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

    return NextResponse.json(nuevoDocumento, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear documento: " + error.message },
      { status: 500 }
    )
  }
}