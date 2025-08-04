// app/api/reg-deuda/route.js
import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const registros = await db.reg_deuda.findMany({
            include: {
                concepto: {
                    select: {
                        idconcepto: true,
                        descripcion: true
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
                },
                detalles: {
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
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(registros)
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener registros: " + error.message },
            { status: 500 }
        )
    }
}

export async function POST(request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { fechadeuda, idconcepto_deuda, detalles } = await request.json()

        if (!fechadeuda || !idconcepto_deuda) {
            return NextResponse.json(
                { error: "Fecha y concepto son requeridos" },
                { status: 400 }
            )
        }

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

        const nuevoRegistro = await db.reg_deuda.create({
            data: {
                fechadeuda: new Date(fechadeuda),
                idconcepto_deuda: parseInt(idconcepto_deuda),
                total,
                estado: true,
                createdby: session.user.id,
                updatedby: session.user.id,
                updatedAt: getPeruTime(),
                createdAt: getPeruTime(),
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

        return NextResponse.json(nuevoRegistro, { status: 201 })
    } catch (error) {
        console.error('Error al crear registro:', error)
        return NextResponse.json(
            { error: "Error al crear registro: " + error.message },
            { status: 500 }
        )
    }
}



