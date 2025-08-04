import { NextResponse } from 'next/server'
import db from '@/libs/db'

// GET - Obtener todos los clientes
export async function GET() {
  try {
    const clientes = await db.cliente.findMany({
      orderBy: { idcliente: 'asc' },
      select: {
        idcliente: true,
        nombre: true,
        // Incluye otros campos si es necesario
      }
    })
    return NextResponse.json(clientes)
  } catch (error) {
    console.error('GET /api/clientes error:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo cliente
export async function POST(request) {
  try {
    const { nombre } = await request.json()
    
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const nuevoCliente = await db.cliente.create({
      data: { nombre }
    })

    return NextResponse.json(nuevoCliente, { status: 201 })
  } catch (error) {
    console.error('POST /api/clientes error:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente', details: error.message },
      { status: 500 }
    )
  }
}