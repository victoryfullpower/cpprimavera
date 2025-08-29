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

export default function TipoDocumentoCompraPage() {
    // Estados
    const session = useSession()

    const [tiposDocumento, setTiposDocumento] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentTipoDocumento, setCurrentTipoDocumento] = useState({
        descripcion: '',
        estado: true
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

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
            const res = await fetch('/api/tipo-documento-compra')
            
            if (!res.ok) throw new Error('Error cargando tipos de documento')
            
            const data = await res.json()
            setTiposDocumento(data)
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
        tiposDocumento.filter(tipo =>
            tipo.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            (tipo.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
    ), [tiposDocumento, filter])

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
        if (!confirm('¿Estás seguro de eliminar este tipo de documento?')) return

        try {
            setTiposDocumento(prev => prev.filter(t => t.idtipodocumento !== id))

            const res = await fetch(`/api/tipo-documento-compra/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Tipo de documento eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar tipo de documento')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            const isEditing = !!currentTipoDocumento?.idtipodocumento
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/tipo-documento-compra/${currentTipoDocumento.idtipodocumento}`
                : '/api/tipo-documento-compra'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentTipoDocumento.descripcion,
                    estado: currentTipoDocumento.estado
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setTiposDocumento(prev => {
                if (isEditing) {
                    return prev.map(t => t.idtipodocumento === result.idtipodocumento ? result : t)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Tipo de documento actualizado correctamente'
                    : 'Tipo de documento creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Tipos de Documento de Compra</h1>
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
                            setCurrentTipoDocumento({
                                descripcion: '',
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Tipo de Documento
                    </Button>
                </div>
            </div>

            {/* Tabla con permisos de edición/eliminación */}
            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                <Table
                    aria-label="Tabla de tipos de documento de compra"
                    className="mb-6"
                    selectionMode="none"
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
                                    onChange={(page) => setPage(page)}
                                />
                            </div>
                        )
                    }
                >
                    <TableHeader>
                        <TableColumn key="idtipodocumento" width="100px">ID</TableColumn>
                        <TableColumn key="descripcion">Descripción</TableColumn>
                        <TableColumn key="estado" width="120px">Estado</TableColumn>
                        <TableColumn key="creadoPor">Creado por</TableColumn>
                        <TableColumn key="actualizadoPor">Actualizado por</TableColumn>
                        <TableColumn key="acciones" width="200px">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={paginatedItems}
                        isLoading={loading}
                        loadingContent={<Spinner />}
                    >
                        {(item) => (
                            <TableRow key={item.idtipodocumento}>
                                <TableCell>{item.idtipodocumento}</TableCell>
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
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onPress={() => {
                                                setCurrentTipoDocumento({
                                                    idtipodocumento: item.idtipodocumento,
                                                    descripcion: item.descripcion,
                                                    estado: item.estado
                                                })
                                                onOpen()
                                            }}
                                        >
                                            Editar
                                        </Button>
                                        {session.user.role === 'SUPERADMIN' && (
                                            <Button
                                                size="sm"
                                                variant="flat"
                                                color="danger"
                                                onPress={() => handleDelete(item.idtipodocumento)}
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

            {/* Tabla de solo lectura para usuarios normales */}
            {session.user.role === 'USER' && (
                <Table
                    aria-label="Tabla de tipos de documento de compra (solo lectura)"
                    className="mb-6"
                    selectionMode="none"
                    bottomContent={
                        <div className="flex w-full justify-center">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={Math.ceil(filteredItems.length / rowsPerPage)}
                                onChange={(page) => setPage(page)}
                            />
                        </div>
                    }
                >
                    <TableHeader>
                        <TableColumn key="idtipodocumento" width="100px">ID</TableColumn>
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
                            <TableRow key={item.idtipodocumento}>
                                <TableCell>{item.idtipodocumento}</TableCell>
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
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentTipoDocumento?.idtipodocumento ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="tipo-documento-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                                    {/* Campo Descripción */}
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Factura, Boleta, Nota de Crédito, etc."
                                        value={currentTipoDocumento.descripcion}
                                        onChange={(e) => setCurrentTipoDocumento({
                                            ...currentTipoDocumento,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Campo Estado */}
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            isSelected={currentTipoDocumento.estado}
                                            onValueChange={(value) => setCurrentTipoDocumento({
                                                ...currentTipoDocumento,
                                                estado: value
                                            })}
                                        />
                                        <span className="text-sm">Activo</span>
                                    </div>
                                </form>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="flat" onPress={onClose}>
                                    Cancelar
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={() => handleSubmit()}
                                    isLoading={isSubmitting}
                                    form="tipo-documento-form"
                                >
                                    {currentTipoDocumento?.idtipodocumento ? 'Actualizar' : 'Crear'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}
