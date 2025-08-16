import { NextResponse } from 'next/server'
import db from '@/libs/db'

// GET - Obtener todos los inquilinos con sus relaciones de stands
export async function GET() {
    try {
        const inquilinos = await db.inquilino.findMany({
            where: {
                estado: true
            },
            include: {
                inquilino_stand: {
                    where: {
                        actual: true
                    },
                    include: {
                        stand: {
                            include: {
                                client: {
                                    select: {
                                        idcliente: true,
                                        nombre: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                nombre: 'asc'
            }
        })
        
        return NextResponse.json(inquilinos)
    } catch (error) {
        console.error('Error al obtener inquilinos:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// POST - Crear nuevo inquilino
export async function POST(request) {
    try {
        const body = await request.json()
        const { nombre } = body

        if (!nombre || nombre.trim() === '') {
            return NextResponse.json(
                { error: 'El nombre es requerido' },
                { status: 400 }
            )
        }

        const inquilino = await db.inquilino.create({
            data: {
                nombre: nombre.trim(),
                estado: true
            }
        })

        return NextResponse.json(inquilino, { status: 201 })
    } catch (error) {
        console.error('Error al crear inquilino:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
} 