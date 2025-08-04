'use client'
import { useEffect, useState, useMemo, useCallback } from 'react'
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
    Divider,
    Select,
    SelectItem,
    Chip,
    Card,
    CardBody,
    CardHeader,
    Tooltip
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FaInfoCircle } from 'react-icons/fa'

import { formatDecimal } from '@/utils/numbers'
import { ensureValidDate } from '@/utils/date'

import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useSession } from '@/context/SessionContext'
export default function RegDeudaPage({ userRole }) {
    const isAdmin = userRole === 'ADMIN'
    const session = useSession()
    // Estados
    const [registros, setRegistros] = useState([])
    const [conceptos, setConceptos] = useState([])
    const [stands, setStands] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentRegistro, setCurrentRegistro] = useState({
        fechadeuda: new Date(),
        idconcepto_deuda: '',
        detalles: []
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [sortField, setSortField] = useState('fechadeuda')
    const [sortDirection, setSortDirection] = useState('desc')
    const rowsPerPage = 10

    // Definir columnas dinámicamente según el rol
    const columns = useMemo(() => {
        const baseColumns = [
            { key: "fechadeuda", label: "Fecha", width: "120px", allowsSorting: true },
            { key: "concepto", label: "Concepto", allowsSorting: true },
            { key: "total", label: "Total", width: "120px" },
            { key: "estado", label: "Estado", width: "100px" },
            { key: "creadoPor", label: "Creado por" },
            { key: "actualizadoPor", label: "Actualizado por" }
        ]

      
            baseColumns.push({ key: "acciones", label: "Acciones", width: "180px" })
        

        return baseColumns
    }, [isAdmin])

    // Función para renderizar celdas
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "fechadeuda":
                return format(new Date(item.fechadeuda), 'dd/MM/yyyy', { locale: es })
            case "concepto":
                return item.concepto.descripcion
            // En la función renderCell, modificar el caso "total":
            case "total":
                return (
                    <div className="flex items-center gap-1">
                        <Chip color="success" variant="flat">
                            S/. {formatDecimal(item.total)}
                        </Chip>
                        {item.detalles.some(d => d.mora > 0) && (
                            <Tooltip
                                content="Este registro incluye mora"
                                placement="top"
                                color="warning"
                                delay={300}
                                closeDelay={100}
                                classNames={{
                                    base: "max-w-[200px]",
                                    content: "text-white"
                                }}
                            >
                                <span className="cursor-pointer">
                                    <FaInfoCircle className="text-yellow-500" />
                                </span>
                            </Tooltip>
                        )}
                    </div>
                )
            case "estado":
                return (
                    <Chip color={item.estado ? "success" : "danger"}>
                        {item.estado ? "Activo" : "Inactivo"}
                    </Chip>
                )
            case "creadoPor":
                return (
                    <>
                        {item.createdBy?.username || 'N/A'}
                        <p className="text-xs text-gray-400">
                            {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                    </>
                )
            case "actualizadoPor":
                return (
                    <>
                        {item.updatedBy?.username || 'N/A'}
                        <p className="text-xs text-gray-400">
                            {format(new Date(item.updatedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                    </>
                )
            case "acciones":
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            onPress={() => initEdit(item)}
                        >
                            Editar
                        </Button>
                        {session.user.role === 'SUPERADMIN' && (
                            <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={() => handleDelete(item.idregdeuda)}
                            >
                                Eliminar
                            </Button>
                        )}
                          {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                            <Button
                                size="sm"
                                variant="flat"
                                color={item.estado ? "warning" : "success"}
                                onPress={() => toggleEstado(item.idregdeuda, item.estado)}
                            >
                                {item.estado ? "Desactivar" : "Activar"}
                            </Button>
                          )}
                    </div>
                ) 
            default:
                return null
        }
    }, [isAdmin])

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [registrosRes, conceptosRes, standsRes] = await Promise.all([
                fetch('/api/reg-deuda'),
                fetch('/api/conceptos-deuda'),
                fetch('/api/stands?includeClient=true')
            ])

            if (!registrosRes.ok) throw new Error('Error cargando registros')
            if (!conceptosRes.ok) throw new Error('Error cargando conceptos')
            if (!standsRes.ok) throw new Error('Error cargando stands')

            const registrosData = await registrosRes.json()
            const conceptosData = await conceptosRes.json()
            const standsData = await standsRes.json()

            setRegistros(registrosData)
            setConceptos(conceptosData.filter(c => c.estado && c.deuda))
            setStands(standsData)
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

    // Manejar ordenamiento
    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortDirection('asc')
        }
    }

    // Filtrar, ordenar y paginar
    const filteredItems = useMemo(() => {
        const filtered = registros.filter(registro =>
            registro.concepto.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
            format(new Date(registro.fechadeuda), 'dd/MM/yyyy', { locale: es }).includes(filter.toLowerCase())
        )

        // Ordenar los resultados
        return filtered.sort((a, b) => {
            let comparison = 0

            if (sortField === 'fechadeuda') {
                comparison = new Date(a.fechadeuda) - new Date(b.fechadeuda)
            } else if (sortField === 'concepto') {
                comparison = a.concepto.descripcion.localeCompare(b.concepto.descripcion)
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })
    }, [registros, filter, sortField, sortDirection])

    const paginatedItems = useMemo(() =>
        filteredItems.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        ),
        [filteredItems, page]
    )

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este registro?')) return

        try {
            console.log('Intentando eliminar reg-deuda con ID:', id)
            
            const res = await fetch(`/api/reg-deuda/${id}`, { method: 'DELETE' })
            console.log('Respuesta del servidor:', res.status, res.statusText)
            
            if (!res.ok) {
                const errorText = await res.text()
                console.error('Error del servidor:', errorText)
                throw new Error(errorText)
            }

            // Solo actualizar el estado local si la eliminación fue exitosa
            setRegistros(prev => prev.filter(r => r.idregdeuda !== id))
            toast.success('Registro eliminado correctamente')
        } catch (error) {
            console.error('Error completo:', error)
            toast.error('Error al eliminar registro: ' + error.message)
        }
    }

    const toggleEstado = async (idregdeuda, currentEstado) => {
        try {
            const newEstado = !currentEstado

            const res = await fetch(`/api/reg-deuda/${idregdeuda}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newEstado })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setRegistros(prev => prev.map(r =>
                r.idregdeuda === idregdeuda ? {
                    ...r,
                    estado: newEstado,
                    updatedBy: result.updatedBy
                } : r
            ))

            toast.success(`Estado cambiado a ${newEstado ? 'Activo' : 'Inactivo'}`)
        } catch (error) {
            toast.error('Error al cambiar estado')
            console.error('Error:', error)
        }
    }

    // Manejar cambios en montos y mora
    const handleMontoChange = (idstand, field, value) => {
        setCurrentRegistro(prev => {
            const detalles = [...prev.detalles]
            const index = detalles.findIndex(d => d.idstand === idstand)

            const valorNumerico = parseFloat(value) || 0
            const valorRedondeado = parseFloat(valorNumerico.toFixed(4))

            if (index >= 0) {
                detalles[index][field] = valorRedondeado
            } else {
                detalles.push({
                    idstand,
                    [field]: valorRedondeado,
                    monto: field === 'mora' ? 0 : valorRedondeado,
                    mora: field === 'monto' ? 0 : valorRedondeado
                })
            }

            return {
                ...prev,
                detalles
            }
        })
    }

    // Replicar monto general
    const handleMontoGeneralChange = (value) => {
        if (value === '') {
            setCurrentRegistro(prev => ({
                ...prev,
                detalles: []
            }))
            return
        }

        const monto = parseFloat(value) || 0
        const montoRedondeado = parseFloat(monto.toFixed(4))

        if (!isNaN(montoRedondeado)) {
            setCurrentRegistro(prev => ({
                ...prev,
                detalles: stands.map(stand => ({
                    idstand: stand.idstand,
                    monto: montoRedondeado,
                    mora: prev.detalles.find(d => d.idstand === stand.idstand)?.mora || 0
                }))
            }))
        }
    }

    // Replicar mora general
    const handleMoraGeneralChange = (value) => {
        if (value === '') {
            setCurrentRegistro(prev => ({
                ...prev,
                detalles: prev.detalles.map(d => ({
                    ...d,
                    mora: 0
                }))
            }))
            return
        }

        const mora = parseFloat(value) || 0
        const moraRedondeada = parseFloat(mora.toFixed(4))

        if (!isNaN(moraRedondeada)) {
            setCurrentRegistro(prev => ({
                ...prev,
                detalles: prev.detalles.length > 0
                    ? prev.detalles.map(d => ({
                        ...d,
                        mora: moraRedondeada
                    }))
                    : stands.map(stand => ({
                        idstand: stand.idstand,
                        monto: 0,
                        mora: moraRedondeada
                    }))
            }))
        }
    }

    // Calcular monto general
    const montoGeneral = useMemo(() => {
        if (currentRegistro.detalles.length === 0) return ''
        const firstMonto = currentRegistro.detalles[0].monto
        const allEqual = currentRegistro.detalles.every(d => d.monto === firstMonto)
        return allEqual ? firstMonto : ''
    }, [currentRegistro.detalles])

    // Calcular mora general
    const moraGeneral = useMemo(() => {
        if (currentRegistro.detalles.length === 0) return ''
        const firstMora = currentRegistro.detalles[0].mora || 0
        const allEqual = currentRegistro.detalles.every(d => (d.mora || 0) === firstMora)
        return allEqual ? firstMora : ''
    }, [currentRegistro.detalles])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentRegistro?.idregdeuda
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/reg-deuda/${currentRegistro.idregdeuda}`
                : '/api/reg-deuda'

            const detallesValidos = currentRegistro.detalles.map(d => ({
                idstand: d.idstand,
                monto: parseFloat(d.monto || 0),
                mora: parseFloat(d.mora || 0)
            }))

            const fechaValida = currentRegistro.fechadeuda instanceof Date
                ? currentRegistro.fechadeuda.toISOString()
                : new Date().toISOString()

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fechadeuda: fechaValida,
                    idconcepto_deuda: currentRegistro.idconcepto_deuda,
                    detalles: detallesValidos
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()
            setRegistros(prev => isEditing
                ? prev.map(r => r.idregdeuda === result.idregdeuda ? result : r)
                : [...prev, result]
            )

            toast.success(isEditing ? 'Registro actualizado' : 'Registro creado')
            onOpenChange()
        } catch (error) {
            toast.error('Error al guardar')
            console.error('Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const initEdit = (registro) => {
        const fechaDeuda = new Date(registro.fechadeuda)
        fechaDeuda.setHours(12, 0, 0, 0)

        setCurrentRegistro({
            idregdeuda: registro.idregdeuda,
            fechadeuda: fechaDeuda,
            idconcepto_deuda: registro.idconcepto_deuda,
            detalles: registro.detalles.map(d => ({
                idstand: d.idstand,
                monto: d.monto,
                mora: d.mora || 0
            }))
        })
        onOpen()
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
                <h1 className="text-2xl font-bold text-white">Registros de Deuda</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por concepto o fecha..."
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
                            setCurrentRegistro({
                                fechadeuda: new Date(),
                                idconcepto_deuda: '',
                                detalles: []
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Registro
                    </Button>
                </div>
            </div>

            <Table
                aria-label="Tabla de registros de deuda"
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
                sortDescriptor={{
                    column: sortField,
                    direction: sortDirection === 'asc' ? 'ascending' : 'descending'
                }}
                onSortChange={(descriptor) => {
                    if (descriptor.column) {
                        handleSort(descriptor.column)
                    }
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn
                            key={column.key}
                            width={column.width}
                            allowsSorting={column.allowsSorting}
                        >
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody items={paginatedItems}>
                    {(item) => (
                        <TableRow key={item.idregdeuda}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="5xl"
                scrollBehavior="inside"
            >
                <ModalContent className="h-[95vh]" style={{ maxWidth: "90rem", justifyContent: "center" }}>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentRegistro?.idregdeuda ? 'Editar Registro' : 'Nuevo Registro'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="registro-form" onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader className="font-bold">Cabecera</CardHeader>
                                            <CardBody className="space-y-4">
                                                <DatePicker
                                                    selected={ensureValidDate(currentRegistro.fechadeuda)}
                                                    onChange={(date) => {
                                                        const adjustedDate = new Date(date)
                                                        adjustedDate.setHours(12, 0, 0, 0)
                                                        setCurrentRegistro({
                                                            ...currentRegistro,
                                                            fechadeuda: adjustedDate
                                                        })
                                                    }}
                                                    dateFormat="dd/MM/yyyy"
                                                    className="w-full p-2 border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                                    placeholderText="Seleccione una fecha"
                                                    showYearDropdown
                                                    dropdownMode="select"
                                                />

                                                <Select
                                                    label="Concepto"
                                                    placeholder="Seleccione un concepto"
                                                    selectedKeys={currentRegistro.idconcepto_deuda ? [currentRegistro.idconcepto_deuda.toString()] : []}
                                                    onChange={(e) => setCurrentRegistro({
                                                        ...currentRegistro,
                                                        idconcepto_deuda: e.target.value ? parseInt(e.target.value) : ''
                                                    })}
                                                    isRequired
                                                >
                                                    {conceptos.map(concepto => (
                                                        <SelectItem
                                                            key={concepto.idconcepto.toString()}
                                                            value={concepto.idconcepto.toString()}
                                                        >
                                                            {concepto.descripcion}
                                                        </SelectItem>
                                                    ))}
                                                </Select>

                                                <Input
                                                    label="Monto General (S/.)"
                                                    type="number"
                                                    min="0"
                                                    step="0.0001"
                                                    value={montoGeneral}
                                                    onChange={(e) => handleMontoGeneralChange(e.target.value)}
                                                    startContent={<span className="text-default-400 text-small">S/.</span>}
                                                />

                                                <Input
                                                    label="Mora General (S/.)"
                                                    type="number"
                                                    min="0"
                                                    step="0.0001"
                                                    value={moraGeneral}
                                                    onChange={(e) => handleMoraGeneralChange(e.target.value)}
                                                    startContent={<span className="text-default-400 text-small">S/.</span>}
                                                    description="Mora que se sumará al monto principal"
                                                />
                                            </CardBody>
                                        </Card>

                                        <Card>
                                            <CardHeader className="font-bold">Detalle de Deuda</CardHeader>
                                            <CardBody>
                                                <div className="overflow-auto max-h-96">
                                                    <Table aria-label="Tabla de detalles">
                                                        <TableHeader>
                                                            <TableColumn>Stand</TableColumn>
                                                            <TableColumn>Cliente</TableColumn>
                                                            <TableColumn width="150px">Monto (S/.)</TableColumn>
                                                            <TableColumn width="150px">Mora (S/.)</TableColumn>
                                                            <TableColumn width="150px">Total (S/.)</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {stands.map(stand => {
                                                                const detalle = currentRegistro.detalles.find(d => d.idstand === stand.idstand) || {}
                                                                const total = (parseFloat(detalle.monto || 0) + parseFloat(detalle.mora || 0)).toFixed(4)

                                                                return (
                                                                    <TableRow key={stand.idstand}>
                                                                        <TableCell>{stand.descripcion}</TableCell>
                                                                        <TableCell>{stand.client?.nombre || 'Sin asignar'}</TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.0001"
                                                                                value={detalle.monto || ''}
                                                                                onChange={(e) => handleMontoChange(stand.idstand, 'monto', e.target.value)}
                                                                                startContent={<span className="text-default-400 text-small">S/.</span>}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.0001"
                                                                                value={detalle.mora || ''}
                                                                                onChange={(e) => handleMontoChange(stand.idstand, 'mora', e.target.value)}
                                                                                startContent={<span className="text-default-400 text-small">S/.</span>}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            S/. {formatDecimal(total)}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                {session.user.role === 'ADMIN' && ( <Button
                                    color="primary"
                                    type="submit"
                                    form="registro-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentRegistro?.idregdeuda ? 'Guardar' : 'Crear'}
                                </Button>)}

                                {session.user.role === 'USER' &&  !currentRegistro.idregdeuda &&( <Button
                                    color="primary"
                                    type="submit"
                                    form="registro-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentRegistro?.idregdeuda ? 'Guardar' : 'Crear'}
                                </Button>)}

                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}