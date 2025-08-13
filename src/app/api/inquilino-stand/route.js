import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Obtener todas las relaciones inquilino-stand
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idstand = searchParams.get('idstand')

        if (idstand) {
            // Si se especifica un stand, obtener solo las relaciones de ese stand
            const inquilinoStands = await prisma.inquilino_stand.findMany({
                where: {
                    idstand: parseInt(idstand)
                },
                include: {
                    inquilino: true,
                    stand: true
                },
                orderBy: [
                    { actual: 'desc' }, // Primero los actuales (true)
                    { idinquilino_stand: 'desc' } // Luego por orden de registro (más reciente primero)
                ]
            })
            
            return NextResponse.json(inquilinoStands)
        } else {
            // Si no se especifica stand, obtener todas las relaciones
            const inquilinoStands = await prisma.inquilino_stand.findMany({
                include: {
                    inquilino: true,
                    stand: true
                },
                orderBy: {
                    idinquilino_stand: 'desc'
                }
            })
            
            return NextResponse.json(inquilinoStands)
        }
    } catch (error) {
        console.error('Error al obtener inquilino-stands:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// POST - Crear o actualizar relación inquilino-stand
export async function POST(request) {
    try {
        const body = await request.json()
        const { idinquilino, idstand, fecha_inicio } = body

        if (!idinquilino || !idstand || !fecha_inicio) {
            return NextResponse.json(
                { error: 'El inquilino, stand y fecha de inicio son requeridos' },
                { status: 400 }
            )
        }

        // Primero, desactivar todas las relaciones actuales para este stand
        await prisma.inquilino_stand.updateMany({
            where: {
                idstand: parseInt(idstand)
            },
            data: {
                actual: false
            }
        })

        // Verificar si ya existe una relación entre este inquilino y stand
        const existingRelation = await prisma.inquilino_stand.findFirst({
            where: {
                idinquilino: parseInt(idinquilino),
                idstand: parseInt(idstand)
            }
        })

        let inquilinoStand

        if (existingRelation) {
            // Si ya existe la relación, actualizar el campo actual a true y la fecha de inicio
            inquilinoStand = await prisma.inquilino_stand.update({
                where: {
                    idinquilino_stand: existingRelation.idinquilino_stand
                },
                data: {
                    actual: true,
                    fecha_inicio: new Date(fecha_inicio)
                },
                include: {
                    inquilino: true,
                    stand: true
                }
            })
        } else {
            // Si no existe, crear nueva relación
            inquilinoStand = await prisma.inquilino_stand.create({
                data: {
                    idinquilino: parseInt(idinquilino),
                    idstand: parseInt(idstand),
                    actual: true,
                    fecha_inicio: new Date(fecha_inicio)
                },
                include: {
                    inquilino: true,
                    stand: true
                }
            })
        }

        return NextResponse.json(inquilinoStand, { status: 201 })
    } catch (error) {
        console.error('Error al crear/actualizar inquilino-stand:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}

// DELETE - Remover inquilino de un stand
export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url)
        const idstand = searchParams.get('idstand')

        if (!idstand) {
            return NextResponse.json(
                { error: 'El ID del stand es requerido' },
                { status: 400 }
            )
        }

        // Desactivar todas las relaciones actuales para este stand
        await prisma.inquilino_stand.updateMany({
            where: {
                idstand: parseInt(idstand),
                actual: true
            },
            data: {
                actual: false
            }
        })

        return NextResponse.json({ message: 'Inquilino removido exitosamente' })
    } catch (error) {
        console.error('Error al remover inquilino-stand:', error)
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
} 