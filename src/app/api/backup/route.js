import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)
const unlinkAsync = promisify(fs.unlink)

export async function GET() {
  let tempFilePath = ''
  
  try {
    // 1. Generar nombre de archivo con timestamp
    const now = new Date()
    const timestamp = now.toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
    const fileName = `backup_${timestamp}.dump`
    
    // 2. Ruta temporal única
    tempFilePath = path.join('/tmp', fileName)

    // 3. Comando pg_dump
    const command = [
      '/Library/PostgreSQL/16/bin/pg_dump',
      `--dbname=${process.env.DATABASE_URL.replace('?schema=public', '')}`,
      '-F c',
      '-b',
      '-v',
      '-f', tempFilePath
    ].join(' ')

    await execAsync(command, {
      env: {
        ...process.env,
        PATH: `/Library/PostgreSQL/16/bin:${process.env.PATH}`
      }
    })

    // 4. Leer archivo temporal
    const fileData = fs.readFileSync(tempFilePath)
    
    // 5. Crear respuesta con nombre descriptivo
    const response = new NextResponse(fileData)
    response.headers.set('Content-Type', 'application/octet-stream')
    response.headers.set('Content-Disposition', `attachment; filename="${fileName}"`)
    
    return response

  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({
      error: "Error al generar backup",
      details: error.message,
      solution: "Verifica espacio en disco y permisos"
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
    
    // Verificar si el usuario es administrador
    if (session.user.role !== 'admin') {
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
    const tempFilePath = path.join(process.cwd(), 'temp_restore.sql')
    await writeFileAsync(tempFilePath, fileContent)

    // Comando para restaurar con psql
    const psqlCommand = `psql -U ${user} -h ${host} -p ${port} -d ${dbName} -f "${tempFilePath}"`

    // Configurar la variable de entorno para la contraseña
    process.env.PGPASSWORD = password

    // Ejecutar el comando de restauración
    await execAsync(psqlCommand)

    // Eliminar el archivo temporal
    await unlinkAsync(tempFilePath)

    return NextResponse.json({ success: true, message: 'Backup restaurado correctamente' })

  } catch (error) {
    return NextResponse.json(
      { error: "Error al restaurar el backup: " + error.message },
      { status: 500 }
    )
  }
}