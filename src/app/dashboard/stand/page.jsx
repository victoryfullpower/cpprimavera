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
    Select,
    SelectItem,
    Divider,
    Autocomplete,
    AutocompleteItem
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function StandsPage() {
    // Estados
    const session = useSession()

    const [stands, setStands] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentStand, setCurrentStand] = useState({
        descripcion: '',
        nivel: 1,
        idcliente: null
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [clienteSearch, setClienteSearch] = useState('')
    const rowsPerPage = 10

    // Niveles predefinidos
    const niveles = [1, 2, 3, 4, 5]

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [standsRes, clientesRes] = await Promise.all([
                fetch('/api/stands'),
                fetch('/api/clientes')
            ])

            if (!standsRes.ok) throw new Error('Error cargando stands')
            if (!clientesRes.ok) throw new Error('Error cargando clientes')

            const standsData = await standsRes.json()
            const clientesData = await clientesRes.json()

            setStands(standsData)
            setClientes(clientesData)
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
    const filteredItems = stands.filter(stand =>
        stand.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
        (stand.client?.nombre.toLowerCase().includes(filter.toLowerCase()))
    )

    const paginatedItems = filteredItems.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    )

    // Filtrar clientes para el select con búsqueda
    const filteredClientes = useMemo(() => {
        return clientes.filter(cliente =>
            cliente.nombre.toLowerCase().includes(clienteSearch.toLowerCase())
        )
    }, [clientes, clienteSearch])

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este stand?')) return

        try {
            setStands(prev => prev.filter(s => s.idstand !== id))

            const res = await fetch(`/api/stands/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Stand eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar stand')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentStand?.idstand
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/stands/${currentStand.idstand}`
                : '/api/stands'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descripcion: currentStand.descripcion,
                    nivel: currentStand.nivel,
                    idcliente: currentStand.idcliente
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setStands(prev => {
                if (isEditing) {
                    return prev.map(s => s.idstand === result.idstand ? result : s)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Stand actualizado correctamente'
                    : 'Stand creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Stands</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por descripción o cliente..."
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
                            setCurrentStand({
                                descripcion: '',
                                nivel: 1,
                                idcliente: null
                            })
                            setClienteSearch('')
                            onOpen()
                        }}
                    >
                        Nuevo Stand
                    </Button>
                </div>
            </div>

            <Table
                aria-label="Tabla de stands"
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
                    <TableColumn key="idstand" width="80px">ID</TableColumn>
                    <TableColumn key="descripcion">Descripción</TableColumn>
                    <TableColumn key="nivel" width="100px">Nivel</TableColumn>
                    <TableColumn key="cliente">Cliente</TableColumn>
                    <TableColumn key="acciones" width="150px">Acciones</TableColumn>
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idstand}>
                            <TableCell>{item.idstand}</TableCell>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>{item.nivel}</TableCell>
                            <TableCell>{item.client?.nombre || 'Sin asignar'}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="primary"
                                        onPress={() => {
                                            setCurrentStand({
                                                idstand: item.idstand,
                                                descripcion: item.descripcion,
                                                nivel: item.nivel,
                                                idcliente: item.idcliente
                                            })
                                            setClienteSearch('')
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
                                            onPress={() => handleDelete(item.idstand)}
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
                                {currentStand?.idstand ? 'Editar Stand' : 'Nuevo Stand'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="stand-form" onSubmit={handleSubmit} className="space-y-4">
                                    {/* Campo Descripción */}
                                    <Input
                                        autoFocus
                                        label="Descripción"
                                        placeholder="Ej: Stand Principal"
                                        value={currentStand.descripcion}
                                        onChange={(e) => setCurrentStand({
                                            ...currentStand,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Select de Nivel */}

                                    <Select
                                        label="Nivel"
                                        placeholder="Seleccione un nivel"
                                        selectedKeys={currentStand.nivel ? [currentStand.nivel.toString()] : []}
                                        onChange={(e) => {
                                            setCurrentStand({
                                                ...currentStand,
                                                nivel: e.target.value ? parseInt(e.target.value) : 1
                                            })
                                        }}
                                        isRequired
                                    >
                                        {[1, 2, 3, 4, 5].map(nivel => (
                                            <SelectItem
                                                key={nivel.toString()}
                                                value={nivel.toString()}
                                                textValue={`Nivel ${nivel}`}
                                            >
                                                Nivel {nivel}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Autocomplete para Cliente con búsqueda */}
                                    <Autocomplete
                                        label="Cliente"
                                        placeholder="Buscar cliente..."
                                        defaultItems={clientes}
                                        selectedKey={currentStand.idcliente ? currentStand.idcliente.toString() : null}

                                        onSelectionChange={(key) => {
                                            setCurrentStand({
                                                ...currentStand,
                                                idcliente: key ? parseInt(key) : null
                                            });
                                        }}
                                        className="mb-4"
                                        allowsCustomValue={false}
                                    >
                                        {(cliente) => (
                                            <AutocompleteItem key={cliente.idcliente.toString()} textValue={cliente.nombre}>
                                                {cliente.nombre}
                                            </AutocompleteItem>
                                        )}
                                    </Autocomplete>
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
                                    form="stand-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentStand?.idstand ? 'Guardar' : 'Crear'}
                                </Button>)}
                                {session.user.role === 'USER' && !currentStand?.idstand && (<Button
                                    color="primary"
                                    type="submit"
                                    form="stand-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentStand?.idstand ? 'Guardar' : 'Crear'}
                                </Button>)}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}