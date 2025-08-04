import { NextResponse } from 'next/server'
import db from '@/libs/db'
import bcrypt from 'bcrypt'
import { getPeruTime } from '@/utils/date'

export async function GET(request) {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        estado: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { id: 'asc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener usuarios: " + error.message },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const { email, username, password, role, estado } = await request.json()

    // Validaciones básicas
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, usuario y contraseña son requeridos" },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingEmail = await db.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 400 }
      )
    }

    // Verificar si el username ya existe
    const existingUsername = await db.user.findUnique({
      where: { username }
    })

    if (existingUsername) {
      return NextResponse.json(
        { error: "El nombre de usuario ya está en uso" },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: role || 'USER',
        estado: estado !== undefined ? estado : true,
        updatedAt: getPeruTime(),
        createdAt: getPeruTime(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        estado: true,
        createdAt: true
      }
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear usuario: " + error.message },
      { status: 500 }
    )
  }
}

