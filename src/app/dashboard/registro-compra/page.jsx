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
    SelectItem,
    Textarea
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function RegistroCompraPage() {
    // Estados
    const session = useSession()

    const [registrosCompra, setRegistrosCompra] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentRegistro, setCurrentRegistro] = useState({
        idtipocompra: '',
        fecharegistro: new Date().toISOString().split('T')[0],
        numcomprobante: '',
        descripcion: '',
        monto: '',
        observaciones: '',
        estado: true
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
            const [resRegistros, resTipos] = await Promise.all([
                fetch('/api/registro-compra'),
                fetch('/api/tipo-documento-compra')
            ])
            
            if (!resRegistros.ok) throw new Error('Error cargando registros de compra')
            if (!resTipos.ok) throw new Error('Error cargando tipos de documento')
            
            const [dataRegistros, dataTipos] = await Promise.all([
                resRegistros.json(),
                resTipos.json()
            ])
            
            setRegistrosCompra(dataRegistros)
            setTiposDocumento(dataTipos.filter(t => t.estado)) // Solo tipos activos
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
        registrosCompra.filter(registro =>
            registro.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            registro.numcomprobante.toLowerCase().includes(filter.toLowerCase()) ||
            (registro.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
    ), [registrosCompra, filter])

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
        if (!confirm('¿Estás seguro de eliminar este registro de compra?')) return

        try {
            setRegistrosCompra(prev => prev.filter(r => r.idcompra !== id))

            const res = await fetch(`/api/registro-compra/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Registro de compra eliminado correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar registro de compra')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async () => {
        if (!currentRegistro.idtipocompra || !currentRegistro.fecharegistro || 
            !currentRegistro.numcomprobante || !currentRegistro.descripcion || !currentRegistro.monto) {
            toast.error('Todos los campos son requeridos excepto observaciones')
            return
        }

        setIsSubmitting(true)

        try {
            const isEditing = !!currentRegistro?.idcompra
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/registro-compra/${currentRegistro.idcompra}`
                : '/api/registro-compra'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentRegistro)
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setRegistrosCompra(prev => {
                if (isEditing) {
                    return prev.map(r => r.idcompra === result.idcompra ? result : r)
                } else {
                    return [result, ...prev]
                }
            })

            toast.success(
                isEditing
                    ? 'Registro de compra actualizado correctamente'
                    : 'Registro de compra creado correctamente'
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
        <div className="p-4 max-w-7xl mx-auto">
            <ToastContainer position="bottom-right" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Gestión de Registros de Compra</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por descripción, comprobante o creador..."
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
                            setCurrentRegistro({
                                idtipocompra: '',
                                fecharegistro: new Date().toISOString().split('T')[0],
                                numcomprobante: '',
                                descripcion: '',
                                monto: '',
                                observaciones: '',
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Registro
                    </Button>
                </div>
            </div>

            {/* Tabla con permisos de edición/eliminación */}
            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                <Table
                    aria-label="Tabla de registros de compra"
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
                        <TableColumn key="idcompra" width="80px">ID</TableColumn>
                        <TableColumn key="fecharegistro" width="120px">Fecha</TableColumn>
                        <TableColumn key="tipoCompra" width="150px">Tipo Doc</TableColumn>
                        <TableColumn key="numcomprobante" width="120px">Comprobante</TableColumn>
                        <TableColumn key="descripcion">Descripción</TableColumn>
                        <TableColumn key="monto" width="120px">Monto</TableColumn>
                        <TableColumn key="estado" width="100px">Estado</TableColumn>
                        <TableColumn key="creadoPor" width="120px">Creado por</TableColumn>
                        <TableColumn key="acciones" width="150px">Acciones</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={paginatedItems}
                        isLoading={loading}
                        loadingContent={<Spinner />}
                    >
                        {(item) => (
                            <TableRow key={item.idcompra}>
                                <TableCell>{item.idcompra}</TableCell>
                                <TableCell>
                                    {new Date(item.fecharegistro).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{item.tipoCompra?.descripcion || 'N/A'}</TableCell>
                                <TableCell>{item.numcomprobante}</TableCell>
                                <TableCell>{item.descripcion}</TableCell>
                                <TableCell>S/. {parseFloat(item.monto).toFixed(2)}</TableCell>
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
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onPress={() => {
                                                setCurrentRegistro({
                                                    idcompra: item.idcompra,
                                                    idtipocompra: item.idtipocompra,
                                                    fecharegistro: new Date(item.fecharegistro).toISOString().split('T')[0],
                                                    numcomprobante: item.numcomprobante,
                                                    descripcion: item.descripcion,
                                                    monto: item.monto.toString(),
                                                    observaciones: item.observaciones || '',
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
                                                onPress={() => handleDelete(item.idcompra)}
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
                    aria-label="Tabla de registros de compra (solo lectura)"
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
                        <TableColumn key="idcompra" width="80px">ID</TableColumn>
                        <TableColumn key="fecharegistro" width="120px">Fecha</TableColumn>
                        <TableColumn key="tipoCompra" width="150px">Tipo Doc</TableColumn>
                        <TableColumn key="numcomprobante" width="120px">Comprobante</TableColumn>
                        <TableColumn key="descripcion">Descripción</TableColumn>
                        <TableColumn key="monto" width="120px">Monto</TableColumn>
                        <TableColumn key="estado" width="100px">Estado</TableColumn>
                        <TableColumn key="creadoPor" width="120px">Creado por</TableColumn>
                    </TableHeader>
                    <TableBody
                        items={paginatedItems}
                        isLoading={loading}
                        loadingContent={<Spinner />}
                    >
                        {(item) => (
                            <TableRow key={item.idcompra}>
                                <TableCell>{item.idcompra}</TableCell>
                                <TableCell>
                                    {new Date(item.fecharegistro).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{item.tipoCompra?.descripcion || 'N/A'}</TableCell>
                                <TableCell>{item.numcomprobante}</TableCell>
                                <TableCell>{item.descripcion}</TableCell>
                                <TableCell>S/. {parseFloat(item.monto).toFixed(2)}</TableCell>
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
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}

            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentRegistro?.idcompra ? 'Editar Registro de Compra' : 'Nuevo Registro de Compra'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="registro-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Tipo de Documento */}
                                        <Select
                                            label="Tipo de Documento"
                                            placeholder="Seleccionar tipo"
                                            selectedKeys={currentRegistro.idtipocompra ? [currentRegistro.idtipocompra.toString()] : []}
                                            onSelectionChange={(keys) => {
                                                const selected = Array.from(keys)[0]
                                                setCurrentRegistro({
                                                    ...currentRegistro,
                                                    idtipocompra: selected
                                                })
                                            }}
                                            isRequired
                                        >
                                            {tiposDocumento.map((tipo) => (
                                                <SelectItem key={tipo.idtipodocumento} value={tipo.idtipodocumento}>
                                                    {tipo.descripcion}
                                                </SelectItem>
                                            ))}
                                        </Select>

                                        {/* Fecha de Registro */}
                                        <Input
                                            type="date"
                                            label="Fecha de Registro"
                                            value={currentRegistro.fecharegistro}
                                            onChange={(e) => setCurrentRegistro({
                                                ...currentRegistro,
                                                fecharegistro: e.target.value
                                            })}
                                            isRequired
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Número de Comprobante */}
                                        <Input
                                            label="Número de Comprobante"
                                            placeholder="Ej: F001-00001"
                                            value={currentRegistro.numcomprobante}
                                            onChange={(e) => setCurrentRegistro({
                                                ...currentRegistro,
                                                numcomprobante: e.target.value
                                            })}
                                            isRequired
                                        />

                                        {/* Monto */}
                                        <Input
                                            type="number"
                                            label="Monto"
                                            placeholder="0.00"
                                            step="0.01"
                                            min="0"
                                            value={currentRegistro.monto}
                                            onChange={(e) => setCurrentRegistro({
                                                ...currentRegistro,
                                                monto: e.target.value
                                            })}
                                            isRequired
                                        />
                                    </div>

                                    {/* Descripción */}
                                    <Input
                                        label="Descripción"
                                        placeholder="Descripción del gasto o compra"
                                        value={currentRegistro.descripcion}
                                        onChange={(e) => setCurrentRegistro({
                                            ...currentRegistro,
                                            descripcion: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Observaciones */}
                                    <Textarea
                                        label="Observaciones"
                                        placeholder="Observaciones adicionales (opcional)"
                                        value={currentRegistro.observaciones}
                                        onChange={(e) => setCurrentRegistro({
                                            ...currentRegistro,
                                            observaciones: e.target.value
                                        })}
                                        minRows={2}
                                    />

                                    {/* Estado */}
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            isSelected={currentRegistro.estado}
                                            onValueChange={(value) => setCurrentRegistro({
                                                ...currentRegistro,
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
                                    onPress={handleSubmit}
                                    isLoading={isSubmitting}
                                    form="registro-form"
                                >
                                    {currentRegistro?.idcompra ? 'Actualizar' : 'Crear'}
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}


