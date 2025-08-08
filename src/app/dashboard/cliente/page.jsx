'use client'
import { useEffect, useState } from 'react'
import { Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Spinner } from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function ClientesPage() {
  // Estados
  const session = useSession()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [currentCliente, setCurrentCliente] = useState({ nombre: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const rowsPerPage = 10

  // Cargar clientes
  const fetchClientes = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/clientes')
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setClientes(data)
    } catch (error) {
      toast.error('Error cargando clientes')
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  // Filtrar y paginar
  const filteredItems = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(filter.toLowerCase())
  )

  const paginatedItems = filteredItems.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  )

  // Operaciones CRUD
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    
    try {
      // Actualización optimista
      setClientes(prev => prev.filter(c => c.idcliente !== id))
      
      const res = await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      
      toast.success('Cliente eliminado correctamente')
    } catch (error) {
      // Rollback en caso de error
      fetchClientes()
      toast.error('Error al eliminar cliente')
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const isEditing = !!currentCliente?.idcliente
      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing 
        ? `/api/clientes/${currentCliente.idcliente}`
        : '/api/clientes'

      // Si es nuevo, no agregar temporalmente a la lista
      // Solo agregaremos después de la respuesta del servidor

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: currentCliente.nombre })
      })

      if (!res.ok) throw new Error(await res.text())

      const result = await res.json()

      // Actualizar el estado basado en la respuesta del servidor
      setClientes(prev => {
        if (isEditing) {
          return prev.map(c => c.idcliente === result.idcliente ? result : c)
        } else {
          return [...prev, result]
        }
      })

      toast.success(
        isEditing 
          ? 'Cliente actualizado correctamente' 
          : 'Cliente creado correctamente'
      )
      onOpenChange()
    } catch (error) {
      toast.error('Error al guardar los cambios')
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <ToastContainer position="bottom-right" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Gestión de Clientes</h1>
        <div className="flex gap-3">
          <Input
            placeholder="Filtrar por nombre..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value)
              setPage(1)
            }}
            className="w-64"
            isClearable
            onClear={() => setFilter('')}
          />
          <Button
            color="primary"
            onPress={() => {
              setCurrentCliente({ nombre: '' })
              onOpen()
            }}
          >
            Nuevo Cliente
          </Button>
        </div>
      </div>

      <Table
        aria-label="Tabla de clientes"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="primary"
              page={page}
              total={Math.ceil(filteredItems.length / rowsPerPage)}
              onChange={setPage}
            />
          </div>
        }
        classNames={{
          wrapper: "min-h-[400px]",
        }}
      >
        <TableHeader>
          <TableColumn key="idcliente" width="100px">ID</TableColumn>
          <TableColumn key="nombre">Nombre</TableColumn>
          <TableColumn key="acciones" width="150px">Acciones</TableColumn>
        </TableHeader>
        <TableBody
          items={paginatedItems}
          isLoading={loading}
          loadingContent={<Spinner />}
        >
          {(item) => (
            <TableRow key={item.idcliente}>
              <TableCell>{item.idcliente}</TableCell>
              <TableCell>{item.nombre}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => {
                        setCurrentCliente(item)
                        onOpen()
                      }}
                    >
                      Editar
                    </Button>
                  )}
                  {session.user.role === 'SUPERADMIN' && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => handleDelete(item.idcliente)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal para crear/editar */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {currentCliente?.idcliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </ModalHeader>
              <ModalBody>
                <form id="cliente-form" onSubmit={handleSubmit}>
                  <Input
                    autoFocus
                    label="Nombre del cliente"
                    placeholder="Ej: Juan Pérez"
                    value={currentCliente.nombre}
                    onChange={(e) => setCurrentCliente({
                      ...currentCliente,
                      nombre: e.target.value
                    })}
                    isRequired
                    description="Nombre completo del cliente"
                  />
                </form>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (<Button 
                  color="primary" 
                  type="submit" 
                  form="cliente-form"
                  isLoading={isSubmitting}
                >
                  {currentCliente?.idcliente ? 'Guardar' : 'Crear'}
                </Button>)}

                {session.user.role === 'USER' && !currentCliente?.idcliente && (<Button 
                  color="primary" 
                  type="submit" 
                  form="cliente-form"
                  isLoading={isSubmitting}
                >
                  {currentCliente?.idcliente ? 'Guardar' : 'Crear'}
                </Button>)}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}