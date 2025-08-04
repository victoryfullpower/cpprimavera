// PUT: Actualizar usuario (sin password)
import { NextResponse } from 'next/server'
import db from '@/libs/db'
import bcrypt from 'bcrypt'

// GET: Obtener usuario por ID (sin password)
export async function GET(request, { params }) {
  try {
    const user = await db.user.findUnique({
      where: { id: Number(params.id) },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        estado: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuario: " + error.message },
      { status: 500 }
    )
  }
}



export async function PUT(request, { params }) {
  try {
    const { email, username, password, role, estado } = await request.json()
    
    // Validaciones básicas
    if (!email || !username) {
      return NextResponse.json(
        { error: "Email y usuario son requeridos" },
        { status: 400 }
      )
    }

    // Verificar unicidad (excluyendo al usuario actual)
    const existingUser = await db.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { email },
              { username }
            ]
          },
          {
            NOT: { id: Number(params.id) }
          }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email o nombre de usuario ya existen" },
        { status: 400 }
      )
    }

    // Preparar datos para actualización
    const updateData = {
      email,
      username,
      role,
      estado
    }

    // Hashear la contraseña solo si se proporcionó una nueva
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Actualizar el usuario
    const updatedUser = await db.user.update({
      where: { id: Number(params.id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        estado: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar usuario: " + error.message },
      { status: 500 }
    )
  }
}

// DELETE: Eliminar usuario
export async function DELETE(request, { params }) {
  try {
    console.log('Eliminando usuario con ID:', params.id)
    
    // Primero verificar si el usuario existe
    const userToDelete = await db.user.findUnique({
      where: { id: Number(params.id) }
    })

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Verificar si el usuario tiene registros relacionados
    const hasRelatedRecords = await db.$transaction(async (tx) => {
      const conceptoDeudaCount = await tx.concepto_deuda.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const regDeudaCount = await tx.reg_deuda.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const documentoNumeracionCount = await tx.documento_numeracion.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const metodoPagoCount = await tx.metodo_pago.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const entidadRecaudadoraCount = await tx.entidad_recaudadora.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const reciboIngresoCount = await tx.recibo_ingreso.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const empresaCount = await tx.empresa.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const conceptoEgresoCount = await tx.concepto_egreso.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      const reciboEgresoCount = await tx.recibo_egreso.count({
        where: {
          OR: [
            { createdby: Number(params.id) },
            { updatedby: Number(params.id) }
          ]
        }
      })

      return conceptoDeudaCount > 0 || regDeudaCount > 0 || documentoNumeracionCount > 0 || 
             metodoPagoCount > 0 || entidadRecaudadoraCount > 0 || reciboIngresoCount > 0 || 
             empresaCount > 0 || conceptoEgresoCount > 0 || reciboEgresoCount > 0
    })

    if (hasRelatedRecords) {
      return NextResponse.json(
        { error: "No se puede eliminar el usuario porque tiene registros relacionados en el sistema. Considere desactivarlo en lugar de eliminarlo." },
        { status: 400 }
      )
    }

    // Si no hay registros relacionados, proceder con la eliminación
    await db.user.delete({
      where: { id: Number(params.id) }
    })

    console.log('Usuario eliminado exitosamente')
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    
    // Manejar errores específicos de Prisma
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: "No se puede eliminar el usuario porque tiene registros relacionados en el sistema." },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Error al eliminar usuario: " + error.message },
      { status: 500 }
    )
  }
}