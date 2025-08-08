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
    NumberInput
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function DocumentoNumeracionPage() {
    // Estados
    const session = useSession()

    const [documentos, setDocumentos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentDocumento, setCurrentDocumento] = useState({
        descripcion: '',
        numeroactual: 0,
        apartir_de_numeracion: 0,
        estado: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const rowsPerPage = 10

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/documento-numeracion')
            
            if (!res.ok) throw new Error('Error cargando documentos')
            
            const data = await res.json()
            setDocumentos(data)
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
        documentos.filter(documento =>
            documento.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            (documento.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
    , [documentos, filter]))

    const paginatedItems = useMemo(() => 
        filteredItems.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        ),
        [filteredItems, page]
    )

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este documento?')) return

        try {
            setDocumentos(prev => prev.filter(d => d.iddocumento_numeracion !== id))

            const res = await fetch(`/api/documento-numeracion/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Documento eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar documento')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentDocumento?.iddocumento_numeracion
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/documento-numeracion/${currentDocumento.iddocumento_numeracion}`
                : '/api/documento-numeracion'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentDocumento.descripcion,
                    numeroactual: currentDocumento.numeroactual,
                    apartir_de_numeracion: currentDocumento.apartir_de_numeracion,
                    estado: currentDocumento.estado
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setDocumentos(prev => {
                if (isEditing) {
                    return prev.map(d => d.iddocumento_numeracion === result.iddocumento_numeracion ? result : d)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Documento actualizado correctamente'
                    : 'Documento creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Numeración de Documentos</h1>
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
                            setCurrentDocumento({
                                descripcion: '',
                                numeroactual: 0,
                                apartir_de_numeracion: 0,
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Documento
                    </Button>
                </div>
            </div>

            <Table
                aria-label="Tabla de numeración de documentos"
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
                    <TableColumn key="iddocumento_numeracion" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="numeroactual" width="120px">Número Actual</TableColumn>
                    <TableColumn key="apartir_de_numeracion" width="150px">A partir de N°</TableColumn>
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
                        <TableRow key={item.iddocumento_numeracion}>
                            <TableCell>{item.iddocumento_numeracion}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>{item.numeroactual}</TableCell>
                            <TableCell>{item.apartir_de_numeracion}</TableCell>
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
                                                setCurrentDocumento({
                                                    iddocumento_numeracion: item.iddocumento_numeracion,
                                                    descripcion: item.descripcion,
                                                    numeroactual: item.numeroactual,
                                                    apartir_de_numeracion: item.apartir_de_numeracion,
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
                                            onPress={() => handleDelete(item.iddocumento_numeracion)}
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
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentDocumento?.iddocumento_numeracion ? 'Editar Documento' : 'Nuevo Documento'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="documento-form" onSubmit={handleSubmit} className="space-y-4">
                                    {/* Campo Descripción */}
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Facturas, Boletas, etc."
                                        value={currentDocumento.descripcion}
                                        onChange={(e) => setCurrentDocumento({
                                            ...currentDocumento,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Campo Número Actual */}
                                    <Input
                                        type="number"
                                        label="Número Actual"
                                        min="0"
                                        value={currentDocumento.numeroactual}
                                        onChange={(e) => setCurrentDocumento({
                                            ...currentDocumento,
                                            numeroactual: parseInt(e.target.value) || 0
                                        })}
                                        isRequired
                                    />

                                    {/* Campo A partir de N° */}
                                    <Input
                                        type="number"
                                        label="A partir de N°"
                                        min="0"
                                        value={currentDocumento.apartir_de_numeracion}
                                        onChange={(e) => setCurrentDocumento({
                                            ...currentDocumento,
                                            apartir_de_numeracion: parseInt(e.target.value) || 0
                                        })}
                                        isRequired
                                    />

                                    {/* Switch de Estado */}
                                    <Switch
                                        isSelected={currentDocumento.estado}
                                        onValueChange={(value) => {
                                            setCurrentDocumento({
                                                ...currentDocumento,
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
                                    form="documento-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentDocumento?.iddocumento_numeracion ? 'Guardar' : 'Crear'}
                                </Button>)}
                                {session.user.role === 'USER' && !currentDocumento?.iddocumento_numeracion && (<Button
                                    color="primary"
                                    type="submit"
                                    form="documento-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentDocumento?.iddocumento_numeracion ? 'Guardar' : 'Crear'}
                                </Button>)}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}