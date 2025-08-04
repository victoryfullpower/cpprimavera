import { NextResponse } from 'next/server'
import db from '@/libs/db'

// GET - Obtener cliente específico
export async function GET(request, { params }) {
  try {
    const cliente = await db.cliente.findUnique({
      where: { idcliente: Number(params.id) }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error(`GET /api/clientes/${params.id} error:`, error)
    return NextResponse.json(
      { error: 'Error al obtener cliente', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Actualizar cliente
export async function PUT(request, { params }) {
  try {
    const { nombre } = await request.json()
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const clienteActualizado = await db.cliente.update({
      where: { idcliente: Number(params.id) },
      data: { nombre }
    })

    return NextResponse.json(clienteActualizado)
  } catch (error) {
    console.error(`PUT /api/clientes/${params.id} error:`, error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar cliente', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar cliente
export async function DELETE(request, { params }) {
  try {
    await db.cliente.delete({
      where: { idcliente: Number(params.id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`DELETE /api/clientes/${params.id} error:`, error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error al eliminar cliente', details: error.message },
      { status: 500 }
    )
  }
}