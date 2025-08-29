'use client'
import { useEffect, useState } from 'react'
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

export default function ConceptosDeudaPage() {
    // Estados
    const session = useSession()

    const [conceptos, setConceptos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentConcepto, setCurrentConcepto] = useState({
        descripcion: '',
        estado: true,
        deuda: false,
        inquilinopaga: false
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
            const res = await fetch('/api/conceptos-deuda')
            if (!res.ok) throw new Error('Error cargando conceptos')
            const data = await res.json()
            setConceptos(data)
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
    const filteredItems = conceptos.filter(concepto =>
        concepto.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
        (concepto.createdBy?.username?.toLowerCase().includes(filter.toLowerCase())))
    
    const paginatedItems = rowsPerPage === 'all' 
        ? filteredItems 
        : filteredItems.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        )

    // Resetear página cuando cambie rowsPerPage
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value === 'all' ? 'all' : parseInt(value))
        setPage(1)
    }

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este concepto? Esta acción no se puede deshacer.')) return

        try {
            // Optimistic update
            setConceptos(prev => prev.filter(c => c.idconcepto !== id))

            const res = await fetch(`/api/conceptos-deuda/${id}`, { 
                method: 'DELETE' 
            })
            
            if (!res.ok) throw new Error(await res.text())

            toast.success('Concepto eliminado correctamente', {
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
        } catch (error) {
            // Revert if error
            fetchData()
            toast.error('Error al eliminar concepto: ' + error.message, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentConcepto?.idconcepto
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/conceptos-deuda/${currentConcepto.idconcepto}`
                : '/api/conceptos-deuda'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentConcepto.descripcion,
                    estado: currentConcepto.estado,
                    deuda: currentConcepto.deuda,
                    inquilinopaga: currentConcepto.inquilinopaga
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setConceptos(prev => {
                if (isEditing) {
                    return prev.map(c => c.idconcepto === result.idconcepto ? result : c)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Concepto actualizado correctamente'
                    : 'Concepto creado correctamente',
                {
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                }
            )
            onOpenChange()
        } catch (error) {
            toast.error('Error al guardar los cambios: ' + error.message, {
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            })
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
                <h1 className="text-2xl font-bold text-white">Gestión de Conceptos de Ingreso</h1>
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
                            setCurrentConcepto({
                                descripcion: '',
                                estado: true,
                                deuda: false,
                                inquilinopaga: false
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Concepto
                    </Button>
                </div>
            </div>

            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
            <Table
                aria-label="Tabla de conceptos de deuda"
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
                    <TableColumn key="idconcepto" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="deuda" width="120px">Es Deuda</TableColumn>
                    <TableColumn key="inquilinopaga" width="120px">Inquilino Paga</TableColumn>
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
                        <TableRow key={item.idconcepto}>
                            <TableCell>{item.idconcepto}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                                <Chip
                                    color={item.estado ? "success" : "danger"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    color={item.deuda ? "warning" : "default"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.deuda ? "Sí" : "No"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    color={item.inquilinopaga ? "success" : "default"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.inquilinopaga ? "Sí" : "No"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'Sistema'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                {item.updatedBy?.username || 'Sistema'}
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
                                                setCurrentConcepto({
                                                    ...item,
                                                    inquilinopaga: item.inquilinopaga || false
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
                                            onPress={() => handleDelete(item.idconcepto)}
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
                aria-label="Tabla de conceptos de deuda"
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
                    <TableColumn key="idconcepto" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="deuda" width="120px">Es Deuda</TableColumn>
                    <TableColumn key="inquilinopaga" width="120px">Inquilino Paga</TableColumn>
                    <TableColumn key="creadoPor">Creado por</TableColumn>
                    <TableColumn key="actualizadoPor">Actualizado por</TableColumn>
                </TableHeader>

                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idconcepto}>
                            <TableCell>{item.idconcepto}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                                <Chip
                                    color={item.estado ? "success" : "danger"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    color={item.deuda ? "warning" : "default"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.deuda ? "Sí" : "No"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    color={item.inquilinopaga ? "success" : "default"}
                                    variant="flat"
                                    size="sm"
                                >
                                    {item.inquilinopaga ? "Sí" : "No"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'Sistema'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                {item.updatedBy?.username || 'Sistema'}
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
                                {currentConcepto?.idconcepto ? 'Editar Concepto' : 'Nuevo Concepto'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="concepto-form" onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Mantenimiento mensual"
                                        value={currentConcepto.descripcion}
                                        onChange={(e) => setCurrentConcepto({
                                            ...currentConcepto,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    <div className="flex flex-col gap-4">
                                        <Switch
                                            isSelected={currentConcepto.estado}
                                            onValueChange={(value) => {
                                                setCurrentConcepto({
                                                    ...currentConcepto,
                                                    estado: value
                                                })
                                            }}
                                        >
                                            Estado Activo
                                        </Switch>

                                        <Switch
                                            isSelected={currentConcepto.deuda}
                                            onValueChange={(value) => {
                                                setCurrentConcepto({
                                                    ...currentConcepto,
                                                    deuda: value
                                                })
                                            }}
                                        >
                                            Es Deuda
                                        </Switch>

                                        <Switch
                                            isSelected={currentConcepto.inquilinopaga}
                                            onValueChange={(value) => {
                                                setCurrentConcepto({
                                                    ...currentConcepto,
                                                    inquilinopaga: value
                                                })
                                            }}
                                        >
                                            Inquilino Paga
                                        </Switch>
                                    </div>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                                    <Button
                                        color="primary"
                                        type="submit"
                                        form="concepto-form"
                                        isLoading={isSubmitting}
                                    >
                                        {currentConcepto?.idconcepto ? 'Guardar' : 'Crear'}
                                    </Button>
                                )}
                                {session.user.role === 'USER' && !currentConcepto?.idconcepto && (
                                    <Button
                                        color="primary"
                                        type="submit"
                                        form="concepto-form"
                                        isLoading={isSubmitting}
                                    >
                                        Crear
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}