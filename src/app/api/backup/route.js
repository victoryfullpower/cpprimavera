import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { getSession } from '@/libs/auth'

const execAsync = promisify(exec)
const unlinkAsync = promisify(fs.unlink)
const writeFileAsync = promisify(fs.writeFile)

// Función para obtener la ruta de pg_dump según el sistema operativo
function getPgDumpPath() {
  const platform = os.platform()
  
  if (platform === 'win32') {
    // Windows - buscar en las rutas comunes
    const possiblePaths = [
      'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\13\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\12\\bin\\pg_dump.exe'
    ]
    
    for (const pgPath of possiblePaths) {
      if (fs.existsSync(pgPath)) {
        return pgPath
      }
    }
    
    // Si no se encuentra, usar pg_dump del PATH
    return 'pg_dump'
  } else if (platform === 'darwin') {
    // macOS
    return '/Library/PostgreSQL/16/bin/pg_dump'
  } else {
    // Linux y otros
    return 'pg_dump'
  }
}

// Función para obtener la ruta temporal según el sistema operativo
function getTempDir() {
  const platform = os.platform()
  
  if (platform === 'win32') {
    // Windows - usar el directorio temporal del sistema
    return os.tmpdir()
  } else {
    // macOS y Linux
    return '/tmp'
  }
}

export async function GET() {
  let tempFilePath = ''
  
  try {
    // 1. Generar nombre de archivo con timestamp
    const now = new Date()
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
    const fileName = `backup_${timestamp}.dump`
    
    // 2. Ruta temporal única según el sistema operativo
    const tempDir = getTempDir()
    tempFilePath = path.join(tempDir, fileName)

    // 3. Obtener la ruta de pg_dump
    const pgDumpPath = getPgDumpPath()

    // 4. Comando pg_dump
    const command = [
      `"${pgDumpPath}"`,
      `--dbname=${process.env.DATABASE_URL.replace('?schema=public', '')}`,
      '-F c',
      '-b',
      '-v',
      '-f', `"${tempFilePath}"`
    ].join(' ')

    console.log('Ejecutando comando:', command)

    await execAsync(command, {
      env: {
        ...process.env,
        PATH: process.env.PATH
      }
    })

    // 5. Verificar que el archivo se creó
    if (!fs.existsSync(tempFilePath)) {
      throw new Error(`El archivo de backup no se creó en: ${tempFilePath}`)
    }

    // 6. Leer archivo temporal
    const fileData = fs.readFileSync(tempFilePath)
    
    // 7. Crear respuesta con nombre descriptivo
    const response = new NextResponse(fileData)
    response.headers.set('Content-Type', 'application/octet-stream')
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    
    return response

  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({
      error: "Error al generar backup",
      details: error.message,
      solution: "Verifica que PostgreSQL esté instalado y configurado correctamente"
    }, { status: 500 })
  } finally {
    // Limpieza
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      await unlinkAsync(tempFilePath).catch(console.error)
    }
  }
}

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Verificar si el usuario es administrador o superadmin
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'No tienes permisos para realizar esta acción' }, { status: 403 })
    }

    // Obtener el archivo del body
    const formData = await request.formData()
    const file = formData.get('backupFile')

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo de backup' }, { status: 400 })
    }

    // Leer el contenido del archivo
    const fileContent = await file.text()

    // Extraer información de conexión de la URL de la base de datos
    const dbUrl = process.env.DATABASE_URL
    const urlParts = dbUrl.replace('postgresql://', '').split('@')
    const [userPassword, hostPortDb] = urlParts
    const [user, password] = userPassword.split(':')
    const [hostPort, dbName] = hostPortDb.split('/')
    const [host, port] = hostPort.split(':')

    // Crear archivo temporal
    const tempDir = getTempDir()
    const tempFilePath = path.join(tempDir, 'temp_restore.sql')
    await writeFileAsync(tempFilePath, fileContent)

    // Obtener la ruta de psql
    const psqlPath = getPgDumpPath().replace('pg_dump', 'psql').replace('.exe', '')

    // Comando para restaurar con psql
    const psqlCommand = `"${psqlPath}" -U ${user} -h ${host} -p ${port} -d ${dbName} -f "${tempFilePath}"`

    console.log('Ejecutando comando de restauración:', psqlCommand)

    // Configurar la variable de entorno para la contraseña
    process.env.PGPASSWORD = password

    // Ejecutar el comando de restauración
    await execAsync(psqlCommand)

    // Eliminar el archivo temporal
    await unlinkAsync(tempFilePath)

    return NextResponse.json({ success: true, message: 'Backup restaurado correctamente' })

  } catch (error) {
    console.error('Restore error:', error)
    return NextResponse.json(
      { error: "Error al restaurar el backup: " + error.message },
      { status: 500 }
    )
  }
}