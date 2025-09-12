import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const recibos = await db.recibo_ingreso.findMany({
      include: {
        metodoPago: {
          select: {
            idmetodo_pago: true,
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
        detalles: {
          include: {
            detalleDeuda: {
              include: {
                inquilino_activo: {
                  select: {
                    idinquilino: true,
                    nombre: true
                  }
                }
              }
            },
            concepto: true
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
        entidadRecaudadora: {
          select: {
            identidad_recaudadora: true,
            descripcion: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(recibos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener recibos: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
 const ahora = getPeruTime();
const offsetPeru = ahora.getTimezoneOffset() * 60 * 1000; // Ajuste automático
const fechaPeru = new Date(ahora.getTime() - offsetPeru);
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { idmetodo_pago, idstand, numero_operacion, detalles, identidad_recaudadora,
    } = await request.json()

    // Validar número de operación si viene
    if (numero_operacion && !/^[a-zA-Z0-9]+$/.test(numero_operacion)) {
      return NextResponse.json(
        { error: "El número de operación solo puede contener letras y números" },
        { status: 400 }
      )
    }

    // Validar montos de pago
    const montosInvalidos = detalles.some(det =>
      isNaN(parseFloat(det.montoPago)) || parseFloat(det.montoPago) <= 0
    );

    if (montosInvalidos) {
      return NextResponse.json(
        { error: "Los montos de pago deben ser valores positivos" },
        { status: 400 }
      );
    }

    // Validar que los montos de pago no excedan el saldo pendiente
    for (const detalle of detalles) {
      if (detalle.idregdeuda_detalle) {
        const deudaDetalle = await db.reg_deuda_detalle.findUnique({
          where: { idregdeuda_detalle: parseInt(detalle.idregdeuda_detalle) },
          include: {
            detallesReciboIngreso: {
              select: { monto: true }
            }
          }
        });

        if (deudaDetalle) {
          const totalPagado = deudaDetalle.detallesReciboIngreso.reduce(
            (sum, det) => sum + parseFloat(det.monto.toString()),
            0
          );
          // Incluir la mora en el cálculo del saldo pendiente
          const montoTotal = parseFloat(deudaDetalle.monto.toString());
          const moraTotal = deudaDetalle.mora ? parseFloat(deudaDetalle.mora.toString()) : 0;
          const saldoPendiente = (montoTotal + moraTotal) - totalPagado;
          const montoPago = parseFloat(detalle.montoPago);

          console.log('=== DEBUG API RECIBO INGRESO ===');
          console.log('deudaDetalle:', deudaDetalle);
          console.log('montoTotal:', montoTotal);
          console.log('moraTotal:', moraTotal);
          console.log('totalPagado:', totalPagado);
          console.log('saldoPendiente calculado:', saldoPendiente);
          console.log('montoPago:', montoPago);
          console.log('¿montoPago > saldoPendiente?', montoPago > saldoPendiente);

          if (montoPago > saldoPendiente) {
            return NextResponse.json(
              { error: `El monto de pago (S/. ${montoPago.toFixed(2)}) excede el saldo pendiente (S/. ${saldoPendiente.toFixed(2)}) para la deuda seleccionada` },
              { status: 400 }
            );
          }
        }
      }
    }

    // Obtener numeración
    const numeracion = await db.documento_numeracion.findFirst({
      where: { descripcion: 'recibo ingreso' }
    })

    if (!numeracion) {
      return NextResponse.json(
        { error: "No se encontró la numeración para recibos" },
        { status: 400 }
      )
    }

    // Determinar número de recibo
    const numeroRecibo = numeracion.numeroactual === 0
      ? numeracion.apartir_de_numeracion + 1
      : numeracion.numeroactual + 1;

    // Crear recibo
    const reciboData = {
      idmetodo_pago: parseInt(idmetodo_pago),
      identidad_recaudadora: identidad_recaudadora ? parseInt(identidad_recaudadora) : null,

      idstand: parseInt(idstand),
      numerorecibo: numeroRecibo,
      fecharecibo: getPeruTime(),
      total: detalles.reduce((sum, det) => sum + parseFloat(det.montoPago), 0),
      createdby: session.user.id,
      updatedby: session.user.id,
      estado: true,
        updatedAt: getPeruTime(),
        createdAt: getPeruTime(),

      detalles: {
        create: detalles.map(det => ({
          
          idconcepto: parseInt(det.idconcepto),
          fechadeuda: new Date(det.fechadeuda),
          idregdeuda_detalle: det.idregdeuda_detalle ? parseInt(det.idregdeuda_detalle) : null,
          monto: parseFloat(det.montoPago),
          descripcion: det.descripcion || null // Campo adicional para descripción manual
        }))
      }

    }

    // Agregar número de operación si existe
    if (numero_operacion) {
      reciboData.numero_operacion = numero_operacion
    }

    const recibo = await db.recibo_ingreso.create({
      data: reciboData,
      include: {
        metodoPago: true,
        createdBy: true,
        stand: {
          include: {
            client: true
          }
        },
        detalles: {
          include: {
            detalleDeuda: true
          }
        }
      }
    })

    // Actualizar numeración
    await db.documento_numeracion.update({
      where: { iddocumento_numeracion: numeracion.iddocumento_numeracion },
      data: { numeroactual: numeroRecibo }
    })

    // Actualizar estado de las deudas que fueron pagadas
    console.log('🔍 Verificando deudas para marcar como pagadas...')
    console.log('Detalles del recibo:', detalles)
    
    const deudasPagadas = detalles.filter(det => det.idregdeuda_detalle)
    console.log('Deudas encontradas para marcar como pagadas:', deudasPagadas)
    
    if (deudasPagadas.length > 0) {
      const deudaIds = deudasPagadas.map(det => parseInt(det.idregdeuda_detalle))
      console.log('IDs de deudas a marcar como pagadas:', deudaIds)
      
      const updateResult = await db.reg_deuda_detalle.updateMany({
        where: {
          idregdeuda_detalle: {
            in: deudaIds
          }
        },
        data: {
          estado: true, // Marcar como pagada
          updatedAt: getPeruTime(),
          updatedby: session.user.id
        }
      })
      
      console.log(`✅ Marcadas como pagadas ${updateResult.count} deudas:`, deudaIds)
    } else {
      console.log('⚠️ No se encontraron deudas para marcar como pagadas')
    }

    return NextResponse.json(recibo, { status: 201 })

  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear recibo: " + error.message },
      { status: 500 }
    )
  }
}
