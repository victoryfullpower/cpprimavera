'use client'
import { useState, useEffect, useMemo } from 'react'
import {
    Button,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Input,
    Select,
    SelectItem,
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    useDisclosure
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { useRef } from 'react'
import { FaSearch, FaPrint, FaFilter, FaDownload } from 'react-icons/fa'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ReporteRegistroDeudasPDF from '@/components/reporteRegistroDeudas/ReporteRegistroDeudasPDF'
import ExportarExcelButton from '@/components/reporteRegistroDeudas/ExportarExcelButton'

export default function ReporteRegistroDeudasPage() {
    const [detalles, setDetalles] = useState([])
    const [conceptos, setConceptos] = useState([])
    const [stands, setStands] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idconcepto_deuda: '',
        idstand: '',
        piso: '',
        estado: '',
        busqueda: ''
    })
    
    const { isOpen: isPisoOpen, onOpen: onPisoOpen, onOpenChange: onPisoOpenChange } = useDisclosure()
    const printRef = useRef()

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 15mm;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                .reporte-container, .reporte-container * {
                    visibility: visible;
                }
                .reporte-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        `,
        onAfterPrint: () => {
            toast.success('Reporte impreso correctamente')
        }
    })

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

    // Obtener pisos disponibles
    const pisosDisponibles = useMemo(() => {
        const pisos = new Set()
        stands.forEach(stand => {
            if (stand.nivel) {
                pisos.add(stand.nivel)
            }
        })
        return Array.from(pisos).sort((a, b) => a - b)
    }, [stands])

    // Filtrar datos
    const datosFiltrados = useMemo(() => {
        let filtered = detalles

        // Filtro por rango de fechas
        if (filtros.fechaDesde) {
            filtered = filtered.filter(detalle => 
                new Date(detalle.fechadeudaStand) >= new Date(filtros.fechaDesde)
            )
        }

        if (filtros.fechaHasta) {
            filtered = filtered.filter(detalle => 
                new Date(detalle.fechadeudaStand) <= new Date(filtros.fechaHasta + 'T23:59:59')
            )
        }

        // Filtro por concepto
        if (filtros.idconcepto_deuda) {
            filtered = filtered.filter(detalle => 
                detalle.idconcepto_deuda === parseInt(filtros.idconcepto_deuda)
            )
        }

        // Filtro por stand
        if (filtros.idstand) {
            filtered = filtered.filter(detalle => 
                detalle.idstand === parseInt(filtros.idstand)
            )
        }

        // Filtro por piso
        if (filtros.piso) {
            filtered = filtered.filter(detalle => 
                detalle.stand?.nivel?.toString() === filtros.piso
            )
        }

        // Filtro por estado
        if (filtros.estado !== '') {
            filtered = filtered.filter(detalle => 
                detalle.estado === (filtros.estado === 'true')
            )
        }

        // Filtro por búsqueda general
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase()
            filtered = filtered.filter(detalle => 
                detalle.stand?.descripcion?.toLowerCase().includes(busqueda) ||
                detalle.stand?.client?.nombre?.toLowerCase().includes(busqueda) ||
                detalle.concepto?.descripcion?.toLowerCase().includes(busqueda) ||
                detalle.inquilino_activo?.nombre?.toLowerCase().includes(busqueda) ||
                format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es }).includes(busqueda)
            )
        }

        return filtered
    }, [detalles, filtros])

    // Limpiar filtros
    const limpiarFiltros = () => {
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            idconcepto_deuda: '',
            idstand: '',
            piso: '',
            estado: '',
            busqueda: ''
        })
    }

    // Verificar si hay filtros activos
    const hayFiltrosActivos = Object.values(filtros).some(valor => valor !== '')

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    )

    return (
        <div className="p-4">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Reporte de Registro de Deudas</h1>
                <div className="flex gap-2">
                    <Button 
                        color="secondary" 
                        onPress={handlePrint}
                        startContent={<FaPrint />}
                    >
                        Imprimir
                    </Button>
                    <ExportarExcelButton datos={datosFiltrados} />
                    <PDFDownloadLink
                        document={<ReporteRegistroDeudasPDF datos={datosFiltrados} />}
                        fileName={`reporte-registro-deudas-${format(new Date(), 'yyyy-MM-dd')}.pdf`}
                    >
                        {({ loading }) => (
                            <Button 
                                color="danger" 
                                isLoading={loading}
                                startContent={!loading && <FaDownload />}
                            >
                                {loading ? 'Generando PDF...' : 'Descargar PDF'}
                            </Button>
                        )}
                    </PDFDownloadLink>
                </div>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FaFilter /> Filtros de Búsqueda
                    </h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Rango de fechas */}
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                label="Fecha desde"
                                value={filtros.fechaDesde}
                                onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                                size="sm"
                            />
                            <Input
                                type="date"
                                label="Fecha hasta"
                                value={filtros.fechaHasta}
                                onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                                size="sm"
                            />
                        </div>

                        {/* Concepto */}
                        <Select
                            label="Concepto de Deuda"
                            placeholder="Seleccionar concepto"
                            selectedKeys={filtros.idconcepto_deuda ? [filtros.idconcepto_deuda] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0]
                                setFiltros(prev => ({ ...prev, idconcepto_deuda: selected || '' }))
                            }}
                        >
                            <SelectItem key="" value="">Todos los conceptos</SelectItem>
                            {conceptos.map(concepto => (
                                <SelectItem key={concepto.idconcepto.toString()} value={concepto.idconcepto.toString()}>
                                    {concepto.descripcion}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Stand */}
                        <Select
                            label="Stand"
                            placeholder="Seleccionar stand"
                            selectedKeys={filtros.idstand ? [filtros.idstand] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0]
                                setFiltros(prev => ({ ...prev, idstand: selected || '' }))
                            }}
                        >
                            <SelectItem key="" value="">Todos los stands</SelectItem>
                            {stands.map(stand => (
                                <SelectItem key={stand.idstand.toString()} value={stand.idstand.toString()}>
                                    {stand.descripcion} - {stand.client?.nombre || 'Sin cliente'}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Piso */}
                        <Popover isOpen={isPisoOpen} onOpenChange={onPisoOpenChange} placement="bottom-start">
                            <PopoverTrigger>
                                <Button
                                    variant="bordered"
                                    className="w-full justify-between h-12 px-3 py-2 text-left"
                                    endContent={<span className="text-default-400">▼</span>}
                                >
                                    <span className={filtros.piso === '' ? 'text-default-500' : 'text-foreground'}>
                                        {filtros.piso === '' ? 'Seleccionar piso' : `Piso ${filtros.piso}`}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" style={{ minWidth: 'var(--trigger-width)' }}>
                                <div className="max-h-[200px] overflow-y-auto">
                                    <div
                                        className="px-3 py-2 cursor-pointer hover:bg-default-100 text-sm"
                                        onClick={() => {
                                            setFiltros(prev => ({ ...prev, piso: '' }))
                                            onPisoOpenChange()
                                        }}
                                    >
                                        Todos los pisos
                                    </div>
                                    {pisosDisponibles.map((piso) => (
                                        <div
                                            key={piso}
                                            className="px-3 py-2 cursor-pointer hover:bg-default-100 text-sm"
                                            onClick={() => {
                                                setFiltros(prev => ({ ...prev, piso: piso.toString() }))
                                                onPisoOpenChange()
                                            }}
                                        >
                                            Piso {piso}
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Estado */}
                        <Select
                            label="Estado"
                            placeholder="Seleccionar estado"
                            selectedKeys={filtros.estado !== '' ? [filtros.estado] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0]
                                setFiltros(prev => ({ ...prev, estado: selected || '' }))
                            }}
                        >
                            <SelectItem key="" value="">Todos los estados</SelectItem>
                            <SelectItem key="true" value="true">Pagado</SelectItem>
                            <SelectItem key="false" value="false">Pendiente</SelectItem>
                        </Select>

                        {/* Búsqueda general */}
                        <Input
                            label="Búsqueda general"
                            placeholder="Buscar por stand, cliente, concepto..."
                            value={filtros.busqueda}
                            onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                            startContent={<FaSearch />}
                            className="col-span-2"
                        />
                    </div>

                    {/* Botón limpiar filtros */}
                    {hayFiltrosActivos && (
                        <div className="flex justify-end mt-4">
                            <Button color="warning" variant="flat" onPress={limpiarFiltros}>
                                Limpiar Filtros
                            </Button>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Tabla de resultados */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">
                        Registro de Deudas ({datosFiltrados.length} resultados)
                    </h3>
                </CardHeader>
                <CardBody>
                    <Table aria-label="Registro de deudas">
                        <TableHeader>
                            <TableColumn>FECHA</TableColumn>
                            <TableColumn>STAND</TableColumn>
                            <TableColumn>CLIENTE</TableColumn>
                            <TableColumn>CONCEPTO</TableColumn>
                            <TableColumn>INQUILINO</TableColumn>
                            <TableColumn>MONTO</TableColumn>
                            <TableColumn>MORA</TableColumn>
                            <TableColumn>TOTAL</TableColumn>
                            <TableColumn>PAGADO</TableColumn>
                            <TableColumn>SALDO</TableColumn>
                            <TableColumn>ESTADO</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {datosFiltrados.map((detalle, index) => {
                                const total = parseFloat(detalle.monto) + parseFloat(detalle.mora || 0)
                                const pagado = parseFloat(detalle.totalPagado || 0)
                                const saldo = total - pagado
                                
                                return (
                                    <TableRow key={detalle.idregdeuda_detalle || index}>
                                        <TableCell>
                                            {format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-semibold">{detalle.stand?.descripcion}</div>
                                                <div className="text-sm text-gray-500">Nivel {detalle.stand?.nivel}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {detalle.stand?.client?.nombre || 'Sin cliente'}
                                        </TableCell>
                                        <TableCell>
                                            {detalle.concepto?.descripcion || 'Sin concepto'}
                                        </TableCell>
                                        <TableCell>
                                            {detalle.inquilino_activo?.nombre || 'Sin inquilino'}
                                        </TableCell>
                                        <TableCell>
                                            S/. {parseFloat(detalle.monto).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            S/. {parseFloat(detalle.mora || 0).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Chip color="danger" variant="flat" size="sm">
                                                S/. {total.toFixed(2)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip color="success" variant="flat" size="sm">
                                                S/. {pagado.toFixed(2)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                color={saldo > 0 ? "warning" : "success"} 
                                                variant="flat" 
                                                size="sm"
                                            >
                                                S/. {saldo.toFixed(2)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                color={detalle.estado ? "success" : "warning"} 
                                                variant="flat" 
                                                size="sm"
                                            >
                                                {detalle.estado ? 'Pagado' : 'Pendiente'}
                                            </Chip>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Componente oculto para impresión */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="reporte-container">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold text-center mb-8">Reporte de Registro de Deudas</h1>
                        <p className="text-center mb-6">Fecha: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                        
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left">Fecha</th>
                                    <th className="border border-gray-300 p-2 text-left">Stand</th>
                                    <th className="border border-gray-300 p-2 text-left">Cliente</th>
                                    <th className="border border-gray-300 p-2 text-left">Concepto</th>
                                    <th className="border border-gray-300 p-2 text-left">Inquilino</th>
                                    <th className="border border-gray-300 p-2 text-right">Monto</th>
                                    <th className="border border-gray-300 p-2 text-right">Mora</th>
                                    <th className="border border-gray-300 p-2 text-right">Total</th>
                                    <th className="border border-gray-300 p-2 text-right">Pagado</th>
                                    <th className="border border-gray-300 p-2 text-right">Saldo</th>
                                    <th className="border border-gray-300 p-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosFiltrados.map((detalle, index) => {
                                    const total = parseFloat(detalle.monto) + parseFloat(detalle.mora || 0)
                                    const pagado = parseFloat(detalle.totalPagado || 0)
                                    const saldo = total - pagado
                                    
                                    return (
                                        <tr key={detalle.idregdeuda_detalle || index}>
                                            <td className="border border-gray-300 p-2">
                                                {format(new Date(detalle.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detalle.stand?.descripcion} (Nivel {detalle.stand?.nivel})
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detalle.stand?.client?.nombre || 'Sin cliente'}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detalle.concepto?.descripcion || 'Sin concepto'}
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {detalle.inquilino_activo?.nombre || 'Sin inquilino'}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                S/. {parseFloat(detalle.monto).toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                S/. {parseFloat(detalle.mora || 0).toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right font-bold">
                                                S/. {total.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                S/. {pagado.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right font-bold">
                                                S/. {saldo.toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-center">
                                                {detalle.estado ? 'Pagado' : 'Pendiente'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        
                        <div className="mt-8 text-sm text-gray-600">
                            <p><strong>Total de registros:</strong> {datosFiltrados.length}</p>
                            <p><strong>Total deuda:</strong> S/. {datosFiltrados.reduce((sum, d) => sum + parseFloat(d.monto) + parseFloat(d.mora || 0), 0).toFixed(2)}</p>
                            <p><strong>Total pagado:</strong> S/. {datosFiltrados.reduce((sum, d) => sum + parseFloat(d.totalPagado || 0), 0).toFixed(2)}</p>
                            <p><strong>Saldo pendiente:</strong> S/. {datosFiltrados.reduce((sum, d) => {
                                const total = parseFloat(d.monto) + parseFloat(d.mora || 0)
                                const pagado = parseFloat(d.totalPagado || 0)
                                return sum + (total - pagado)
                            }, 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-right" />
        </div>
    )
}
