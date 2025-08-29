'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { Button, Input, Select, SelectItem, Switch } from '@nextui-org/react'
import { toast } from 'react-toastify'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ReporteEgresosConceptosPDF from '@/components/reporteEgresosConceptos/ReporteEgresosConceptosPDF'
import ExportarExcelButton from '@/components/reporteEgresosConceptos/ExportarExcelButton'

export default function ReporteEgresosConceptosPage() {
    const [conceptos, setConceptos] = useState([])
    const [recibos, setRecibos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idconcepto_egreso: '',
        estado: ''
    })

    // Obtener conceptos de egreso
    useEffect(() => {
        const fetchConceptos = async () => {
            try {
                const response = await fetch('/api/concepto-egreso')
                if (response.ok) {
                    const data = await response.json()
                    setConceptos(data.filter(c => c.estado))
                }
            } catch (error) {
                console.error('Error fetching conceptos:', error)
            }
        }
        fetchConceptos()
    }, [])

    // Obtener recibos de egreso
    useEffect(() => {
        const fetchRecibos = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/recibo-egreso')
                if (response.ok) {
                    const data = await response.json()
                    setRecibos(data)
                }
            } catch (error) {
                console.error('Error fetching recibos:', error)
                toast.error('Error al cargar los recibos')
            } finally {
                setLoading(false)
            }
        }
        fetchRecibos()
    }, [])

    // Filtrar y procesar datos
    const datosFiltrados = useMemo(() => {
        let filtered = recibos

        if (filtros.fechaDesde) {
            filtered = filtered.filter(r => 
                new Date(r.fecharecibo_egreso) >= new Date(filtros.fechaDesde)
            )
        }

        if (filtros.fechaHasta) {
            filtered = filtered.filter(r => 
                new Date(r.fecharecibo_egreso) <= new Date(filtros.fechaHasta + 'T23:59:59')
            )
        }

        if (filtros.idconcepto_egreso) {
            filtered = filtered.filter(r => 
                r.detalles.some(d => d.idconcepto_egreso === parseInt(filtros.idconcepto_egreso))
            )
        }

        if (filtros.estado !== '') {
            filtered = filtered.filter(r => r.estado === (filtros.estado === 'true'))
        }

        return filtered
    }, [recibos, filtros])

    // Calcular estadísticas
    const estadisticas = useMemo(() => {
        const total = datosFiltrados.length
        const activos = datosFiltrados.filter(r => r.estado).length
        const inactivos = total - activos
        
        // Calcular total por conceptos
        const totalPorConcepto = {}
        conceptos.forEach(concepto => {
            totalPorConcepto[concepto.idconcepto_egreso] = {
                descripcion: concepto.descripcion,
                total: 0,
                cantidad: 0
            }
        })

        datosFiltrados.forEach(recibo => {
            recibo.detalles.forEach(detalle => {
                if (totalPorConcepto[detalle.idconcepto_egreso]) {
                    totalPorConcepto[detalle.idconcepto_egreso].total += parseFloat(detalle.monto)
                    totalPorConcepto[detalle.idconcepto_egreso].cantidad += 1
                }
            })
        })

        const totalMonto = Object.values(totalPorConcepto).reduce((sum, concepto) => sum + concepto.total, 0)

        return {
            total,
            activos,
            inactivos,
            totalMonto: totalMonto.toFixed(2),
            totalPorConcepto
        }
    }, [datosFiltrados, conceptos])

    const limpiarFiltros = () => {
        setFiltros({
            fechaDesde: '',
            fechaHasta: '',
            idconcepto_egreso: '',
            estado: ''
        })
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg">Cargando...</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Reporte de Egresos por Conceptos</h1>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Filtros</h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Input
                            type="date"
                            label="Fecha desde"
                            value={filtros.fechaDesde}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
                        />
                        <Input
                            type="date"
                            label="Fecha hasta"
                            value={filtros.fechaHasta}
                            onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
                        />
                        <Select
                            label="Concepto de egreso"
                            placeholder="Seleccionar concepto"
                            value={filtros.idconcepto_egreso}
                            onChange={(e) => setFiltros(prev => ({ ...prev, idconcepto_egreso: e.target.value }))}
                        >
                            <SelectItem key="" value="">Todos los conceptos</SelectItem>
                            {conceptos.map((concepto) => (
                                <SelectItem key={concepto.idconcepto_egreso} value={concepto.idconcepto_egreso.toString()}>
                                    {concepto.descripcion}
                                </SelectItem>
                            ))}
                        </Select>
                        <Select
                            label="Estado"
                            placeholder="Seleccionar estado"
                            value={filtros.estado}
                            onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                        >
                            <SelectItem key="" value="">Todos los estados</SelectItem>
                            <SelectItem key="true" value="true">Activo</SelectItem>
                            <SelectItem key="false" value="false">Inactivo</SelectItem>
                        </Select>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <Button color="primary" onPress={limpiarFiltros}>
                            Limpiar Filtros
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardBody className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
                        <div className="text-sm text-gray-600">Total de Recibos</div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <div className="text-2xl font-bold text-green-600">{estadisticas.activos}</div>
                        <div className="text-sm text-gray-600">Recibos Activos</div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <div className="text-2xl font-bold text-red-600">{estadisticas.inactivos}</div>
                        <div className="text-sm text-gray-600">Recibos Inactivos</div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="text-center">
                        <div className="text-2xl font-bold text-purple-600">S/. {estadisticas.totalMonto}</div>
                        <div className="text-sm text-gray-600">Monto Total</div>
                    </CardBody>
                </Card>
            </div>

            {/* Resumen por conceptos */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Resumen por Conceptos</h3>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left">Concepto</th>
                                    <th className="px-4 py-2 text-right">Cantidad</th>
                                    <th className="px-4 py-2 text-right">Monto Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(estadisticas.totalPorConcepto)
                                    .filter(concepto => concepto.cantidad > 0)
                                    .sort((a, b) => b.total - a.total)
                                    .map((concepto, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <td className="px-4 py-2">{concepto.descripcion}</td>
                                            <td className="px-4 py-2 text-right">{concepto.cantidad}</td>
                                            <td className="px-4 py-2 text-right">S/. {concepto.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Resultados */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center w-full">
                        <h3 className="text-lg font-semibold">Resultados ({datosFiltrados.length} recibos)</h3>
                        <div className="flex gap-2">
                            <ExportarExcelButton 
                                datos={datosFiltrados}
                                filtros={filtros}
                                estadisticas={estadisticas}
                                conceptos={conceptos}
                            />
                            <PDFDownloadLink
                                document={
                                    <ReporteEgresosConceptosPDF
                                        datos={datosFiltrados}
                                        filtros={filtros}
                                        estadisticas={estadisticas}
                                        conceptos={conceptos}
                                    />
                                }
                                fileName={`Reporte_Egresos_Conceptos_${new Date().toISOString().split('T')[0]}.pdf`}
                            >
                                {({ blob, url, loading, error }) => (
                                    <Button 
                                        color="danger" 
                                        variant="flat"
                                        disabled={loading}
                                    >
                                        {loading ? 'Generando PDF...' : 'Exportar PDF'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-4 py-2 text-left">N° Recibo</th>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                    <th className="px-4 py-2 text-left">Conceptos</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                    <th className="px-4 py-2 text-center">Estado</th>
                                    <th className="px-4 py-2 text-left">Creado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosFiltrados.map((recibo) => (
                                    <tr key={recibo.idrecibo_egreso} className="border-b">
                                        <td className="px-4 py-2">{recibo.numerorecibo_egreso}</td>
                                        <td className="px-4 py-2">
                                            {new Date(recibo.fecharecibo_egreso).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="space-y-1">
                                                {recibo.detalles.map((detalle, index) => (
                                                    <div key={index} className="text-sm">
                                                        <span className="font-medium">
                                                            {conceptos.find(c => c.idconcepto_egreso === detalle.idconcepto_egreso)?.descripcion}
                                                        </span>
                                                        {detalle.descripcion && (
                                                            <span className="text-gray-600 ml-2">
                                                                - {detalle.descripcion}
                                                            </span>
                                                        )}
                                                        <span className="text-gray-500 ml-2">
                                                            S/. {parseFloat(detalle.monto).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right font-medium">
                                            S/. {parseFloat(recibo.total).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                recibo.estado 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {recibo.estado ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {recibo.createdBy?.username || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    )
}
