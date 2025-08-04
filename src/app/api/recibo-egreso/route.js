import { NextResponse } from 'next/server'
import db from '@/libs/db'
import { getSession } from '@/libs/auth'
import { getPeruTime } from '@/utils/date'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const recibos = await db.recibo_egreso.findMany({
      include: {
        detalles: {
          include: {
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
        }
      },
      orderBy: { idrecibo_egreso: 'desc' }
    })

    return NextResponse.json(recibos)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener recibos de egreso: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { detalles } = await request.json();
    
    if (!detalles || detalles.length === 0) {
      return NextResponse.json(
        { error: "Debe agregar al menos un detalle" },
        { status: 400 }
      );
    }

    // Calcular el total
    const total = detalles.reduce((sum, detalle) => {
      return sum + (parseFloat(detalle.monto) || 0);
    }, 0);

    // Obtener numeración
    const numeracion = await db.documento_numeracion.findFirst({
      where: { descripcion: 'recibo egreso' }
    });

    let siguienteNumero = numeracion?.numeroactual + 1 || 1;
    if (numeracion?.numeroactual === 0) {
      siguienteNumero = numeracion.apartir_de_numeracion;
    }

    // Crear recibo usando los campos directos (createdby/updatedby)
    const nuevoRecibo = await db.recibo_egreso.create({
      data: {
        total: total,
        numerorecibo_egreso: siguienteNumero,
        fecharecibo_egreso: getPeruTime(),
        estado: true,
        createdby: session.user.id, // Usar el campo directo
        updatedby: session.user.id, // Usar el campo directo
          updatedAt: getPeruTime(),
        createdAt: getPeruTime(),
        detalles: {
          create: detalles.map(detalle => ({
            idconcepto_egreso: parseInt(detalle.idconcepto_egreso),
            monto: parseFloat(detalle.monto) || 0,
            descripcion: detalle.descripcion || '',
          
          }))
        }
      },
      include: {
        detalles: {
          include: {
            concepto: true
          }
        },
        // Obtener los datos del creador mediante una consulta separada
        createdBy: true
      }
    });

    // Actualizar numeración
    if (numeracion) {
      await db.documento_numeracion.update({
        where: { iddocumento_numeracion: numeracion.iddocumento_numeracion },
        data: { numeroactual: siguienteNumero }
      });
    }

    return NextResponse.json(nuevoRecibo, { status: 201 });
  } catch (error) {
    console.error('Error completo:', error);
    return NextResponse.json(
      { error: "Error al crear recibo de egreso: " + error.message },
      { status: 500 }
    );
  }
}