import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const empresas = await db.empresa.findMany({
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
      orderBy: { idempresa: 'asc' }
    })

    return NextResponse.json(empresas)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener empresas: " + error.message },
      { status: 500 }
    )
  }
}
export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      nombre_empresa,
      ruc,
      nombre_comercial,
      direccion,
      telefono,
      celular,
      correo,
      estado
    } = await request.json()
    
    if (!nombre_empresa || !ruc) {
      return NextResponse.json(
        { error: "Nombre de empresa y RUC son requeridos" },
        { status: 400 }
      )
    }

    const nuevaEmpresa = await db.empresa.create({
      data: {
        nombre_empresa,
        ruc,
        nombre_comercial,
        direccion,
        telefono,
        celular,
        correo,
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

    return NextResponse.json(nuevaEmpresa, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear empresa: " + error.message },
      { status: 500 }
    )
  }
}