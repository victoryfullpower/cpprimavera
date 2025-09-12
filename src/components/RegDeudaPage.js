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
    Tooltip,
    Switch,
    Autocomplete,
    AutocompleteItem,
    Popover,
    PopoverTrigger,
    PopoverContent
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { FaInfoCircle } from 'react-icons/fa'

import { formatDecimal } from '@/utils/numbers'
import { ensureValidDate } from '@/utils/date'
import EditIcon from '@/components/iconos/EditIcon'
import DeleteIcon from '@/components/iconos/DeleteIcon'
import PowerIcon from '@/components/iconos/PowerIcon'

import { useSession } from '@/context/SessionContext'

export default function RegDeudaPage({ userRole }) {
    const session = useSession()
    
    // Estados
    const [detalles, setDetalles] = useState([])
    const [conceptos, setConceptos] = useState([])
    const [stands, setStands] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [yearFilter, setYearFilter] = useState('all')
    const [pisoFilter, setPisoFilter] = useState('all')
    const [pisoFilterModal, setPisoFilterModal] = useState('all')
    const [selectedStands, setSelectedStands] = useState(new Set())
    const [showOnlySelected, setShowOnlySelected] = useState(false)
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const { isOpen: isLoteOpen, onOpen: onLoteOpen, onOpenChange: onLoteOpenChange } = useDisclosure()
    const { isOpen: isYearOpen, onOpen: onYearOpen, onOpenChange: onYearOpenChange } = useDisclosure()
    const { isOpen: isPisoOpen, onOpen: onPisoOpen, onOpenChange: onPisoOpenChange } = useDisclosure()
    const [currentDetalle, setCurrentDetalle] = useState({
        idconcepto_deuda: '',
        idstand: '',
        fechadeudaStand: new Date(),
        monto: 0,
        mora: 0,
        estado: false, // Las deudas nuevas deben ser pendientes
        idinquilino_activo: null
    })
    const [loteData, setLoteData] = useState({
        fechadeudaStand: new Date(),
        idconcepto_deuda: '',
        montoGeneral: 0,
        moraGeneral: 0,
        detalles: []
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoteSubmitting, setIsLoteSubmitting] = useState(false)
    const [inquilinoPaga, setInquilinoPaga] = useState(false)
    const [inquilinoActivo, setInquilinoActivo] = useState(null)
    const [inquilinosActivos, setInquilinosActivos] = useState({}) // Para almacenar inquilinos activos por stand
    const [inquilinosBorrados, setInquilinosBorrados] = useState({}) // Para almacenar inquilinos borrados por stand
    const [sortField, setSortField] = useState('createdAt')
    const [sortDirection, setSortDirection] = useState('desc')
    const [rowsPerPage, setRowsPerPage] = useState(10)

    // Opciones para registros por página
    const rowsPerPageOptions = [
        { key: "10", label: "10" },
        { key: "25", label: "25" },
        { key: "50", label: "50" },
        { key: "100", label: "100" },
        { key: "all", label: "Todos" }
    ]

    // Generar años disponibles para el filtro (desde 2000 hasta 2050)
    const availableYears = useMemo(() => {
        const years = []
        for (let year = 2000; year <= 2050; year++) {
            years.push(year.toString())
        }
        return years
    }, [])

    // Generar pisos disponibles para el filtro
    const availablePisos = useMemo(() => {
        const pisos = [...new Set(stands.map(stand => stand.nivel))].sort((a, b) => a - b)
        return pisos.map(piso => piso.toString())
    }, [stands])

    // Resetear selección cuando cambie el filtro de piso
    useEffect(() => {
        console.log('🔄 Reseteando selección por cambio de piso:', pisoFilter)
        setSelectedStands(new Set())
        setShowOnlySelected(false)
    }, [pisoFilter])

    // Calcular estado del checkbox maestro
    const masterCheckboxState = useMemo(() => {
        const visibleStands = stands.filter(stand => 
            (pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal) &&
            (!showOnlySelected || selectedStands.has(stand.idstand))
        )
        
        if (visibleStands.length === 0) return { checked: false, indeterminate: false }
        
        const selectedCount = visibleStands.filter(stand => selectedStands.has(stand.idstand)).length
        
        console.log('🔍 Master checkbox state:', {
            pisoFilter,
            visibleStandsCount: visibleStands.length,
            selectedCount,
            selectedStands: Array.from(selectedStands),
            checked: selectedCount === visibleStands.length,
            indeterminate: selectedCount > 0 && selectedCount < visibleStands.length
        })
        
        return {
            checked: selectedCount === visibleStands.length,
            indeterminate: selectedCount > 0 && selectedCount < visibleStands.length
        }
    }, [stands, pisoFilterModal, showOnlySelected, selectedStands])

    // Manejar el estado indeterminate del checkbox maestro
    useEffect(() => {
        const masterCheckbox = document.querySelector('input[type="checkbox"]:first-of-type')
        if (masterCheckbox) {
            masterCheckbox.indeterminate = masterCheckboxState.indeterminate
        }
    }, [masterCheckboxState.indeterminate])

    // Definir columnas dinámicamente según el rol
    const columns = useMemo(() => {
        const baseColumns = [
            { key: 'idstand', label: 'Stand', sortable: true },
            { key: 'cliente', label: 'Cliente', sortable: true },
            { key: 'concepto', label: 'Concepto', sortable: true },
            { key: 'fechadeudaStand', label: 'Fecha Deuda', sortable: true },
            { key: 'monto', label: 'Monto', sortable: true },
            { key: 'mora', label: 'Mora', sortable: true },
            { key: 'total', label: 'Total', sortable: true },
            { key: 'estado', label: 'Estado', sortable: true },
            { key: 'inquilino', label: 'Inquilino', sortable: true },
            { key: 'createdAt', label: 'Creado', sortable: true },
            { key: 'createdBy', label: 'Creado por', sortable: true }
        ]

        if (userRole === 'SUPERADMIN') {
            return [...baseColumns, { key: 'acciones', label: 'Acciones', sortable: false }]
        } else if (userRole === 'ADMIN') {
            return [...baseColumns, { key: 'acciones', label: 'Acciones', sortable: false }]
        } else {
        return baseColumns
        }
    }, [userRole])

    // Función para obtener el valor de una celda
    const getCellValue = useCallback((item, columnKey) => {
        switch (columnKey) {
            case 'idstand':
                return item.stand?.descripcion || 'N/A'
            case 'cliente':
                return item.stand?.client?.nombre || 'N/A'
            case 'concepto':
                return item.concepto?.descripcion || 'N/A'
            case 'fechadeudaStand':
                return format(new Date(item.fechadeudaStand), 'dd/MM/yyyy', { locale: es })
            case 'monto':
                return formatDecimal(item.monto)
            case 'mora':
                return formatDecimal(item.mora)
            case 'total':
                return formatDecimal(item.monto + item.mora)
            case 'estado':
                return item.estado ? 'Activo' : 'Inactivo'
            case 'inquilino':
                return item.inquilino_activo?.nombre || 'Sin inquilino'
            case 'createdAt':
                return format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
            case 'createdBy':
                return item.createdBy?.username || 'N/A'
            default:
                return 'N/A'
        }
    }, [])

    // Función para ordenar los datos
    const sortData = useCallback((data) => {
        if (!sortField) return data

        return [...data].sort((a, b) => {
            let aValue = getCellValue(a, sortField)
            let bValue = getCellValue(b, sortField)

            // Convertir a números si es posible
            if (sortField === 'monto' || sortField === 'mora' || sortField === 'total') {
                aValue = parseFloat(aValue.replace(/[^\d.-]/g, '')) || 0
                bValue = parseFloat(bValue.replace(/[^\d.-]/g, '')) || 0
            } else if (sortField === 'fechadeudaStand' || sortField === 'createdAt') {
                aValue = new Date(a[sortField])
                bValue = new Date(b[sortField])
            } else if (sortField === 'idstand') {
                aValue = parseInt(aValue) || 0
                bValue = parseInt(bValue) || 0
            }

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1
            }
            return 0
        })
    }, [sortField, sortDirection, getCellValue])

    // Filtrar y ordenar datos
    const filteredAndSortedItems = useMemo(() => {
        let filtered = detalles.filter(detalle => {
            const matchesFilter = !filter || 
                detalle.stand?.descripcion?.toLowerCase().includes(filter.toLowerCase()) ||
                detalle.stand?.client?.nombre?.toLowerCase().includes(filter.toLowerCase()) ||
                detalle.concepto?.descripcion?.toLowerCase().includes(filter.toLowerCase()) ||
                detalle.inquilino_activo?.nombre?.toLowerCase().includes(filter.toLowerCase())

            const matchesYear = yearFilter === 'all' || 
                format(new Date(detalle.fechadeudaStand), 'yyyy') === yearFilter

            const matchesPiso = pisoFilter === 'all' || 
                detalle.stand?.nivel?.toString() === pisoFilter

            return matchesFilter && matchesYear && matchesPiso
        })

        return sortData(filtered)
    }, [detalles, filter, yearFilter, pisoFilter, sortData])

    // Paginar datos
    const paginatedItems = useMemo(() => {
        const result = rowsPerPage === 'all' 
            ? filteredAndSortedItems 
            : filteredAndSortedItems.slice((page - 1) * rowsPerPage, page * rowsPerPage)
        
        return result
    }, [filteredAndSortedItems, page, rowsPerPage])

    // Resetear página cuando cambie rowsPerPage
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value === 'all' ? 'all' : parseInt(value))
        setPage(1)
    }

    // Funciones para manejar selección de stands
    const toggleStandSelection = (standId) => {
        console.log('🔄 Toggle stand selection:', standId)
        setSelectedStands(prev => {
            const newSet = new Set(prev)
            if (newSet.has(standId)) {
                newSet.delete(standId)
                console.log('❌ Removido stand:', standId)
            } else {
                newSet.add(standId)
                console.log('✅ Agregado stand:', standId)
            }
            console.log('📋 Nueva selección:', Array.from(newSet))
            return newSet
        })
    }

    const selectAllStands = () => {
        const visibleStands = stands.filter(stand => 
            pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal
        )
        console.log('✅ Seleccionando todos los stands visibles:', visibleStands.map(s => s.idstand))
        setSelectedStands(new Set(visibleStands.map(stand => stand.idstand)))
    }

    const deselectAllStands = () => {
        console.log('❌ Deseleccionando todos los stands')
        setSelectedStands(new Set())
    }

    const invertStandSelection = () => {
        const visibleStands = stands.filter(stand => 
            pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal
        )
        const visibleStandIds = new Set(visibleStands.map(stand => stand.idstand))
        const newSelection = new Set()
        
        // Agregar stands que no están seleccionados
        visibleStandIds.forEach(id => {
            if (!selectedStands.has(id)) {
                newSelection.add(id)
            }
        })
        
        setSelectedStands(newSelection)
    }

    // Función para editar un detalle
    const initEdit = (detalle) => {
        console.log('=== INIT EDIT ===')
        console.log('Detalle recibido:', detalle)
        console.log('idinquilino_activo del detalle:', detalle.idinquilino_activo)
        console.log('inquilino_activo del detalle:', detalle.inquilino_activo)
        
        setCurrentDetalle({
            idregdeuda_detalle: detalle.idregdeuda_detalle,
            idconcepto_deuda: parseInt(detalle.idconcepto_deuda),
            idstand: parseInt(detalle.idstand),
            fechadeudaStand: new Date(detalle.fechadeudaStand),
            monto: parseFloat(detalle.monto),
            mora: parseFloat(detalle.mora || 0),
            estado: Boolean(detalle.estado),
            idinquilino_activo: detalle.idinquilino_activo || null
        })
        
        // Configurar el toggle según si el concepto tiene inquilinopaga = true
        const concepto = conceptos.find(c => c.idconcepto === parseInt(detalle.idconcepto_deuda));
        const conceptoPermiteInquilino = !!concepto?.inquilinopaga;
        console.log('Concepto encontrado:', concepto);
        console.log('¿Concepto permite inquilino?', conceptoPermiteInquilino);
        console.log('Configurando toggle inquilino paga:', conceptoPermiteInquilino);
        setInquilinoPaga(conceptoPermiteInquilino);
        
        // Si el concepto no permite inquilino, limpiar el idinquilino_activo
        if (!conceptoPermiteInquilino) {
            setCurrentDetalle(prev => ({
                ...prev,
                idinquilino_activo: null
            }));
        }
        
        setInquilinoActivo(detalle.inquilino_activo || null);
        
        console.log('=== FIN INIT EDIT ===')
        onOpen()
    }

    // Función para renderizar celdas
    const renderCell = useCallback((item, columnKey) => {
        switch (columnKey) {
            case "idstand":
                return item.stand?.descripcion || 'N/A'
            case "cliente":
                return item.stand?.client?.nombre || 'N/A'
            case "concepto":
                return item.concepto?.descripcion || 'N/A'
            case "fechadeudaStand":
                return format(new Date(item.fechadeudaStand), 'dd/MM/yyyy', { locale: es })
            case "monto":
                return (
                    <Chip color="primary" variant="flat">
                        S/. {formatDecimal(item.monto)}
                    </Chip>
                )
            case "mora":
                return item.mora > 0 ? (
                    <Chip color="warning" variant="flat">
                        S/. {formatDecimal(item.mora)}
                    </Chip>
                ) : (
                    <span className="text-gray-400">-</span>
                )
            case "total":
                const total = Number(item.monto) + Number(item.mora || 0)
                return (
                    <Chip color="success" variant="flat">
                        S/. {formatDecimal(total)}
                    </Chip>
                )
            case "estado":
                return (
                    <Chip color={item.estado ? "success" : "danger"}>
                        {item.estado ? "Pagado" : "Pendiente"}
                    </Chip>
                )
            case "inquilino":
                return item.inquilino_activo ? (
                    <Chip color="success" variant="flat" size="sm">
                        {item.inquilino_activo.nombre}
                    </Chip>
                ) : (
                    <span className="text-gray-400 text-sm">Sin inquilino</span>
                )
            case "createdAt":
                return format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
            case "createdBy":
                return item.createdBy?.username || 'N/A'
            case "acciones":
                return (
                    <div className="flex gap-2">
                        {/* Botón Editar visible para todos los roles */}
                        <Tooltip content="Editar" color="primary">
                            <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                onPress={() => initEdit(item)}
                            >
                                <EditIcon className="text-lg text-primary" />
                            </Button>
                        </Tooltip>
                        
                        {/* Botones de administración solo para ADMIN y SUPERADMIN */}
                        {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                            <Tooltip content={item.estado ? "Desactivar" : "Activar"} color={item.estado ? "warning" : "success"}>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => toggleEstado(item.idregdeuda_detalle, item.estado)}
                                >
                                    <PowerIcon className={`text-lg ${item.estado ? "text-warning" : "text-success"}`} />
                                </Button>
                            </Tooltip>
                        )}
                        
                        {session.user.role === 'SUPERADMIN' && (
                            <Tooltip content="Eliminar" color="danger">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleDelete(item.idregdeuda_detalle)}
                                >
                                    <DeleteIcon className="text-lg text-danger" />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                )
            default:
                return null
        }
    }, [session.user.role, initEdit])

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [detallesRes, conceptosRes, standsRes] = await Promise.all([
                fetch('/api/reg-deuda-detalle'),
                fetch('/api/conceptos-deuda'),
                fetch('/api/stands?includeClient=true')
            ])

            if (!detallesRes.ok) throw new Error('Error cargando detalles de deuda')
            if (!conceptosRes.ok) throw new Error('Error cargando conceptos')
            if (!standsRes.ok) throw new Error('Error cargando stands')

            const detallesData = await detallesRes.json()
            const conceptosData = await conceptosRes.json()
            const standsData = await standsRes.json()

            setDetalles(detallesData)
            setConceptos(conceptosData.filter(c => c.estado && c.deuda))
            setStands(standsData)
            console.log('Stands cargados:', standsData)
            console.log('Detalles de deuda cargados:', detallesData)
            console.log('Total de detalles cargados:', detallesData.length)
            console.log('Ejemplo de inquilino_activo:', detallesData[0]?.inquilino_activo)
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

    // Función para obtener inquilinos activos de todos los stands
    const fetchInquilinosActivos = useCallback(async () => {
        if (!loteData.idconcepto_deuda) return
        
        try {
            const concepto = conceptos.find(c => c.idconcepto === loteData.idconcepto_deuda)
            if (!concepto?.inquilinopaga) {
                setInquilinosActivos({})
                setInquilinosBorrados({}) // Limpiar inquilinos borrados cuando no es inquilinopaga
                return
            }

            const inquilinosData = {}
            for (const stand of stands) {
                try {
                    const response = await fetch(`/api/inquilino-stand?idstand=${stand.idstand}`)
                    if (response.ok) {
                        const data = await response.json()
                        const inquilinoActivo = data.find(item => item.actual)
                        if (inquilinoActivo) {
                            inquilinosData[stand.idstand] = inquilinoActivo.inquilino
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching inquilino for stand ${stand.idstand}:`, error)
                }
            }
            setInquilinosActivos(inquilinosData)
        } catch (error) {
            console.error('Error fetching inquilinos activos:', error)
        }
    }, [loteData.idconcepto_deuda, conceptos, stands])

    // Función para quitar inquilino de un stand específico
    const removeInquilinoFromStand = (idstand) => {
        setInquilinosActivos(prev => {
            const newState = { ...prev }
            // Guardar el inquilino borrado antes de eliminarlo
            if (newState[idstand]) {
                setInquilinosBorrados(prevBorrados => ({
                    ...prevBorrados,
                    [idstand]: newState[idstand]
                }))
            }
            delete newState[idstand]
            return newState
        })
    }

    // Función para restaurar inquilino de un stand específico
    const restoreInquilinoFromStand = (idstand) => {
        setInquilinosBorrados(prev => {
            const newState = { ...prev }
            // Restaurar el inquilino borrado
            if (newState[idstand]) {
                setInquilinosActivos(prevActivos => ({
                    ...prevActivos,
                    [idstand]: newState[idstand]
                }))
            }
            delete newState[idstand]
            return newState
        })
    }

    // Efecto para obtener inquilinos activos cuando cambie el concepto
    useEffect(() => {
        if (loteData.idconcepto_deuda && stands.length > 0) {
            fetchInquilinosActivos()
        }
    }, [loteData.idconcepto_deuda, stands, fetchInquilinosActivos])

    // Efecto para sincronizar el toggle inquilino paga con el currentDetalle
    useEffect(() => {
        if (currentDetalle.idregdeuda_detalle) { // Solo cuando se está editando
            console.log('=== USEEFFECT SINCRONIZACIÓN ===')
            console.log('Toggle inquilino paga:', inquilinoPaga)
            console.log('Inquilino activo:', inquilinoActivo)
            console.log('Stand seleccionado:', currentDetalle.idstand)
            console.log('ID inquilino activo:', inquilinoActivo?.idinquilino)
            
            if (inquilinoPaga && currentDetalle.idstand && inquilinoActivo) {
                console.log('Actualizando currentDetalle con inquilino activo:', inquilinoActivo.idinquilino)
                setCurrentDetalle(prev => ({
                    ...prev,
                    idinquilino_activo: inquilinoActivo.idinquilino
                }))
            } else if (!inquilinoPaga) {
                console.log('Desactivando inquilino activo')
                setCurrentDetalle(prev => ({
                    ...prev,
                    idinquilino_activo: null
                }))
            }
            console.log('=== FIN USEEFFECT ===')
        }
    }, [inquilinoPaga, inquilinoActivo, currentDetalle.idstand, currentDetalle.idregdeuda_detalle])


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
        const filtered = detalles.filter(detalle => {
            // Filtro por año
            const detalleYear = new Date(detalle.fechadeudaStand).getFullYear().toString()
            const yearMatches = yearFilter === 'all' || yearFilter === '' || detalleYear === yearFilter
            
            // Filtro por texto
            const textMatches = 
                detalle.concepto?.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
                detalle.stand?.descripcion.toLowerCase().includes(filter.toLowerCase()) ||
                detalle.stand?.client?.nombre.toLowerCase().includes(filter.toLowerCase()) ||
                (detalle.inquilino_activo?.nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
                format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es }).includes(filter.toLowerCase())
            
            return yearMatches && textMatches
        })

        // Ordenar los resultados
        return filtered.sort((a, b) => {
            let comparison = 0

            if (sortField === 'fechadeudaStand') {
                comparison = new Date(a.fechadeudaStand) - new Date(b.fechadeudaStand)
            } else if (sortField === 'concepto') {
                comparison = (a.concepto?.descripcion || '').localeCompare(b.concepto?.descripcion || '')
            } else if (sortField === 'stand') {
                comparison = (a.stand?.descripcion || '').localeCompare(b.stand?.descripcion || '')
            } else if (sortField === 'inquilino') {
                comparison = (a.inquilino_activo?.nombre || '').localeCompare(b.inquilino_activo?.nombre || '')
            } else if (sortField === 'monto') {
                comparison = Number(a.monto) - Number(b.monto)
            } else if (sortField === 'createdAt') {
                comparison = new Date(a.createdAt) - new Date(b.createdAt)
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })
    }, [detalles, filter, yearFilter, sortField, sortDirection])



    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este detalle de deuda?')) return

        try {
            console.log('Intentando eliminar detalle con ID:', id)
            
            const res = await fetch(`/api/reg-deuda-detalle/${id}`, { method: 'DELETE' })
            console.log('Respuesta del servidor:', res.status, res.statusText)
            
            if (!res.ok) {
                const errorText = await res.text()
                console.error('Error del servidor:', errorText)
                throw new Error(errorText)
            }

            setDetalles(prev => prev.filter(d => d.idregdeuda_detalle !== id))
            toast.success('Detalle de deuda eliminado correctamente')
        } catch (error) {
            console.error('Error completo:', error)
            toast.error('Error al eliminar detalle: ' + error.message)
        }
    }

    const toggleEstado = async (id, currentEstado) => {
        try {
            const newEstado = !currentEstado

            const res = await fetch(`/api/reg-deuda-detalle/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: newEstado })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setDetalles(prev => prev.map(d =>
                d.idregdeuda_detalle === id ? {
                    ...d,
                    estado: newEstado,
                    updatedBy: result.updatedBy
                } : d
            ))

            toast.success(`Estado cambiado a ${newEstado ? 'Activo' : 'Inactivo'}`)
        } catch (error) {
            toast.error('Error al cambiar estado')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Validación: Si "Inquilino Paga" está activado, el stand es requerido
        if (inquilinoPaga && !currentDetalle.idstand) {
            toast.error('Debe seleccionar un stand para activar "Inquilino Paga"')
            return
        }
        
        setIsSubmitting(true)

        try {
            const isEditing = !!currentDetalle?.idregdeuda_detalle
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/reg-deuda-detalle/${currentDetalle.idregdeuda_detalle}`
                : '/api/reg-deuda-detalle'

            // Determinar el idinquilino_activo basado en el toggle y el inquilino activo
            let idinquilino_activo = null
            if (inquilinoPaga && currentDetalle.idstand && inquilinoActivo) {
                idinquilino_activo = inquilinoActivo.idinquilino
            }

            const detalleData = {
                idconcepto_deuda: parseInt(currentDetalle.idconcepto_deuda),
                idstand: parseInt(currentDetalle.idstand),
                fechadeudaStand: currentDetalle.fechadeudaStand,
                monto: parseFloat(currentDetalle.monto),
                mora: parseFloat(currentDetalle.mora || 0),
                estado: currentDetalle.estado,
                idinquilino_activo: idinquilino_activo
            }
            
            console.log('=== DEBUGGING INQUILINO ===')
            console.log('Toggle inquilino paga:', inquilinoPaga)
            console.log('Inquilino activo completo:', inquilinoActivo)
            console.log('ID inquilino activo:', inquilinoActivo?.idinquilino)
            console.log('Stand seleccionado:', currentDetalle.idstand)
            console.log('Datos a enviar:', detalleData)
            console.log('Campo idinquilino_activo en detalleData:', detalleData.idinquilino_activo)
            console.log('Tipo de idinquilino_activo:', typeof detalleData.idinquilino_activo)
            console.log('=== FIN DEBUGGING ===')

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(detalleData)
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()
            
            console.log('=== RESPUESTA DE LA API ===')
            console.log('Respuesta completa:', result)
            console.log('Campo idinquilino_activo en respuesta:', result.idinquilino_activo)
            console.log('Tipo de idinquilino_activo en respuesta:', typeof result.idinquilino_activo)
            console.log('=== FIN RESPUESTA ===')

            setDetalles(prev => {
                const newDetalles = isEditing
                    ? prev.map(d => {
                        if (d.idregdeuda_detalle === result.idregdeuda_detalle) {
                            // Asegurarse de que el resultado incluya la información del inquilino activo
                            return {
                                ...result,
                                inquilino_activo: result.idinquilino_activo ? inquilinoActivo : null
                            }
                        }
                        return d
                    })
                    : [...prev, result]
                
                console.log('Estado actualizado:', newDetalles)
                return newDetalles
            })

            toast.success(
                isEditing
                    ? 'Detalle de deuda actualizado correctamente'
                    : 'Detalle de deuda creado correctamente'
            )
            onOpenChange()
        } catch (error) {
            toast.error('Error al guardar los cambios')
            console.error('Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const initCreate = () => {
        setCurrentDetalle({
            idconcepto_deuda: '',
            idstand: '',
            fechadeudaStand: new Date(),
            monto: 0,
            mora: 0,
            estado: false, // Las deudas nuevas deben ser pendientes
            idinquilino_activo: null
        })
        setInquilinoPaga(false)
        setInquilinoActivo(null)
        onOpen()
    }

    const initCreateLote = () => {
        console.log('🆕 Iniciando nuevo lote - reseteando todo')
        setLoteData({
            fechadeudaStand: new Date(),
            idconcepto_deuda: '',
            montoGeneral: 0,
            moraGeneral: 0,
            detalles: []
        })
        setInquilinosActivos({}) // Limpiar inquilinos activos
        setInquilinosBorrados({}) // Limpiar inquilinos borrados
        setSelectedStands(new Set()) // Resetear selección de stands
        setShowOnlySelected(false) // Resetear filtro de vista
        setPisoFilter('all') // Resetear filtro de piso también
        setPisoFilterModal('all') // Resetear filtro de piso del modal
        onLoteOpen()
    }

    const handleLoteModalClose = () => {
        console.log('❌ Cerrando modal - reseteando todo')
        setSelectedStands(new Set()) // Resetear selección de stands
        setShowOnlySelected(false) // Resetear filtro de vista
        setPisoFilter('all') // Resetear filtro de piso también
        setPisoFilterModal('all') // Resetear filtro de piso del modal
        onLoteOpenChange()
    }



    // Manejar cambios en montos y mora del lote
    const handleMontoChange = (idstand, field, value) => {
        setLoteData(prev => {
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
            setLoteData(prev => ({
                ...prev,
                detalles: []
            }))
            return
        }

        const monto = parseFloat(value) || 0
        const montoRedondeado = parseFloat(monto.toFixed(4))

        if (!isNaN(montoRedondeado)) {
        // Aplicar a todos los stands del piso filtrado
        const standsToUpdate = stands.filter(stand => 
            pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal
        )
            setLoteData(prev => ({
                ...prev,
            detalles: standsToUpdate.map(stand => ({
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
            setLoteData(prev => ({
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
            // Aplicar a todos los stands del piso filtrado
            const standsToUpdate = stands.filter(stand => 
                pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal
            )
            setLoteData(prev => ({
                ...prev,
                detalles: prev.detalles.length > 0
                    ? prev.detalles.map(d => ({
                        ...d,
                        mora: moraRedondeada
                    }))
                    : standsToUpdate.map(stand => ({
                        idstand: stand.idstand,
                        monto: 0,
                        mora: moraRedondeada
                    }))
            }))
        }
    }

    // Calcular monto general
    const montoGeneral = useMemo(() => {
        if (loteData.detalles.length === 0) return ''
        const firstMonto = loteData.detalles[0].monto
        const allEqual = loteData.detalles.every(d => d.monto === firstMonto)
        return allEqual ? firstMonto : ''
    }, [loteData.detalles])

    // Calcular mora general
    const moraGeneral = useMemo(() => {
        if (loteData.detalles.length === 0) return ''
        const firstMora = loteData.detalles[0].mora || 0
        const allEqual = loteData.detalles.every(d => (d.mora || 0) === firstMora)
        return allEqual ? firstMora : ''
    }, [loteData.detalles])

    const handleSubmitLote = async (e) => {
        e.preventDefault()
        setIsLoteSubmitting(true)

        try {
            // Solo procesar stands seleccionados
            const detallesValidos = loteData.detalles
                .filter(d => selectedStands.has(d.idstand)) // Solo stands seleccionados
                .filter(d => d.monto > 0 || d.mora > 0) // Con monto o mora

            if (detallesValidos.length === 0) {
                toast.error('Debe seleccionar al menos un stand y ingresar monto o mora')
                return
            }

            // Crear múltiples detalles de deuda
            const promises = detallesValidos.map(async detalle => {
                // Obtener el inquilino activo del estado local
                const concepto = conceptos.find(c => c.idconcepto === loteData.idconcepto_deuda)
                const idinquilino_activo = concepto?.inquilinopaga ? inquilinosActivos[detalle.idstand]?.idinquilino || null : null

                return fetch('/api/reg-deuda-detalle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idconcepto_deuda: parseInt(loteData.idconcepto_deuda),
                        idstand: parseInt(detalle.idstand),
                        fechadeudaStand: loteData.fechadeudaStand,
                        monto: parseFloat(detalle.monto || 0),
                        mora: parseFloat(detalle.mora || 0),
                        estado: false, // Las deudas nuevas deben ser pendientes
                        idinquilino_activo: idinquilino_activo
                    })
                })
            })

            await Promise.all(promises)

            toast.success(`${detallesValidos.length} detalles de deuda creados correctamente`)
            setInquilinosActivos({}) // Limpiar inquilinos activos
            setInquilinosBorrados({}) // Limpiar inquilinos borrados
            setSelectedStands(new Set()) // Resetear selección de stands
            setShowOnlySelected(false) // Resetear filtro de vista
            setPisoFilter('all') // Resetear filtro de piso también
            setPisoFilterModal('all') // Resetear filtro de piso del modal
            onLoteOpenChange()
            fetchData() // Recargar datos
        } catch (error) {
            toast.error('Error al crear los detalles de deuda')
            console.error('Error:', error)
        } finally {
            setIsLoteSubmitting(false)
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
        <div className="p-4 w-full">
            <ToastContainer position="bottom-right" />

            <div className="flex items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold text-white">Gestión de Deudas por Stand</h1>
                <div className="flex gap-3 items-center flex-shrink-0">
                    <Popover className='bg-white' isOpen={isYearOpen} onOpenChange={onYearOpenChange} placement="bottom-start">
                        <PopoverTrigger className='bg-white'>
                            <Button
                                variant="bordered"
                                className="w-32 justify-between"
                                endContent={<span className="text-default-400">▼</span>}
                            >
                                {yearFilter === 'all' ? 'Todos' : yearFilter || 'Año'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent 
                            className="w-32 p-0" 
                            style={{ 
                                backgroundColor: 'white',
                                color: 'black',
                                '--nextui-colors-background': 'white',
                                '--nextui-colors-foreground': 'black'
                            }}
                        >
                            <div 
                                className="max-h-[300px] overflow-hidden" 
                                style={{ 
                                    backgroundColor: 'white',
                                    '--nextui-colors-background': 'white'
                                }}
                            >
                                {/* Opción "Todos" fija en la parte superior */}
                                <div 
                                    className="px-3 py-2 text-sm font-semibold cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                                    style={{ 
                                        backgroundColor: 'white',
                                        color: 'black',
                                        '--nextui-colors-background': 'white',
                                        '--nextui-colors-foreground': 'black'
                                    }}
                                    onClick={() => {
                                        setYearFilter('all')
                                        setPage(1)
                                        onYearOpenChange()
                                    }}
                                >
                                    Todos
                                </div>
                                
                                {/* Lista scrolleable de años */}
                                <div 
                                    className="max-h-[250px] overflow-y-auto" 
                                    style={{ 
                                        backgroundColor: 'white',
                                        '--nextui-colors-background': 'white'
                                    }}
                                >
                                    {availableYears.map((year) => (
                                        <div
                                            key={year}
                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                            style={{ 
                                                backgroundColor: 'white',
                                                color: 'black',
                                                '--nextui-colors-background': 'white',
                                                '--nextui-colors-foreground': 'black'
                                            }}
                                            onClick={() => {
                                                setYearFilter(year)
                                                setPage(1)
                                                onYearOpenChange()
                                            }}
                                        >
                                            {year}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Input
                        placeholder="Filtrar por concepto, stand, cliente o fecha..."
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
                    {(filter || (yearFilter && yearFilter !== 'all') || (pisoFilter && pisoFilter !== 'all')) && (
                        <Button
                            color="default"
                            variant="flat"
                            onPress={() => {
                                setFilter('')
                                setYearFilter('all')
                                setPisoFilter('all')
                                setPage(1)
                            }}
                        >
                            Limpiar Filtros
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button
                            color="primary"
                            onPress={initCreate}
                        >
                            Registro Individual
                        </Button>
                        <Button
                            color="secondary"
                            onPress={initCreateLote}
                        >
                            Registro por Lote
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <Table
                    aria-label="Tabla de detalles de deuda"
                    bottomContent={
                        <div className="flex w-full justify-between items-center">
                            <div className="text-sm text-gray-500">
                                Mostrando {((page - 1) * rowsPerPage) + 1} - {Math.min(page * rowsPerPage, filteredAndSortedItems.length)} de {filteredAndSortedItems.length} registros
                            </div>
                            {rowsPerPage !== 'all' && (
                                <Pagination
                                    isCompact
                                    showControls
                                    showShadow
                                    color="primary"
                                    page={page}
                                    total={Math.ceil(filteredAndSortedItems.length / rowsPerPage)}
                                    onChange={setPage}
                                />
                            )}
                        </div>
                    }
                    classNames={{
                        wrapper: "min-h-[400px] w-full",
                        table: "w-full",
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
                            allowsSorting={column.sortable}
                        >
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idregdeuda_detalle}>
                            {columns.map((column) => (
                                <TableCell key={column.key}>
                                    {renderCell(item, column.key)}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>

            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentDetalle?.idregdeuda_detalle 
                                    ? (session.user.role === 'USER' ? 'Ver Detalle de Deuda (Solo Lectura)' : 'Editar Detalle de Deuda')
                                    : 'Nuevo Detalle de Deuda'
                                }
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-6 min-h-[500px]">
                                <form id="detalle-form" onSubmit={handleSubmit} className="space-y-6">
                                    {/* Primera fila: Concepto y Stand */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Autocomplete
                                            label="Concepto de Deuda"
                                            placeholder="Seleccione un concepto..."
                                            defaultItems={conceptos}
                                            selectedKey={currentDetalle.idconcepto_deuda ? currentDetalle.idconcepto_deuda.toString() : null}
                                            onSelectionChange={(key) => {
                                                console.log('Concepto seleccionado:', key);
                                                const idconcepto = key ? parseInt(key) : '';
                                                const conceptoSeleccionado = conceptos.find(c => c.idconcepto === idconcepto);
                                                
                                                setCurrentDetalle(prev => ({
                                                    ...prev,
                                                    idconcepto_deuda: idconcepto
                                                }));
                                                
                                                // Si el nuevo concepto no tiene inquilinopaga = true, resetear el toggle
                                                if (!conceptoSeleccionado?.inquilinopaga) {
                                                    console.log('Concepto no tiene inquilinopaga = true, reseteando toggle');
                                                    setInquilinoPaga(false);
                                                    setCurrentDetalle(prev => ({
                                                        ...prev,
                                                        idinquilino_activo: null
                                                    }));
                                                }
                                            }}
                                            isRequired
                                            allowsCustomValue={false}
                                            isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                        >
                                            {(concepto) => (
                                                <AutocompleteItem key={concepto.idconcepto.toString()} textValue={concepto.descripcion}>
                                                    {concepto.descripcion}
                                                </AutocompleteItem>
                                            )}
                                        </Autocomplete>

                                        <Autocomplete
                                            label="Stand"
                                            placeholder="Buscar stand..."
                                            defaultItems={stands}
                                            selectedKey={currentDetalle.idstand ? currentDetalle.idstand.toString() : null}
                                                                                         onSelectionChange={async (key) => {
                                                 console.log('Stand seleccionado:', key);
                                                 const idstand = key ? parseInt(key) : '';
                                                 setCurrentDetalle(prev => ({
                                                     ...prev,
                                                     idstand
                                                 }));
                                                 
                                                 // Si hay un stand seleccionado, buscar el inquilino activo
                                                 if (idstand) {
                                                     try {
                                                         console.log('Buscando inquilino activo para stand:', idstand);
                                                         const res = await fetch(`/api/inquilino-stand?idstand=${idstand}`)
                                                         if (res.ok) {
                                                             const inquilinoStands = await res.json()
                                                             console.log('Inquilinos del stand:', inquilinoStands);
                                                             const inquilinoActivo = inquilinoStands.find(is => is.actual === true)
                                                             console.log('Inquilino activo encontrado:', inquilinoActivo);
                                                             setInquilinoActivo(inquilinoActivo?.inquilino || null)
                                                             console.log('Inquilino activo establecido:', inquilinoActivo?.inquilino || null);
                                                         }
                                                     } catch (error) {
                                                         console.error('Error obteniendo inquilino activo:', error)
                                                         setInquilinoActivo(null)
                                                     }
                                                 } else {
                                                     console.log('No hay stand seleccionado, limpiando inquilino activo');
                                                     setInquilinoActivo(null)
                                                 }
                                             }}
                                            isRequired={inquilinoPaga}
                                            allowsCustomValue={false}
                                            isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                            color={inquilinoPaga && !currentDetalle.idstand ? "danger" : "default"}
                                            description={inquilinoPaga && !currentDetalle.idstand ? "Stand requerido cuando Inquilino Paga está activado" : ""}
                                        >
                                            {(stand) => (
                                                <AutocompleteItem key={stand.idstand.toString()} textValue={`${stand.descripcion} - ${stand.client?.nombre || 'Sin cliente'}`}>
                                                    {stand.descripcion} - {stand.client?.nombre || 'Sin cliente'}
                                                </AutocompleteItem>
                                            )}
                                        </Autocomplete>
                                    </div>

                                    {/* Segunda fila: Monto y Mora */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            type="number"
                                            label="Monto"
                                            value={currentDetalle.monto === 0 ? '' : currentDetalle.monto}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCurrentDetalle({
                                                    ...currentDetalle,
                                                    monto: value === '' ? 0 : parseFloat(value) || 0
                                                });
                                            }}
                                            startContent={<span className="text-default-400 text-small">S/.</span>}
                                            step="0.01"
                                            min="0"
                                            isRequired
                                            isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                        />

                                        <Input
                                            type="number"
                                            label="Mora (Opcional)"
                                            value={currentDetalle.mora === 0 ? '' : currentDetalle.mora}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setCurrentDetalle({
                                                    ...currentDetalle,
                                                    mora: value === '' ? 0 : parseFloat(value) || 0
                                                });
                                            }}
                                            startContent={<span className="text-default-400 text-small">S/.</span>}
                                            step="0.01"
                                            min="0"
                                            isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                        />
                                    </div>

                                    {/* Tercera fila: Fecha y Estado */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Fecha de Deuda</label>
                                            <input
                                                type="date"
                                                value={currentDetalle.fechadeudaStand ? currentDetalle.fechadeudaStand.toISOString().split('T')[0] : ''}
                                                onChange={(e) => {
                                                    // Corregir el problema de zona horaria
                                                    const [year, month, day] = e.target.value.split('-').map(Number);
                                                    const date = new Date(year, month - 1, day, 12, 0, 0);
                                                    setCurrentDetalle({
                                                        ...currentDetalle,
                                                        fechadeudaStand: date
                                                    });
                                                }}
                                                className="w-full p-3 border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                                disabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Estado</label>
                                            <div className="pt-2">
                                                <Switch
                                                    isSelected={currentDetalle.estado}
                                                    onValueChange={(value) => setCurrentDetalle({
                                                        ...currentDetalle,
                                                        estado: value
                                                    })}
                                                    isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                                >
                                                    Estado Activo
                                                </Switch>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuarta fila: Inquilino Paga - Solo mostrar si el concepto tiene inquilinopaga = true */}
                                    {currentDetalle.idconcepto_deuda && conceptos.find(c => c.idconcepto === currentDetalle.idconcepto_deuda)?.inquilinopaga && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Switch
                                                    isSelected={inquilinoPaga}
                                                    onValueChange={(value) => {
                                                        console.log('=== TOGGLE INQUILINO PAGA ===')
                                                        console.log('Valor del toggle:', value)
                                                        console.log('Estado anterior del toggle:', inquilinoPaga)
                                                        console.log('Inquilino activo actual:', inquilinoActivo)
                                                        console.log('Stand seleccionado:', currentDetalle.idstand)
                                                        
                                                        setInquilinoPaga(value)
                                                        
                                                        if (!value) {
                                                            console.log('Desactivando toggle - limpiando idinquilino_activo')
                                                            setCurrentDetalle(prev => ({
                                                                ...prev,
                                                                idinquilino_activo: null
                                                            }))
                                                        } else if (currentDetalle.idstand && inquilinoActivo) {
                                                            console.log('Activando toggle - estableciendo idinquilino_activo:', inquilinoActivo.idinquilino)
                                                            setCurrentDetalle(prev => ({
                                                                ...prev,
                                                                idinquilino_activo: inquilinoActivo.idinquilino
                                                            }))
                                                        } else {
                                                            console.log('Toggle activado pero no hay stand o inquilino activo')
                                                        }
                                                        
                                                        console.log('=== FIN TOGGLE ===')
                                                    }}
                                                    isDisabled={session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle}
                                                >
                                                    Inquilino Paga
                                                </Switch>
                                            </div>
                                            
                                            {inquilinoPaga && (
                                                <div className="ml-6">
                                                    {!currentDetalle.idstand ? (
                                                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                            <span className="text-sm text-red-700">
                                                                ⚠️ <strong>Stand requerido:</strong> Debe seleccionar un stand para activar &quot;Inquilino Paga&quot;
                                                            </span>
                                                        </div>
                                                    ) : inquilinoActivo ? (
                                                        <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                                                            <span className="text-sm text-green-700">
                                                                Inquilino activo: <strong>{inquilinoActivo.nombre}</strong>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                                                            <span className="text-sm text-red-700">
                                                                ⚠️ No hay inquilino activo para este stand. 
                                                                Revise en la sección Stand.
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                
                                {/* Mostrar botón de Solo Lectura para USER editando, o botón de guardar para todos */}
                                {session.user.role === 'USER' && currentDetalle?.idregdeuda_detalle ? (
                                    <Button
                                        color="primary"
                                        variant="flat"
                                        isDisabled
                                    >
                                        Solo Lectura
                                    </Button>
                                ) : (
                                    <Button
                                        color="primary"
                                        type="submit"
                                        form="detalle-form"
                                        isLoading={isSubmitting}
                                    >
                                        {currentDetalle?.idregdeuda_detalle ? 'Guardar' : 'Crear'}
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Modal para registro por lote */}
            <Modal isOpen={isLoteOpen} onOpenChange={handleLoteModalClose} size="5xl" scrollBehavior="inside">
                <ModalContent className="h-[95vh]" style={{ maxWidth: "90rem", justifyContent: "center" }}>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                Registro de Deudas por Lote
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="lote-form" onSubmit={handleSubmitLote} className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                        <div className="lg:col-span-2">
                                        <Card>
                                            <CardHeader className="font-bold">Cabecera</CardHeader>
                                            <CardBody className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Fecha de Deuda</label>
                                                    <input
                                                        type="date"
                                                        value={loteData.fechadeudaStand ? loteData.fechadeudaStand.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => {
                                                            // Corregir el problema de zona horaria
                                                            const [year, month, day] = e.target.value.split('-').map(Number);
                                                            const date = new Date(year, month - 1, day, 12, 0, 0);
                                                            setLoteData({
                                                                ...loteData,
                                                                fechadeudaStand: date
                                                            });
                                                        }}
                                                        className="w-full p-2 border-2 border-default-200 rounded-lg focus:border-primary focus:outline-none transition-colors"
                                                        required
                                                    />
                                                </div>

                                                <Autocomplete
                                                    label="Concepto"
                                                    placeholder="Seleccione un concepto"
                                                    defaultItems={conceptos}
                                                    selectedKey={loteData.idconcepto_deuda ? loteData.idconcepto_deuda.toString() : null}
                                                    onSelectionChange={(key) => setLoteData({
                                                        ...loteData,
                                                        idconcepto_deuda: key ? parseInt(key) : ''
                                                    })}
                                                    isRequired
                                                    allowsCustomValue={false}
                                                >
                                                    {(concepto) => (
                                                        <AutocompleteItem key={concepto.idconcepto.toString()} textValue={concepto.descripcion}>
                                                            {concepto.descripcion}
                                                        </AutocompleteItem>
                                                    )}
                                                </Autocomplete>

                                                <Input
                                                    label="Monto General (S/.)"
                                                    type="number"
                                                    min="0"
                                                    step="0.0001"
                                                    value={montoGeneral === 0 ? '' : montoGeneral}
                                                    onChange={(e) => handleMontoGeneralChange(e.target.value)}
                                                    startContent={<span className="text-default-400 text-small">S/.</span>}
                                                />

                                                <Input
                                                    label="Mora General (S/.)"
                                                    type="number"
                                                    min="0"
                                                    step="0.0001"
                                                    value={moraGeneral === 0 ? '' : moraGeneral}
                                                    onChange={(e) => handleMoraGeneralChange(e.target.value)}
                                                    startContent={<span className="text-default-400 text-small">S/.</span>}
                                                    description="Mora que se sumará al monto principal"
                                                />
                                            </CardBody>
                                        </Card>
                                        </div>

                                        <div className="lg:col-span-3">
                                        <Card>
                                            <CardHeader className="flex justify-between items-center">
                                                <span className="font-bold">Detalle de Deuda por Stand</span>
                                                <div className="flex gap-2 items-center">
                                                    <Popover className='bg-white' isOpen={isPisoOpen} onOpenChange={onPisoOpenChange} placement="bottom-start">
                                                        <PopoverTrigger className='bg-white'>
                                                            <Button
                                                                variant="bordered"
                                                                size="sm"
                                                                className="w-24 justify-between"
                                                                endContent={<span className="text-default-400">▼</span>}
                                                            >
                                                                {pisoFilterModal === 'all' ? 'Todos' : `Piso ${pisoFilterModal}` || 'Piso'}
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent 
                                                            className="w-24 p-0" 
                                                            style={{ 
                                                                backgroundColor: 'white',
                                                                color: 'black',
                                                                '--nextui-colors-background': 'white',
                                                                '--nextui-colors-foreground': 'black'
                                                            }}
                                                        >
                                                            <div 
                                                                className="max-h-[300px] overflow-hidden" 
                                                                style={{ 
                                                                    backgroundColor: 'white',
                                                                    '--nextui-colors-background': 'white'
                                                                }}
                                                            >
                                                                {/* Opción "Todos" fija en la parte superior */}
                                                                <div 
                                                                    className="px-3 py-2 text-sm font-semibold cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
                                                                    style={{ 
                                                                        backgroundColor: 'white',
                                                                        color: 'black',
                                                                        '--nextui-colors-background': 'white',
                                                                        '--nextui-colors-foreground': 'black'
                                                                    }}
                                                                    onClick={() => {
                                                                        console.log('🏠 Cambiando a piso: all')
                                                                        setPisoFilterModal('all')
                                                                        setSelectedStands(new Set())
                                                                        setShowOnlySelected(false)
                                                                        onPisoOpenChange()
                                                                    }}
                                                                >
                                                                    Todos
                                                                </div>
                                                                
                                                                {/* Lista scrolleable de pisos */}
                                                                <div 
                                                                    className="max-h-[250px] overflow-y-auto" 
                                                                    style={{ 
                                                                        backgroundColor: 'white',
                                                                        '--nextui-colors-background': 'white'
                                                                    }}
                                                                >
                                                                    {availablePisos.map((piso) => (
                                                                        <div
                                                                            key={piso}
                                                                            className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                                                                            style={{ 
                                                                                backgroundColor: 'white',
                                                                                color: 'black',
                                                                                '--nextui-colors-background': 'white',
                                                                                '--nextui-colors-foreground': 'black'
                                                                            }}
                                                                            onClick={() => {
                                                                                console.log('🏠 Cambiando a piso:', piso)
                                                                                setPisoFilterModal(piso)
                                                                                setSelectedStands(new Set())
                                                                                setShowOnlySelected(false)
                                                                                onPisoOpenChange()
                                                                            }}
                                                                        >
                                                                            Piso {piso}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                    {pisoFilterModal !== 'all' && (
                                                        <Button
                                                            size="sm"
                                                            color="default"
                                                            variant="flat"
                                                            onPress={() => {
                                                                console.log('🧹 Limpiando filtro de piso')
                                                                setPisoFilterModal('all')
                                                                setSelectedStands(new Set())
                                                                setShowOnlySelected(false)
                                                            }}
                                                        >
                                                            Limpiar
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardHeader>
                                            <CardBody>
                                                {/* Controles de selección */}
                                                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium">
                                                                {selectedStands.size} de {stands.filter(stand => pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal).length} stands seleccionados
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                color="primary"
                                                                variant="flat"
                                                                onPress={selectAllStands}
                                                            >
                                                                Seleccionar Todos
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                color="default"
                                                                variant="flat"
                                                                onPress={deselectAllStands}
                                                            >
                                                                Deseleccionar Todos
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                color="secondary"
                                                                variant="flat"
                                                                onPress={invertStandSelection}
                                                            >
                                                                Invertir
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            isSelected={showOnlySelected}
                                                            onValueChange={setShowOnlySelected}
                                                            size="sm"
                                                        />
                                                        <span className="text-sm">Mostrar solo seleccionados</span>
                                                    </div>
                                                </div>

                                                {loteData.idconcepto_deuda && conceptos.find(c => c.idconcepto === loteData.idconcepto_deuda)?.inquilinopaga && (
                                                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                        <div className="flex items-center gap-2 text-blue-800">
                                                            <FaInfoCircle className="text-blue-600" />
                                                            <span className="text-sm font-medium">
                                                                Este concepto está configurado para que pague el inquilino. 
                                                                Los inquilinos activos se mostrarán automáticamente. 
                                                                Puedes quitar un inquilino haciendo clic en la &times; si no deseas registrarlo.
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="overflow-auto max-h-96">
                                                    {stands && stands.length > 0 ? (
                                                        <Table aria-label="Tabla de detalles">
                                                        <TableHeader>
                                                            <TableColumn width="50px">
                                                                <input
                                                                    key={`master-checkbox-${masterCheckboxState.checked}-${masterCheckboxState.indeterminate}`}
                                                                    type="checkbox"
                                                                    checked={masterCheckboxState.checked}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            selectAllStands()
                                                                        } else {
                                                                            deselectAllStands()
                                                                        }
                                                                    }}
                                                                    className="rounded"
                                                                    style={{
                                                                        accentColor: '#0070f3'
                                                                    }}
                                                                />
                                                            </TableColumn>
                                                            <TableColumn>Stand</TableColumn>
                                                            <TableColumn>Cliente</TableColumn>
                                                            <TableColumn width="150px" className={loteData.idconcepto_deuda && conceptos.find(c => c.idconcepto === loteData.idconcepto_deuda)?.inquilinopaga ? '' : 'hidden'}>
                                                                Inquilino
                                                            </TableColumn>
                                                            <TableColumn width="150px">Monto (S/.)</TableColumn>
                                                            <TableColumn width="150px">Mora (S/.)</TableColumn>
                                                            <TableColumn width="150px">Total (S/.)</TableColumn>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {stands
                                                                .filter(stand => {
                                                                    const matchesPiso = pisoFilterModal === 'all' || stand.nivel?.toString() === pisoFilterModal
                                                                    const matchesSelection = !showOnlySelected || selectedStands.has(stand.idstand)
                                                                    return matchesPiso && matchesSelection
                                                                })
                                                                .map(stand => {
                                                                const detalle = loteData.detalles.find(d => d.idstand === stand.idstand) || {}
                                                                const total = (parseFloat(detalle.monto || 0) + parseFloat(detalle.mora || 0)).toFixed(4)
                                                                const showInquilino = loteData.idconcepto_deuda && conceptos.find(c => c.idconcepto === loteData.idconcepto_deuda)?.inquilinopaga

                                                                return (
                                                                    <TableRow key={stand.idstand}>
                                                                        <TableCell>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selectedStands.has(stand.idstand)}
                                                                                onChange={() => toggleStandSelection(stand.idstand)}
                                                                                className="rounded"
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>{stand.descripcion}</TableCell>
                                                                        <TableCell>{stand.client?.nombre || 'Sin asignar'}</TableCell>
                                                                        <TableCell className={showInquilino ? '' : 'hidden'}>
                                                                            {showInquilino && (
                                                                                <>
                                                                                    {inquilinosActivos[stand.idstand] ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm">{inquilinosActivos[stand.idstand].nombre}</span>
                                                                                            <Button
                                                                                                isIconOnly
                                                                                                size="sm"
                                                                                                color="danger"
                                                                                                variant="light"
                                                                                                onPress={() => removeInquilinoFromStand(stand.idstand)}
                                                                                                className="min-w-0 w-6 h-6"
                                                                >
                                                                                                &times;
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : inquilinosBorrados[stand.idstand] ? (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-sm text-gray-500 line-through">
                                                                                                {inquilinosBorrados[stand.idstand].nombre}
                                                                                            </span>
                                                                                            <Button
                                                                                                isIconOnly
                                                                                                size="sm"
                                                                                                color="success"
                                                                                                variant="light"
                                                                                                onPress={() => restoreInquilinoFromStand(stand.idstand)}
                                                                                                className="min-w-0 w-6 h-6"
                                                                                            >
                                                                                                &#8635;
                                                                                            </Button>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-sm text-gray-500">Sin inquilino activo</span>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.0001"
                                                                                value={detalle.monto === 0 ? '' : detalle.monto || ''}
                                                                                onChange={(e) => handleMontoChange(stand.idstand, 'monto', e.target.value)}
                                                                                startContent={<span className="text-default-400 text-small">S/.</span>}
                                                                            />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Input
                                                                                type="number"
                                                                                min="0"
                                                                                step="0.0001"
                                                                                value={detalle.mora === 0 ? '' : detalle.mora || ''}
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
                                                    ) : (
                                                        <div className="flex justify-center items-center h-32 text-gray-500">
                                                            <p>No hay stands disponibles</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardBody>
                                        </Card>
                                        </div>
                                    </div>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={handleLoteModalClose}>
                                    Cancelar
                                </Button>
                                <Button
                                    color="primary"
                                    type="submit"
                                    form="lote-form"
                                    isLoading={isLoteSubmitting}
                                >
                                    Crear Lote
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}