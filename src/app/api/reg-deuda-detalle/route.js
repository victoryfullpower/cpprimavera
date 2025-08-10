// app/api/reg-deuda-detalle/route.ts
import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const standId = searchParams.get('standId');

    let whereClause = {};
    
    // Si se proporciona standId, filtrar por ese stand
    if (standId) {
      whereClause.idstand = parseInt(standId);
    }

    const detalles = await db.reg_deuda_detalle.findMany({
      where: whereClause,
      include: {
        concepto: true,
        stand: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            username: true
          }
        },
        updatedBy: {
          select: {
            username: true
          }
        },
        detallesReciboIngreso: {
          select: {
            monto: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar los resultados para asegurar que los montos sean números
    const detallesTransformados = detalles.map(detalle => {
      const totalPagado = detalle.detallesReciboIngreso.reduce(
        (sum, det) => sum + parseFloat(det.monto.toString()),
        0
      );
      
      const montoTotal = parseFloat(detalle.monto.toString());
      const saldoPendiente = montoTotal - totalPagado;
      
      return {
        ...detalle,
        monto: montoTotal,
        mora: detalle.mora ? parseFloat(detalle.mora.toString()) : 0,
        totalPagado,
        saldoPendiente: Math.max(0, saldoPendiente) // Asegurar que no sea negativo
      };
    });

    // Filtrar solo los detalles que tienen saldo pendiente
    const detallesConSaldo = detallesTransformados.filter(detalle => detalle.saldoPendiente > 0);

    return NextResponse.json(detallesConSaldo);
  } catch (error) {
    console.error('Error al obtener detalles de deuda:', error);
    return NextResponse.json(
      { error: "Error al obtener detalles de deuda" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      idconcepto_deuda,
      idstand,
      fechadeudaStand,
      monto,
      mora = 0,
      estado = true,
      lote = false
    } = body;

    // Validaciones
    if (!idconcepto_deuda || !idstand || !fechadeudaStand || !monto) {
      return NextResponse.json(
        { error: "Todos los campos obligatorios deben estar presentes" },
        { status: 400 }
      );
    }

    // Crear el detalle de deuda
    const nuevoDetalle = await db.reg_deuda_detalle.create({
      data: {
        idconcepto_deuda: parseInt(idconcepto_deuda),
        idstand: parseInt(idstand),
        fechadeudaStand: new Date(fechadeudaStand),
        monto: parseFloat(monto),
        mora: parseFloat(mora),
        estado: Boolean(estado),
        lote: Boolean(lote),
        createdby: session.user.id,
        updatedby: session.user.id
      },
      include: {
        concepto: true,
        stand: {
          include: {
            client: true
          }
        },
        createdBy: {
          select: {
            username: true
          }
        },
        updatedBy: {
          select: {
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      ...nuevoDetalle,
      monto: parseFloat(nuevoDetalle.monto.toString()),
      mora: nuevoDetalle.mora ? parseFloat(nuevoDetalle.mora.toString()) : 0
    });

  } catch (error) {
    console.error('Error al crear detalle de deuda:', error);
    return NextResponse.json(
      { error: "Error al crear detalle de deuda: " + error.message },
      { status: 500 }
    );
  }
}