// src/app/dashboard/backup/page.jsx
'use client'
import { useState } from 'react'
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  Divider, 
  Spinner, 
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function BackupPage() {
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true)
    try {
      const response = await fetch('/api/backup')
      
      if (!response.ok) {
        throw new Error(await response.text())
      }
      
      // Crear un enlace para descargar el archivo
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Obtener el nombre del archivo del header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'backup.sql'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast.success('Backup creado y descargado correctamente')
    } catch (error) {
      toast.error(`Error al crear el backup: ${error.message}`)
      console.error('Error:', error)
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0])
  }

  const handleRestoreBackup = async () => {
    if (!selectedFile) {
      toast.error('Por favor selecciona un archivo de backup')
      return
    }

    setIsRestoring(true)
    try {
      const formData = new FormData()
      formData.append('backupFile', selectedFile)

      const response = await fetch('/api/backup', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      toast.success('Backup restaurado correctamente')
      onOpenChange()
    } catch (error) {
      toast.error(`Error al restaurar el backup: ${error.message}`)
      console.error('Error:', error)
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <ToastContainer position="bottom-right" />
      
      <h1 className="text-2xl font-bold text-white mb-6">Gestión de Backups</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta para crear backup */}
        <Card className="p-4">
          <CardHeader>
            <h2 className="text-xl font-semibold">Crear Backup</h2>
          </CardHeader>
          <Divider />
          <CardBody className="p-4 gap-4">
            <p className="text-gray-300">
              Crea una copia de seguridad completa de la base de datos. Esta operación puede tardar varios minutos.
            </p>
            <Button 
              color="primary" 
              onPress={handleCreateBackup}
              isLoading={isCreatingBackup}
            >
              {isCreatingBackup ? 'Creando Backup...' : 'Crear Backup'}
            </Button>
          </CardBody>
        </Card>
        
        
      </div>
      
      {/* Modal para restaurar backup */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Restaurar Backup</ModalHeader>
              <ModalBody>
                <p className="text-red-500 font-medium">
                  Advertencia: Esta acción sobrescribirá todos los datos actuales en la base de datos.
                </p>
                <p>Por favor selecciona un archivo de backup válido:</p>
                
                <Input
                  type="file"
                  accept=".sql"
                  onChange={handleFileChange}
                  label="Archivo de Backup"
                  placeholder="Selecciona un archivo .sql"
                />
                
                {selectedFile && (
                  <p className="text-sm text-gray-400">
                    Archivo seleccionado: {selectedFile.name}
                  </p>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" onPress={onClose}>
                  Cancelar
                </Button>
                <Button 
                  color="danger" 
                  onPress={handleRestoreBackup}
                  isLoading={isRestoring}
                >
                  {isRestoring ? 'Restaurando...' : 'Confirmar Restauración'}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}