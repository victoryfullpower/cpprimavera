import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener todos los inquilinos con sus relaciones de stands
export async function GET() {
    try {
        const inquilinos = await prisma.inquilino.findMany({
            where: {
                estado: true
            },
            include: {
                inquilino_stand: {
                    include: {
                        stand: true
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

        const inquilino = await prisma.inquilino.create({
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