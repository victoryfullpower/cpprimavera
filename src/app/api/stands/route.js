import { NextResponse } from 'next/server'
import db from '@/libs/db'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeClient = searchParams.get('includeClient') === 'true'
    
    const includeOptions = {
      client: {
        select: {
          idcliente: true,
          nombre: true
        }
      }
    }
    
    // Si se solicita incluir inquilinos, agregar la relación
    if (includeClient) {
      includeOptions.inquilino_stand = {
        where: {
          actual: true
        },
        include: {
          inquilino: {
            select: {
              idinquilino: true,
              nombre: true
            }
          }
        }
      }
    }
    
    const stands = await db.stand.findMany({
      include: includeOptions,
      orderBy: { idstand: 'asc' }
    })
    
    console.log(stands)
    return NextResponse.json(stands)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener stands: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { descripcion, nivel, idcliente } = await request.json()
    
    if (!descripcion) {
      return NextResponse.json(
        { error: "La descripción es requerida" },
        { status: 400 }
      )
    }

    const nuevoStand = await db.stand.create({
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

    return NextResponse.json(nuevoStand, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear stand: " + error.message },
      { status: 500 }
    )
  }
}