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
    AutocompleteItem,
    Card,
    CardBody,
    CardHeader
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'


export default function StandsPage() {
    // Estados
    const session = useSession()

    const [stands, setStands] = useState([])
    const [clientes, setClientes] = useState([])
    const [inquilinos, setInquilinos] = useState([])
    const [inquilinoStands, setInquilinoStands] = useState([])
    const [standInquilinoHistory, setStandInquilinoHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { isOpen: isInquilinoOpen, onOpen: onInquilinoOpen, onOpenChange: onInquilinoOpenChange } = useDisclosure()
    const [currentStand, setCurrentStand] = useState({
        descripcion: '',
        nivel: 1,
        idcliente: null
    })
    const [currentInquilino, setCurrentInquilino] = useState({
        nombre: ''
    })
    const [selectedStandForInquilino, setSelectedStandForInquilino] = useState(null)
    const [fechaInicio, setFechaInicio] = useState(new Date())
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isInquilinoSubmitting, setIsInquilinoSubmitting] = useState(false)
    const [clienteSearch, setClienteSearch] = useState('')
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const rowsPerPage = 10

    // Niveles predefinidos
    const niveles = [1, 2, 3, 4, 5]

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [standsRes, clientesRes, inquilinosRes, inquilinoStandsRes] = await Promise.all([
                fetch('/api/stands'),
                fetch('/api/clientes'),
                fetch('/api/inquilinos'),
                fetch('/api/inquilino-stand')
            ])

            if (!standsRes.ok) throw new Error('Error cargando stands')
            if (!clientesRes.ok) throw new Error('Error cargando clientes')
            if (!inquilinosRes.ok) throw new Error('Error cargando inquilinos')
            if (!inquilinoStandsRes.ok) throw new Error('Error cargando inquilino-stands')

            const standsData = await standsRes.json()
            const clientesData = await clientesRes.json()
            const inquilinosData = await inquilinosRes.json()
            const inquilinoStandsData = await inquilinoStandsRes.json()

            setStands(standsData)
            setClientes(clientesData)
            setInquilinos(inquilinosData)
            setInquilinoStands(inquilinoStandsData)
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [refreshTrigger])

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

    // Función para obtener el inquilino actual de un stand
    const getInquilinoActual = (idstand) => {
        // Usar refreshTrigger para forzar la actualización
        const inquilinoStand = inquilinoStands.find(is => 
            is.idstand === idstand && is.actual === true
        )
        return inquilinoStand?.inquilino || null
    }

    // Función para obtener la fecha de inicio del inquilino actual
    const getFechaInicioInquilino = (idstand) => {
        const inquilinoStand = inquilinoStands.find(is => 
            is.idstand === idstand && is.actual === true
        )
        return inquilinoStand?.fecha_inicio || null
    }

    // Función para formatear fecha sin problemas de zona horaria
    const formatDateWithoutTimezone = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        // Crear fecha local usando los componentes de la fecha UTC
        const localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
        return localDate.toLocaleDateString()
    }

    // Función para crear nuevo inquilino
    const handleCreateInquilino = async (e) => {
        e.preventDefault()
        setIsInquilinoSubmitting(true)

        try {
            const res = await fetch('/api/inquilinos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentInquilino)
            })

            if (!res.ok) throw new Error('Error al crear inquilino')

            const newInquilino = await res.json()
            
            // Recargar la lista completa de inquilinos para asegurar sincronización
            const inquilinosRes = await fetch('/api/inquilinos')
            if (inquilinosRes.ok) {
                const updatedInquilinos = await inquilinosRes.json()
                setInquilinos(updatedInquilinos)
            }
            
            setCurrentInquilino({ nombre: '' })
            toast.success('Inquilino creado exitosamente')
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        } finally {
            setIsInquilinoSubmitting(false)
        }
    }

    // Función para asignar inquilino a stand
    const handleAssignInquilino = async (idstand, idinquilino) => {
        try {
            // Crear la fecha en el mediodía para evitar problemas de zona horaria
            const fechaCorregida = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), fechaInicio.getDate(), 12, 0, 0);
            
            const res = await fetch('/api/inquilino-stand', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    idstand, 
                    idinquilino, 
                    fecha_inicio: fechaCorregida.toISOString() 
                })
            })

            if (!res.ok) throw new Error('Error al asignar inquilino')

            const newInquilinoStand = await res.json()
            
            // Actualizar inmediatamente el estado local
            setInquilinoStands(prev => {
                // Remover la relación anterior actual para este stand
                const filtered = prev.filter(is => !(is.idstand === idstand && is.actual === true))
                // Agregar la nueva relación
                return [...filtered, newInquilinoStand]
            })

            // Actualizar el historial del stand
            if (selectedStandForInquilino && selectedStandForInquilino.idstand === idstand) {
                const res = await fetch(`/api/inquilino-stand?idstand=${idstand}`)
                if (res.ok) {
                    const history = await res.json()
                    setStandInquilinoHistory(history)
                }
            }

            // Forzar la actualización de la vista
            setRefreshTrigger(prev => prev + 1)

            // Cerrar el modal después de asignar
            onInquilinoOpenChange()
            
            toast.success('Inquilino asignado exitosamente')
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        }
    }

    // Función para quitar inquilino de un stand
    const handleRemoveInquilino = async (idstand) => {
        try {
            const res = await fetch(`/api/inquilino-stand?idstand=${idstand}`, {
                method: 'DELETE'
            })

            if (!res.ok) throw new Error('Error al remover inquilino')

            // Actualizar inmediatamente el estado local - remover todas las relaciones actuales para este stand
            setInquilinoStands(prev => {
                return prev.filter(is => !(is.idstand === idstand && is.actual === true))
            })

            // Actualizar el historial del stand
            if (selectedStandForInquilino && selectedStandForInquilino.idstand === idstand) {
                const res = await fetch(`/api/inquilino-stand?idstand=${idstand}`)
                if (res.ok) {
                    const history = await res.json()
                    setStandInquilinoHistory(history)
                }
            }

            // Forzar la actualización de la vista
            setRefreshTrigger(prev => prev + 1)

            // Cerrar el modal
            onInquilinoOpenChange()
            
            toast.success('Inquilino removido exitosamente')
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        }
    }

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este stand?')) return

        try {
            const res = await fetch(`/api/stands/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            // Solo actualizar el estado local si la eliminación fue exitosa
            setStands(prev => prev.filter(s => s.idstand !== id))
            
            // También limpiar las relaciones inquilino_stand del estado local
            setInquilinoStands(prev => prev.filter(is => is.idstand !== id))

            toast.success('Stand eliminado correctamente')
        } catch (error) {
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
            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
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
                    <TableColumn key="inquilino" width="150px">Inquilino Actual</TableColumn>
                    <TableColumn key="fecha_inicio" width="120px">Fecha Inicio</TableColumn>
                    <TableColumn key="acciones" width="200px">Acciones</TableColumn>
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
                                {getInquilinoActual(item.idstand)?.nombre || 'Sin inquilino'}
                            </TableCell>
                            <TableCell>
                                {formatDateWithoutTimezone(getFechaInicioInquilino(item.idstand))}
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
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
                                    )}
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="secondary"
                                        onPress={async () => {
                                            setSelectedStandForInquilino(item)
                                            // Cargar historial de inquilinos para este stand
                                            try {
                                                const res = await fetch(`/api/inquilino-stand?idstand=${item.idstand}`)
                                                if (res.ok) {
                                                    const history = await res.json()
                                                    setStandInquilinoHistory(history)
                                                }
                                            } catch (error) {
                                                console.error('Error cargando historial:', error)
                                            }
                                            onInquilinoOpen()
                                        }}
                                    >
                                        Asignar Inquilino
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
            )}

{(session.user.role === 'USER') && (
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
                    <TableColumn key="inquilino" width="150px">Inquilino Actual</TableColumn>
                    <TableColumn key="fecha_inicio" width="120px">Fecha Inicio</TableColumn>
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
                                {getInquilinoActual(item.idstand)?.nombre || 'Sin inquilino'}
                            </TableCell>
                            <TableCell>
                                {formatDateWithoutTimezone(getFechaInicioInquilino(item.idstand))}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            )}
            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} classNames={{
                wrapper: "z-[9998]",
                base: "z-[9998]"
            }}>
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

            {/* Modal para gestionar inquilinos */}
            <Modal isOpen={isInquilinoOpen} onOpenChange={onInquilinoOpenChange} size="2xl" classNames={{
                wrapper: "z-[9998]",
                base: "z-[9998]"
            }}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Gestionar Inquilinos
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Columna izquierda: Crear Inquilino + Historial */}
                                    <div className="space-y-4">
                                        {/* Formulario para crear nuevo inquilino */}
                                        <Card>
                                            <CardHeader className="font-bold">Crear Nuevo Inquilino</CardHeader>
                                            <CardBody>
                                                <form onSubmit={handleCreateInquilino} className="space-y-4">
                                                    <Input
                                                        label="Nombre del Inquilino"
                                                        placeholder="Ingrese el nombre del inquilino"
                                                        value={currentInquilino.nombre}
                                                        onChange={(e) => setCurrentInquilino({
                                                            ...currentInquilino,
                                                            nombre: e.target.value
                                                        })}
                                                        isRequired
                                                    />
                                                    <Button
                                                        type="submit"
                                                        color="primary"
                                                        isLoading={isInquilinoSubmitting}
                                                    >
                                                        Crear Inquilino
                                                    </Button>
                                                </form>
                                            </CardBody>
                                        </Card>

                                        {/* Historial de inquilinos */}
                                        {selectedStandForInquilino && (
                                            <Card>
                                                <CardHeader className="font-bold">
                                                    Historial de Inquilinos: {selectedStandForInquilino.descripcion}
                                                </CardHeader>
                                                <CardBody>
                                                    {standInquilinoHistory.length > 0 ? (
                                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                                            {standInquilinoHistory.map((item, index) => (
                                                                <div
                                                                    key={item.idinquilino_stand}
                                                                    className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                                                                        item.actual 
                                                                            ? 'bg-primary-50 border-primary-200' 
                                                                            : 'bg-gray-50 border-gray-200'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-2 h-2 rounded-full ${
                                                                            item.actual ? 'bg-primary' : 'bg-gray-400'
                                                                        }`}></span>
                                                                        <span className={`font-medium ${
                                                                            item.actual ? 'text-primary' : 'text-gray-600'
                                                                        }`}>
                                                                            {item.inquilino.nombre}
                                                                        </span>
                                                                        {item.actual && (
                                                                            <span className="text-xs bg-primary text-white px-1 py-0.5 rounded">
                                                                                Actual
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                                                                                            <span className="text-xs text-gray-500">
                                                                            {formatDateWithoutTimezone(item.fecha_inicio)}
                                                                        </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-500 italic">No hay historial de inquilinos</p>
                                                    )}
                                                </CardBody>
                                            </Card>
                                        )}
                                    </div>

                                    {/* Columna derecha: Asignar Inquilino */}
                                    {selectedStandForInquilino && (
                                        <Card>
                                            <CardHeader className="font-bold">
                                                Asignar Inquilino a: {selectedStandForInquilino.descripcion}
                                            </CardHeader>
                                            <CardBody>
                                                <div className="space-y-4">
                                                    <p className="text-sm text-gray-600">
                                                        Seleccione un inquilino para asignar a este stand. Si ya hay un inquilino asignado, será reemplazado. 
                                                        Haga clic en el inquilino actual para removerlo y dejar el stand sin inquilino asignado.
                                                    </p>
                                                    
                                                    {/* Selector de fecha */}
                                                                                                            <div className="flex items-center gap-3">
                                                            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                                                Fecha de Inicio:
                                                            </label>
                                                            <div className="flex-1 relative">
                                                                <input
                                                                    type="date"
                                                                    value={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
                                                                    onChange={(e) => {
                                                                        // Corregir el problema de zona horaria
                                                                        const [year, month, day] = e.target.value.split('-').map(Number);
                                                                        const date = new Date(year, month - 1, day, 12, 0, 0);
                                                                        setFechaInicio(date);
                                                                    }}
                                                                    className="w-full p-2 border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                                                />
                                                            </div>
                                                        </div>
                                                    
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {inquilinos.map(inquilino => (
                                                            <Button
                                                                key={inquilino.idinquilino}
                                                                variant="bordered"
                                                                size="sm"
                                                                color={getInquilinoActual(selectedStandForInquilino.idstand)?.idinquilino === inquilino.idinquilino ? "primary" : "default"}
                                                                onPress={() => {
                                                                    const currentInquilino = getInquilinoActual(selectedStandForInquilino.idstand)
                                                                    if (currentInquilino?.idinquilino === inquilino.idinquilino) {
                                                                        // Si es el inquilino actual, lo removemos
                                                                        handleRemoveInquilino(selectedStandForInquilino.idstand)
                                                                    } else {
                                                                        // Si no es el actual, lo asignamos
                                                                        handleAssignInquilino(selectedStandForInquilino.idstand, inquilino.idinquilino)
                                                                    }
                                                                }}
                                                                className="justify-start"
                                                            >
                                                                {inquilino.nombre}
                                                                {getInquilinoActual(selectedStandForInquilino.idstand)?.idinquilino === inquilino.idinquilino && (
                                                                    <span className="ml-2 text-xs bg-primary text-white px-1 py-0.5 rounded">Actual</span>
                                                                )}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    )}
                                </div>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}