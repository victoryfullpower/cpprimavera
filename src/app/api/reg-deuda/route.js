// app/api/reg-deuda/route.js
import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Obtener todos los detalles de deudas individuales
        const detallesDeudas = await db.reg_deuda_detalle.findMany({
            include: {
                concepto: {
                    select: {
                        idconcepto: true,
                        descripcion: true
                    }
                },
                stand: {
                    include: {
                        client: {
                            select: {
                                idcliente: true,
                                nombre: true
                            }
                        }
                    }
                },
                inquilino_activo: {
                    select: {
                        idinquilino: true,
                        nombre: true
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
            },
            orderBy: { createdAt: 'desc' }
        })

        // Transformar los datos para que coincidan con la estructura esperada
        const deudasTransformadas = detallesDeudas.map(detalle => ({
            idregdeuda_detalle: detalle.idregdeuda_detalle,
            idregdeuda: null, // No hay relación directa
            idstand: detalle.idstand,
            monto: detalle.monto,
            mora: detalle.mora,
            total: parseFloat(detalle.monto) + parseFloat(detalle.mora || 0),
            estado: detalle.estado, // El estado viene del detalle individual
            fechadeudaStand: detalle.fechadeudaStand,
            createdAt: detalle.createdAt,
            updatedAt: detalle.updatedAt,
            concepto: detalle.concepto,
            stand: detalle.stand,
            inquilino_activo: detalle.inquilino_activo,
            createdBy: detalle.createdBy,
            updatedBy: detalle.updatedBy
        }))

        // Debug logs
        console.log('=== API REG-DEUDA DEBUG ===')
        console.log('Total detalles encontrados:', detallesDeudas.length)
        console.log('Primeros 3 detalles:', detallesDeudas.slice(0, 3).map(d => ({
            id: d.idregdeuda_detalle,
            estado: d.estado,
            monto: d.monto,
            mora: d.mora
        })))
        console.log('Deudas transformadas:', deudasTransformadas.length)
        console.log('Primeras 3 transformadas:', deudasTransformadas.slice(0, 3))
        console.log('==========================')

        return NextResponse.json(deudasTransformadas)
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



