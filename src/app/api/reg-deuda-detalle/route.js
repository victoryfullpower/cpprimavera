// app/api/reg-deuda-detalle/route.ts
import { NextResponse } from 'next/server'
import db from '@/libs/db'

// export async function GET(request) {
//   const { searchParams } = new URL(request.url)
//   const standId = searchParams.get('standId')

//   if (!standId) {
//     return NextResponse.json(
//       { error: "standId es requerido" },
//       { status: 400 }
//     )
//   }

//   try {
//     const deudas = await db.reg_deuda_detalle.findMany({
//       where: {
//         idstand: parseInt(standId),
//         // NOT: {
//         //   recibo_ingreso_detalle: { some: {} }
//         // }
//       },
//       include: {
//         cabecera: {
//           select: {
//             idconcepto_deuda: true,
//             concepto: true,
//             fechadeuda: true
//           }
//         }
//       }
//     })

//     // Transformar los resultados para asegurar que monto sea number
//     const deudasTransformadas = deudas.map(deuda => ({
//       ...deuda,
//       monto: parseFloat(deuda.monto.toString()), // Convertir a número
//       cabecera: {
//         ...deuda.cabecera,
//         concepto: deuda.cabecera.concepto
//       }
//     }))
    
//     return NextResponse.json(deudasTransformadas)
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Error al obtener deudas" },
//       { status: 500 }
//     )
//   }
// }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const standId = searchParams.get('standId');

    if (!standId) {
      return NextResponse.json(
        { error: "standId es requerido" },
        { status: 400 }
      );
    }

    const deudas = await db.reg_deuda_detalle.findMany({
      where: {
        idstand: parseInt(standId)
      },
      include: {
        cabecera: {
          include: {
            concepto: true
          }
        },
        detallesReciboIngreso: {
          select: {
            monto: true
          }
        }
      }
    });
    // Calcular saldo pendiente para cada deuda
    const deudasConSaldo = deudas.map(deuda => {
      const totalPagado = deuda.detallesReciboIngreso.reduce(
        (sum, det) => sum + parseFloat(det.monto.toString()),
        0
      );
      console.log("totalpagado", totalPagado)
      const saldoPendiente = parseFloat(deuda.monto.toString()) - totalPagado;
 console.log("deuda", deuda)
      return {
        ...deuda,
        monto: parseFloat(deuda.monto.toString()),
        totalPagado,
        saldoPendiente,
        cabecera: {
          ...deuda.cabecera,
          concepto: deuda.cabecera.concepto
        }
      };
    }).filter(deuda => deuda.saldoPendiente > 0); // Solo deudas con saldo pendiente

    return NextResponse.json(deudasConSaldo);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Error al obtener deudas" },
      { status: 500 }
    );
  }
}