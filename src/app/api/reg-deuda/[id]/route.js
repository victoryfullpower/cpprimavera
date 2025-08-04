import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'



export async function GET(request, { params }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const registro = await db.reg_deuda.findUnique({
            where: {
                idregdeuda: parseInt(params.id)
            },
            include: {
                concepto: true,
                detalles: {
                    include: {
                        stand: {
                            include: {
                                client: true
                            }
                        }
                    }
                },
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

        if (!registro) {
            return NextResponse.json(
                { error: "Registro no encontrado" },
                { status: 404 }
            )
        }

        return NextResponse.json(registro)
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener registro: " + error.message },
            { status: 500 }
        )
    }
}

export async function PUT(request, { params }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = params
        const { fechadeuda, idconcepto_deuda, detalles } = await request.json()

        // Formatear detalles con mora
        const detallesFormateados = detalles.map(detalle => ({
            idstand: detalle.idstand,
            monto: parseFloat(parseFloat(detalle.monto || 0).toFixed(4)),
            mora: parseFloat(parseFloat(detalle.mora || 0).toFixed(4))
        }))

        // Calcular total (monto + mora)
        const total = parseFloat(detallesFormateados.reduce(
            (sum, detalle) => sum + parseFloat(detalle.monto) + parseFloat(detalle.mora), 
            0
        ).toFixed(4))

        // Eliminar detalles existentes
        await db.reg_deuda_detalle.deleteMany({
            where: { idregdeuda: parseInt(id) }
        })

        // Actualizar registro
        const registroActualizado = await db.reg_deuda.update({
            where: { idregdeuda: parseInt(id) },
            data: {
                fechadeuda: new Date(fechadeuda),
                idconcepto_deuda: parseInt(idconcepto_deuda),
                total,
                updatedby: session.user.id,
                detalles: {
                    create: detallesFormateados.map(detalle => ({
                        idstand: parseInt(detalle.idstand),
                        monto: detalle.monto,
                        mora: detalle.mora
                    }))
                }
            },
            include: {
                concepto: true,
                detalles: {
                    include: {
                        stand: {
                            include: {
                                client: true
                            }
                        }
                    }
                },
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

        return NextResponse.json(registroActualizado)
    } catch (error) {
        console.error('Error al actualizar:', error)
        return NextResponse.json(
            { error: "Error al actualizar: " + error.message },
            { status: 500 }
        )
    }
}

export async function DELETE(request, { params }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Eliminar detalles primero
        await db.reg_deuda_detalle.deleteMany({
            where: { idregdeuda: parseInt(params.id) }
        })

        // Luego eliminar cabecera
        await db.reg_deuda.delete({
            where: { idregdeuda: parseInt(params.id) }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar: " + error.message },
            { status: 500 }
        )
    }
}

export async function PATCH(request, { params }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = params
        const { estado } = await request.json()

        const registroActualizado = await db.reg_deuda.update({
            where: { idregdeuda: parseInt(id) },
            data: {
                estado,
                updatedby: session.user.id
            },
            include: {
                updatedBy: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        })

        return NextResponse.json(registroActualizado)
    } catch (error) {
        console.error('Error al cambiar estado:', error)
        return NextResponse.json(
            { error: "Error al cambiar estado: " + error.message },
            { status: 500 }
        )
    }
}