'use client'
import { useEffect, useState, useMemo } from 'react'
import {
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Input,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure,
    Spinner,
    Switch,
    Divider,
    Chip,
    Select,
    SelectItem
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function MetodoPagoPage() {
    // Estados
    const session = useSession()

    const [metodos, setMetodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentMetodo, setCurrentMetodo] = useState({
        descripcion: '',
        estado: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Opciones para registros por página
    const rowsPerPageOptions = [
        { key: "10", label: "10" },
        { key: "25", label: "25" },
        { key: "50", label: "50" },
        { key: "100", label: "100" },
        { key: "all", label: "Todos" }
    ]

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/metodo-pago')
            
            if (!res.ok) throw new Error('Error cargando métodos de pago')
            
            const data = await res.json()
            setMetodos(data)
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filtrar y paginar
    const filteredItems = useMemo(() => 
        metodos.filter(metodo =>
            metodo.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            (metodo.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
        ),
        [metodos, filter]
    )

    const paginatedItems = useMemo(() => 
        rowsPerPage === 'all' 
            ? filteredItems 
            : filteredItems.slice(
                (page - 1) * rowsPerPage,
                page * rowsPerPage
            ),
        [filteredItems, page, rowsPerPage]
    )

    // Resetear página cuando cambie rowsPerPage
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value === 'all' ? 'all' : parseInt(value))
        setPage(1)
    }

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este método de pago?')) return

        try {
            setMetodos(prev => prev.filter(m => m.idmetodo_pago !== id))

            const res = await fetch(`/api/metodo-pago/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Método de pago eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar método de pago')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentMetodo?.idmetodo_pago
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/metodo-pago/${currentMetodo.idmetodo_pago}`
                : '/api/metodo-pago'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentMetodo.descripcion,
                    estado: currentMetodo.estado
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setMetodos(prev => {
                if (isEditing) {
                    return prev.map(m => m.idmetodo_pago === result.idmetodo_pago ? result : m)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Método de pago actualizado correctamente'
                    : 'Método de pago creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Métodos de Pago</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por descripción o creador..."
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value)
                            setPage(1)
                        }}
                        className="w-64"
                        isClearable
                        onClear={() => setFilter('')}
                    />
                    <Select
                        selectedKeys={[rowsPerPage.toString()]}
                        className="w-24"
                        size="sm"
                        placeholder=""
                        onChange={(e) => handleRowsPerPageChange(e.target.value)}
                    >
                        {rowsPerPageOptions.map((option) => (
                            <SelectItem key={option.key} value={option.key}>
                                {option.key === 'all' ? 'Todos' : option.key}
                            </SelectItem>
                        ))}
                    </Select>
                    <Button
                        color="primary"
                        onPress={() => {
                            setCurrentMetodo({
                                descripcion: '',
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Método
                    </Button>
                </div>
            </div>

            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
            <Table
                aria-label="Tabla de métodos de pago"
                bottomContent={
                    rowsPerPage !== 'all' && (
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
                    )
                }
                classNames={{
                    wrapper: "min-h-[400px]",
                }}
            >
                <TableHeader>
                    <TableColumn key="idmetodo_pago" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="creadoPor">Creado por</TableColumn>
                    <TableColumn key="actualizadoPor">Actualizado por</TableColumn>
                    <TableColumn key="acciones" width="180px">Acciones</TableColumn>
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idmetodo_pago}>
                            <TableCell>{item.idmetodo_pago}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                                <Chip color={item.estado ? "success" : "danger"}>
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                {item.updatedBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onPress={() => {
                                                setCurrentMetodo({
                                                    idmetodo_pago: item.idmetodo_pago,
                                                    descripcion: item.descripcion,
                                                    estado: item.estado
                                                })
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
                                            onPress={() => handleDelete(item.idmetodo_pago)}
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
            )}

            {(session.user.role === 'USER') && (
            <Table
                aria-label="Tabla de métodos de pago"
                bottomContent={
                    rowsPerPage !== 'all' && (
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
                    )
                }
                classNames={{
                    wrapper: "min-h-[400px]",
                }}
            >
                <TableHeader>
                    <TableColumn key="idmetodo_pago" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="creadoPor">Creado por</TableColumn>
                    <TableColumn key="actualizadoPor">Actualizado por</TableColumn>
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idmetodo_pago}>
                            <TableCell>{item.idmetodo_pago}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                                <Chip color={item.estado ? "success" : "danger"}>
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                {item.updatedBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.updatedAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            )}

            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentMetodo?.idmetodo_pago ? 'Editar Método' : 'Nuevo Método'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="metodo-form" onSubmit={handleSubmit} className="space-y-4">
                                    {/* Campo Descripción */}
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Efectivo, Transferencia, Tarjeta"
                                        value={currentMetodo.descripcion}
                                        onChange={(e) => setCurrentMetodo({
                                            ...currentMetodo,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Switch de Estado */}
                                    <Switch
                                        isSelected={currentMetodo.estado}
                                        onValueChange={(value) => {
                                            setCurrentMetodo({
                                                ...currentMetodo,
                                                estado: value
                                            })
                                        }}
                                    >
                                        Estado Activo
                                    </Switch>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (<Button
                                    color="primary"
                                    type="submit"
                                    form="metodo-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentMetodo?.idmetodo_pago ? 'Guardar' : 'Crear'}
                                </Button>)}
                                {session.user.role === 'USER' && !currentMetodo?.idmetodo_pago && (<Button
                                    color="primary"
                                    type="submit"
                                    form="metodo-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentMetodo?.idmetodo_pago ? 'Guardar' : 'Crear'}
                                </Button>)}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}