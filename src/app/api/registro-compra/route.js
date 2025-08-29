// app/api/registro-compra/route.js
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

    // Obtener todos los registros de compra
    const registrosCompra = await db.registro_compra.findMany({
      include: {
        tipoCompra: { select: { descripcion: true } },
        createdBy: { select: { id: true, username: true } },
        updatedBy: { select: { id: true, username: true } }
      },
      orderBy: { idcompra: 'desc' }
    })

    // Si se filtra por descripción
    if (descripcion) {
      const registro = registrosCompra.find(reg => 
        reg.descripcion.toLowerCase().includes(descripcion.toLowerCase())
      )
      return NextResponse.json(registro || null)
    }

    return NextResponse.json(registrosCompra)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener registros de compra: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { 
      idtipocompra, 
      fecharegistro, 
      numcomprobante, 
      descripcion, 
      monto, 
      observaciones, 
      estado 
    } = await request.json()

    if (!idtipocompra || !fecharegistro || !numcomprobante || !descripcion || !monto) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos excepto observaciones" },
        { status: 400 }
      )
    }

    const nuevoRegistro = await db.registro_compra.create({
      data: {
        idtipocompra: parseInt(idtipocompra),
        fecharegistro: new Date(fecharegistro),
        numcomprobante,
        descripcion,
        monto: parseFloat(monto),
        observaciones: observaciones || '',
        estado: estado !== undefined ? estado : true,
        createdby: session.user.id,
        updatedby: session.user.id,
        updatedAt: getPeruTime(),
        createdAt: getPeruTime(),
      },
      include: {
        tipoCompra: { select: { descripcion: true } },
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

    return NextResponse.json(nuevoRegistro, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear registro de compra: " + error.message },
      { status: 500 }
    )
  }
}


