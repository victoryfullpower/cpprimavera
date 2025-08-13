import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function GET(request, { params }) {
  try {
    const stand = await db.stand.findUnique({
      where: { idstand: Number(params.id) },
      include: {
        client: {
          select: {
            idcliente: true,
            nombre: true
          }
        }
      }
    })

    if (!stand) {
      return NextResponse.json(
        { error: "Stand no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(stand)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener stand: " + error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request, { params }) {
  try {
    const { descripcion, nivel, idcliente } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const standActualizado = await db.stand.update({
      where: { idstand: Number(params.id) },
      data: {
        descripcion,
        nivel: nivel ? parseInt(nivel) : 1,
        idcliente: idcliente ? parseInt(idcliente) : null
      },
      include: {
        client: {
          select: {
            idcliente: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json(standActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar stand: " + error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    // Prisma manejará automáticamente la eliminación en cascada
    await db.stand.delete({
      where: { idstand: Number(params.id) }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar stand: " + error.message },
      { status: 500 }
    )
  }
}