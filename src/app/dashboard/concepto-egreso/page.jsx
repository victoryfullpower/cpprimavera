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
    Chip
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function ConceptoEgresoPage() {
    const session = useSession()

    // Estados
    const [conceptos, setConceptos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentConcepto, setCurrentConcepto] = useState({
        descripcion: '',
        estado: true
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const rowsPerPage = 10

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/concepto-egreso')
            
            if (!res.ok) throw new Error('Error cargando conceptos de egreso')
            
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
    const filteredItems = useMemo(() => 
        conceptos.filter(concepto =>
            concepto.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            (concepto.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
        ),
        [conceptos, filter]
    )

    const paginatedItems = useMemo(() => 
        filteredItems.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        ),
        [filteredItems, page]
    )

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este concepto de egreso?')) return

        try {
            setConceptos(prev => prev.filter(c => c.idconcepto_egreso !== id))

            const res = await fetch(`/api/concepto-egreso/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Concepto de egreso eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar concepto de egreso')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentConcepto?.idconcepto_egreso
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/concepto-egreso/${currentConcepto.idconcepto_egreso}`
                : '/api/concepto-egreso'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentConcepto.descripcion,
                    estado: currentConcepto.estado
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setConceptos(prev => {
                if (isEditing) {
                    return prev.map(c => c.idconcepto_egreso === result.idconcepto_egreso ? result : c)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Concepto de egreso actualizado correctamente'
                    : 'Concepto de egreso creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Conceptos de Egreso</h1>
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
                    <Button
                        color="primary"
                        onPress={() => {
                            setCurrentConcepto({
                                descripcion: '',
                                estado: true
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
                aria-label="Tabla de conceptos de egreso"
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
                    <TableColumn key="idconcepto_egreso" width="80px">ID</TableColumn>
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
                        <TableRow key={item.idconcepto_egreso}>
                            <TableCell>{item.idconcepto_egreso}</TableCell>
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
                                                setCurrentConcepto({
                                                    idconcepto_egreso: item.idconcepto_egreso,
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
                                            onPress={() => handleDelete(item.idconcepto_egreso)}
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
                aria-label="Tabla de conceptos de egreso"
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
                    <TableColumn key="idconcepto_egreso" width="80px">ID</TableColumn>
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
                        <TableRow key={item.idconcepto_egreso}>
                            <TableCell>{item.idconcepto_egreso}</TableCell>
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
                                {currentConcepto?.idconcepto_egreso ? 'Editar Concepto' : 'Nuevo Concepto'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="concepto-form" onSubmit={handleSubmit} className="space-y-4">
                                    {/* Campo Descripción */}
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Alquiler, Servicios básicos, Sueldos"
                                        value={currentConcepto.descripcion}
                                        onChange={(e) => setCurrentConcepto({
                                            ...currentConcepto,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Switch de Estado */}
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
                                    form="concepto-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentConcepto?.idconcepto_egreso ? 'Guardar' : 'Crear'}
                                </Button>)}
                                {session.user.role === 'USER' && !currentConcepto?.idconcepto_egreso && (<Button
                                    color="primary"
                                    type="submit"
                                    form="concepto-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentConcepto?.idconcepto_egreso ? 'Guardar' : 'Crear'}
                                </Button>)}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}