import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'

export async function GET(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const recibo = await db.recibo_ingreso.findUnique({
      where: {
        idrecibo_ingreso: parseInt(params.id)
      },
      include: {
        metodoPago: true,
        stand: {
          include: {
            client: true
          }
        },
        detalles: {
          include: {
            concepto: true,
            detalleDeuda: {
              include: {
                inquilino_activo: {
                  select: {
                    idinquilino: true,
                    nombre: true
                  }
                }
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

    if (!recibo) {
      return NextResponse.json(
        { error: "Recibo no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(recibo)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener recibo: " + error.message },
      { status: 500 }
    )
  }
}


export async function PUT(request, { params }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { 
      idmetodo_pago, 
      idstand, 
      identidad_recaudadora,
      numero_operacion, 
      detalles 
    } = await request.json()
    const { id } = params

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
              select: { monto: true, idrecibo_ingreso_detalle: true }
            }
          }
        });

        if (deudaDetalle) {
          // Obtener el recibo actual para excluir su pago anterior del cálculo
          const reciboActual = await db.recibo_ingreso.findUnique({
            where: { idrecibo_ingreso: parseInt(id) },
            include: {
              detalles: {
                where: { idregdeuda_detalle: parseInt(detalle.idregdeuda_detalle) },
                select: { monto: true }
              }
            }
          });

          // Calcular el total pagado excluyendo el pago actual del recibo
          let totalPagado = 0;
          if (reciboActual && reciboActual.detalles.length > 0) {
            // Excluir el pago anterior de este recibo
            const pagoAnterior = reciboActual.detalles[0].monto;
            totalPagado = deudaDetalle.detallesReciboIngreso.reduce(
              (sum, det) => sum + parseFloat(det.monto.toString()),
              0
            ) - parseFloat(pagoAnterior.toString());
          } else {
            totalPagado = deudaDetalle.detallesReciboIngreso.reduce(
              (sum, det) => sum + parseFloat(det.monto.toString()),
              0
            );
          }

          // Incluir la mora en el cálculo del saldo pendiente
          const montoTotal = parseFloat(deudaDetalle.monto.toString());
          const moraTotal = deudaDetalle.mora ? parseFloat(deudaDetalle.mora.toString()) : 0;
          const saldoPendiente = (montoTotal + moraTotal) - totalPagado;
          const montoPago = parseFloat(detalle.montoPago);

          console.log('=== DEBUG API RECIBO INGRESO UPDATE ===');
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

    // Preparar datos de actualización
    const updateData = {
      idmetodo_pago: parseInt(idmetodo_pago),
      identidad_recaudadora: identidad_recaudadora ? parseInt(identidad_recaudadora) : null,
      total: detalles.reduce((sum, det) => sum + parseFloat(det.montoPago), 0),
      updatedby: session.user.id,
      detalles: {
        deleteMany: {}, // Eliminar todos los detalles existentes
        create: detalles.map(det => ({
          idconcepto: parseInt(det.idconcepto),
          fechadeuda: new Date(det.fechadeuda),
          idregdeuda_detalle: det.idregdeuda_detalle ? parseInt(det.idregdeuda_detalle) : null,
          monto: parseFloat(det.montoPago),
          descripcion: det.descripcion || null // Campo para descripción manual
        }))
      }
    }

    // Solo actualizar idstand si viene en el request (para recibos por cobro)
    if (idstand !== undefined) {
      updateData.idstand = idstand ? parseInt(idstand) : null
    }

    // Actualizar número de operación si viene
    if (numero_operacion !== undefined) {
      updateData.numero_operacion = numero_operacion || null
    }

    // Actualizar recibo con relaciones completas
    const recibo = await db.recibo_ingreso.update({
      where: { idrecibo_ingreso: parseInt(id) },
      data: updateData,
      include: {
        metodoPago: true,
        stand: {
          include: {
            client: true
          }
        },
        entidadRecaudadora: true,
        detalles: {
          include: {
            detalleDeuda: true,
            concepto: true
          }
        }
      }
    })

    // Actualizar estado de las deudas que fueron pagadas
    const deudasPagadas = detalles.filter(det => det.idregdeuda_detalle)
    if (deudasPagadas.length > 0) {
      const deudaIds = deudasPagadas.map(det => parseInt(det.idregdeuda_detalle))
      
      await db.reg_deuda_detalle.updateMany({
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
      
      console.log(`Marcadas como pagadas ${deudaIds.length} deudas:`, deudaIds)
    }

    return NextResponse.json(recibo)

  } catch (error) {
    console.error('Error al actualizar recibo:', error)
    return NextResponse.json(
      { error: "Error al actualizar recibo: " + error.message },
      { status: 500 }
    )
  }
}
// export async function PUT(request, { params }) {
//   const session = await getSession()
//   if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

//   try {
//     const { 
//       idmetodo_pago, 
//       idstand, 
//       identidad_recaudadora,
//       numero_operacion, 
//       detalles 
//     } = await request.json()
//     const { id } = params

//     // Validaciones
//     if (numero_operacion && !/^[a-zA-Z0-9]+$/.test(numero_operacion)) {
//       return NextResponse.json(
//         { error: "El número de operación solo puede contener letras y números" },
//         { status: 400 }
//       )
//     }

//     const montosInvalidos = detalles.some(det => 
//       isNaN(parseFloat(det.monto)) || parseFloat(det.monto) <= 0
//     );

//     if (montosInvalidos) {
//       return NextResponse.json(
//         { error: "Los montos de pago deben ser valores positivos" },
//         { status: 400 }
//       );
//     }

//     // Datos completos para actualizar
//     const updateData = {
//       idmetodo_pago: parseInt(idmetodo_pago),
//       idstand: parseInt(idstand),
//       identidad_recaudadora: identidad_recaudadora ? parseInt(identidad_recaudadora) : null,
//       total: detalles.reduce((sum, det) => sum + parseFloat(det.monto), 0),
//       updatedby: session.user.id,
//       detalles: {
//         deleteMany: {},
//         create: detalles.map(det => ({
//           idconcepto: parseInt(det.idconcepto),
//           fechadeuda: new Date(det.fechadeuda),
//           idregdeuda_detalle: parseInt(det.idregdeuda_detalle),
//           monto: parseFloat(det.monto)
//         }))
//       }
//     }

//     // Actualizar número de operación
//     if (numero_operacion !== undefined) {
//       updateData.numero_operacion = numero_operacion || null
//     }

//     // Actualizar recibo con relaciones completas
//     const recibo = await db.recibo_ingreso.update({
//       where: { idrecibo_ingreso: parseInt(id) },
//       data: updateData,
//       include: {
//         metodoPago: true,
//         stand: {
//           include: {
//             client: true
//           }
//         },
//         entidadRecaudadora: true,
//         detalles: {
//           include: {
//             detalleDeuda: true,
//             concepto: true
//           }
//         }
//       }
//     })

//     return NextResponse.json(recibo)

//   } catch (error) {
//     return NextResponse.json(
//       { error: "Error al actualizar recibo: " + error.message },
//       { status: 500 }
//     )
//   }
// }
export async function DELETE(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Primero eliminar los detalles
    await db.recibo_ingreso_detalle.deleteMany({
      where: { cabecera_ri: parseInt(params.id) }
    })

    // Luego eliminar la cabecera
    await db.recibo_ingreso.delete({
      where: {
        idrecibo_ingreso: parseInt(params.id)
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar recibo: " + error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { estado } = await request.json()

    const reciboActualizado = await db.recibo_ingreso.update({
      where: { idrecibo_ingreso: parseInt(params.id) },
      data: {
        estado,
        updatedby: session.user.id
      }
    })

    return NextResponse.json(reciboActualizado)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al cambiar estado: " + error.message },
      { status: 500 }
    )
  }
}