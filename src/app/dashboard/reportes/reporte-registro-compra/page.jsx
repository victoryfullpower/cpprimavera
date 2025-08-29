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
    Input,
    Spinner,
    Chip,
    Select,
    SelectItem,
    Card,
    CardBody,
    Divider
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ReporteRegistroCompraPDF from '@/components/reporteRegistroCompra/ReporteRegistroCompraPDF'
import ExportarExcelButton from '@/components/reporteRegistroCompra/ExportarExcelButton'

export default function ReporteRegistroCompraPage() {
    // Estados
    const session = useSession()
    const [registrosCompra, setRegistrosCompra] = useState([])
    const [tiposDocumento, setTiposDocumento] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtering, setFiltering] = useState(false)

    // Filtros
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idtipocompra: '',
        estado: '',
        descripcion: ''
    })

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
            setTiposDocumento(dataTipos)
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

    // Aplicar filtros
    const aplicarFiltros = () => {
        setFiltering(true)
        // Los filtros se aplican en tiempo real con useMemo
    }

    // Limpiar filtros
    const limpiarFiltros = () => {
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            idtipocompra: '',
            estado: '',
            descripcion: ''
        })
        setFiltering(false)
    }

    // Datos filtrados
    const datosFiltrados = useMemo(() => {
        let filtrados = registrosCompra

        // Filtro por descripción
        if (filtros.descripcion) {
            filtrados = filtrados.filter(reg => 
                reg.descripcion.toLowerCase().includes(filtros.descripcion.toLowerCase())
            )
        }

        // Filtro por tipo de documento
        if (filtros.idtipocompra) {
            filtrados = filtrados.filter(reg => 
                reg.idtipocompra === parseInt(filtros.idtipocompra)
            )
        }

        // Filtro por estado
        if (filtros.estado !== '') {
            filtrados = filtrados.filter(reg => 
                reg.estado === (filtros.estado === 'true')
            )
        }

        // Filtro por fecha desde
        if (filtros.fechaDesde) {
            const fechaDesde = new Date(filtros.fechaDesde)
            filtrados = filtrados.filter(reg => 
                new Date(reg.fecharegistro) >= fechaDesde
            )
        }

        // Filtro por fecha hasta
        if (filtros.fechaHasta) {
            const fechaHasta = new Date(filtros.fechaHasta)
            fechaHasta.setHours(23, 59, 59, 999) // Incluir todo el día
            filtrados = filtrados.filter(reg => 
                new Date(reg.fecharegistro) <= fechaHasta
            )
        }

        return filtrados
    }, [registrosCompra, filtros])

    // Estadísticas
    const estadisticas = useMemo(() => {
        const total = datosFiltrados.length
        const totalMonto = datosFiltrados.reduce((sum, reg) => sum + parseFloat(reg.monto), 0)
        const activos = datosFiltrados.filter(reg => reg.estado).length
        const inactivos = total - activos

        return {
            total,
            totalMonto: totalMonto.toFixed(2),
            activos,
            inactivos
        }
    }, [datosFiltrados])

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

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">Reporte de Registros de Compra</h1>
                <p className="text-gray-300">Gestiona y visualiza todos los registros de compra del sistema</p>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Fecha Desde */}
                        <Input
                            type="date"
                            label="Fecha Desde"
                            value={filtros.fechaDesde}
                            onChange={(e) => setFiltros({
                                ...filtros,
                                fechaDesde: e.target.value
                            })}
                        />

                        {/* Fecha Hasta */}
                        <Input
                            type="date"
                            label="Fecha Hasta"
                            value={filtros.fechaHasta}
                            onChange={(e) => setFiltros({
                                ...filtros,
                                fechaHasta: e.target.value
                            })}
                        />

                        {/* Tipo de Documento */}
                        <Select
                            label="Tipo de Documento"
                            placeholder="Todos los tipos"
                            selectedKeys={filtros.idtipocompra ? [filtros.idtipocompra] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0]
                                setFiltros({
                                    ...filtros,
                                    idtipocompra: selected || ''
                                })
                            }}
                        >
                            <SelectItem key="" value="">Todos los tipos</SelectItem>
                            {tiposDocumento.map((tipo) => (
                                <SelectItem key={tipo.idtipodocumento} value={tipo.idtipodocumento}>
                                    {tipo.descripcion}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* Estado */}
                        <Select
                            label="Estado"
                            placeholder="Todos los estados"
                            selectedKeys={filtros.estado !== '' ? [filtros.estado] : []}
                            onSelectionChange={(keys) => {
                                const selected = Array.from(keys)[0]
                                setFiltros({
                                    ...filtros,
                                    estado: selected || ''
                                })
                            }}
                        >
                            <SelectItem key="" value="">Todos los estados</SelectItem>
                            <SelectItem key="true" value="true">Activo</SelectItem>
                            <SelectItem key="false" value="false">Inactivo</SelectItem>
                        </Select>

                        {/* Descripción */}
                        <Input
                            label="Descripción"
                            placeholder="Filtrar por descripción"
                            value={filtros.descripcion}
                            onChange={(e) => setFiltros({
                                ...filtros,
                                descripcion: e.target.value
                            })}
                        />
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button 
                            color="primary" 
                            onPress={aplicarFiltros}
                            isLoading={filtering}
                        >
                            Aplicar Filtros
                        </Button>
                        <Button 
                            color="secondary" 
                            variant="flat" 
                            onPress={limpiarFiltros}
                        >
                            Limpiar Filtros
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardBody className="text-center">
                        <p className="text-sm text-gray-500">Total Registros</p>
                        <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <p className="text-sm text-gray-500">Monto Total</p>
                        <p className="text-2xl font-bold text-green-600">S/. {estadisticas.totalMonto}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <p className="text-sm text-gray-500">Registros Activos</p>
                        <p className="text-2xl font-bold text-success">{estadisticas.activos}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <p className="text-sm text-gray-500">Registros Inactivos</p>
                        <p className="text-2xl font-bold text-danger">{estadisticas.inactivos}</p>
                    </CardBody>
                </Card>
            </div>

            {/* Tabla de resultados */}
            <Card>
                <CardBody>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Resultados ({datosFiltrados.length} registros)</h3>
                        <div className="flex gap-2">
                            <ExportarExcelButton 
                                datos={datosFiltrados}
                                filtros={filtros}
                                estadisticas={estadisticas}
                            />
                            <PDFDownloadLink
                                document={
                                    <ReporteRegistroCompraPDF 
                                        datos={datosFiltrados}
                                        filtros={filtros}
                                        estadisticas={estadisticas}
                                        empresa={{ nombre_empresa: 'CCPrimavera' }}
                                        usuario={session.user?.username || 'Usuario'}
                                    />
                                }
                                fileName={`Reporte_Registro_Compra_${new Date().toISOString().split('T')[0]}.pdf`}
                            >
                                {({ blob, url, loading, error }) => (
                                    <Button 
                                        color="danger" 
                                        variant="flat"
                                        isLoading={loading}
                                    >
                                        Exportar PDF
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>

                    <Table
                        aria-label="Tabla de registros de compra filtrados"
                        selectionMode="none"
                        className="min-h-[400px]"
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
                            items={datosFiltrados}
                            isLoading={loading}
                            loadingContent={<Spinner />}
                            emptyContent="No se encontraron registros con los filtros aplicados"
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
                </CardBody>
            </Card>
        </div>
    )
}
