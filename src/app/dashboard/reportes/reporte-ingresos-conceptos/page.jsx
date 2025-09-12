'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { Button, Input, Select, SelectItem, Switch, Popover, PopoverTrigger, PopoverContent, useDisclosure } from '@nextui-org/react'
import { toast } from 'react-toastify'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ReporteIngresosConceptosPDF from '@/components/reporteIngresosConceptos/ReporteIngresosConceptosPDF'
import ExportarExcelButton from '@/components/reporteIngresosConceptos/ExportarExcelButton'

export default function ReporteIngresosConceptosPage() {
    const [conceptos, setConceptos] = useState([])
    const [recibos, setRecibos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filtros, setFiltros] = useState({
        fechaDesde: '',
        fechaHasta: '',
        idconcepto_deuda: '',
        estado: '',
        piso: ''
    })
    const { isOpen: isPisoOpen, onOpen: onPisoOpen, onOpenChange: onPisoOpenChange } = useDisclosure()

    // Debug del estado de filtros
    useEffect(() => {
        console.log('🔄 Estado de filtros actualizado:', filtros)
        console.log('🏠 Piso específico:', filtros.piso, 'tipo:', typeof filtros.piso)
    }, [filtros])

    // Obtener conceptos de deuda
    useEffect(() => {
        const fetchConceptos = async () => {
            try {
                const response = await fetch('/api/conceptos-deuda')
                if (response.ok) {
                    const data = await response.json()
                    console.log('Conceptos cargados:', data)
                    setConceptos(data.filter(c => c.estado && c.deuda))
                } else {
                    console.error('Error en la respuesta de conceptos:', response.status)
                }
            } catch (error) {
                console.error('Error fetching conceptos:', error)
            }
        }
        fetchConceptos()
    }, [])

    // Obtener recibos de ingreso
    useEffect(() => {
        const fetchRecibos = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/reportes/ingresos-conceptos')
                if (response.ok) {
                    const data = await response.json()
                    console.log('Recibos cargados:', data)
                    setRecibos(data)
                } else {
                    console.error('Error en la respuesta:', response.status)
                    toast.error('Error al cargar los recibos')
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

    // Obtener pisos disponibles
    const pisosDisponibles = useMemo(() => {
        const pisos = new Set()
        console.log('🔍 Analizando recibos para detectar pisos:', recibos.length, 'recibos')
        
        recibos.forEach((recibo, index) => {
            console.log(`📋 Recibo ${index + 1}:`, {
                id: recibo.idrecibo_ingreso,
                stand: recibo.stand,
                detalles: recibo.detalles?.length || 0
            })
            
            if (recibo.stand?.nivel) {
                console.log('✅ Piso encontrado en stand directo:', recibo.stand.nivel)
                pisos.add(recibo.stand.nivel)
            }
            
            // También revisar en los detalles de deuda
            recibo.detalles?.forEach((detalle, detIndex) => {
                console.log(`  📝 Detalle ${detIndex + 1}:`, {
                    detalleDeuda: detalle.detalleDeuda,
                    stand: detalle.detalleDeuda?.stand
                })
                
                if (detalle.detalleDeuda?.stand?.nivel) {
                    console.log('✅ Piso encontrado en detalle de deuda:', detalle.detalleDeuda.stand.nivel)
                    pisos.add(detalle.detalleDeuda.stand.nivel)
                }
            })
        })
        
        const pisosArray = Array.from(pisos).sort((a, b) => a - b)
        console.log('🏠 Pisos disponibles finales:', pisosArray)
        console.log('🔍 Total de recibos analizados:', recibos.length)
        return pisosArray
    }, [recibos])

    // Filtrar y procesar datos
    const datosFiltrados = useMemo(() => {
        let filtered = recibos
        console.log('🔍 Estado actual de filtros:', filtros)
        console.log('Recibos originales:', recibos)

        if (filtros.fechaDesde) {
            filtered = filtered.filter(r => 
                new Date(r.fecharecibo) >= new Date(filtros.fechaDesde)
            )
        }

        if (filtros.fechaHasta) {
            filtered = filtered.filter(r => 
                new Date(r.fecharecibo) <= new Date(filtros.fechaHasta + 'T23:59:59')
            )
        }

        if (filtros.idconcepto_deuda) {
            filtered = filtered.filter(r => 
                r.detalles.some(d => d.idconcepto === parseInt(filtros.idconcepto_deuda))
            )
        }

        if (filtros.estado !== '') {
            filtered = filtered.filter(r => r.estado === (filtros.estado === 'true'))
        }

        if (filtros.piso) {
            console.log('🔍 FILTRO PISO ACTIVO:', filtros.piso)
            console.log('📊 Recibos antes del filtro:', filtered.length)
            
            filtered = filtered.filter(r => {
                // Verificar si el recibo tiene un stand con el piso seleccionado
                if (r.stand?.nivel?.toString() === filtros.piso) {
                    console.log('✅ MATCH en stand directo:', r.idrecibo_ingreso, 'piso:', r.stand.nivel)
                    return true
                }
                
                // Verificar si algún detalle tiene un stand con el piso seleccionado
                const hasMatchInDetalles = r.detalles.some(detalle => {
                    const detallePiso = detalle.detalleDeuda?.stand?.nivel?.toString()
                    if (detallePiso === filtros.piso) {
                        console.log('✅ MATCH en detalle:', r.idrecibo_ingreso, 'piso:', detallePiso)
                    }
                    return detallePiso === filtros.piso
                })
                
                return hasMatchInDetalles
            })
            
            console.log('📊 Recibos después del filtro:', filtered.length)
        }

        console.log('Datos filtrados:', filtered)
        return filtered
    }, [recibos, filtros])

    // Calcular estadísticas
    const estadisticas = useMemo(() => {
        const total = datosFiltrados.length
        const activos = datosFiltrados.filter(r => r.estado).length
        const inactivos = total - activos
        
        console.log('Calculando estadísticas para', total, 'recibos')
        
        // Calcular total por conceptos
        const totalPorConcepto = {}
        conceptos.forEach(concepto => {
            totalPorConcepto[concepto.idconcepto] = {
                descripcion: concepto.descripcion,
                total: 0,
                cantidad: 0
            }
        })

        datosFiltrados.forEach(recibo => {
            recibo.detalles.forEach(detalle => {
                if (totalPorConcepto[detalle.idconcepto]) {
                    totalPorConcepto[detalle.idconcepto].total += parseFloat(detalle.monto)
                    totalPorConcepto[detalle.idconcepto].cantidad += 1
                }
            })
        })

        const totalMonto = Object.values(totalPorConcepto).reduce((sum, concepto) => sum + concepto.total, 0)
        
        console.log('Estadísticas calculadas:', { total, activos, inactivos, totalMonto, totalPorConcepto })

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
            idconcepto_deuda: '',
            estado: '',
            piso: ''
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
                <h1 className="text-2xl font-bold text-white">Reporte de Ingresos por Conceptos</h1>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">Filtros</h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            label="Concepto de deuda"
                            placeholder="Seleccionar concepto"
                            value={filtros.idconcepto_deuda}
                            onChange={(e) => setFiltros(prev => ({ ...prev, idconcepto_deuda: e.target.value }))}
                        >
                            <SelectItem key="" value="">Todos los conceptos</SelectItem>
                            {conceptos.map((concepto) => (
                                <SelectItem key={concepto.idconcepto} value={concepto.idconcepto.toString()}>
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
                                            console.log('🔄 Cambiando piso a: Todos')
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
                                                console.log('🔄 Cambiando piso a:', piso)
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
                                    <ReporteIngresosConceptosPDF
                                        datos={datosFiltrados}
                                        filtros={filtros}
                                        estadisticas={estadisticas}
                                        conceptos={conceptos}
                                    />
                                }
                                fileName={`Reporte_Ingresos_Conceptos_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`}
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
                                    <th className="px-4 py-2 text-left">Stand/Cliente</th>
                                    <th className="px-4 py-2 text-left">Conceptos</th>
                                    <th className="px-4 py-2 text-right">Total</th>
                                    <th className="px-4 py-2 text-center">Estado</th>
                                    <th className="px-4 py-2 text-left">Creado por</th>
                                </tr>
                            </thead>
                            <tbody>
                                {datosFiltrados.map((recibo) => (
                                    <tr key={recibo.idrecibo_ingreso} className="border-b">
                                        <td className="px-4 py-2">{recibo.numerorecibo}</td>
                                        <td className="px-4 py-2">
                                            {new Date(recibo.fecharecibo).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="space-y-1">
                                                {recibo.stand && (
                                                    <div className="text-sm">
                                                        <span className="font-medium">Stand {recibo.stand.descripcion}</span>
                                                        {recibo.stand.nivel && (
                                                            <span className="text-blue-600 ml-1">
                                                                - Piso {recibo.stand.nivel}
                                                            </span>
                                                        )}
                                                        {recibo.stand.client && (
                                                            <span className="text-gray-600 ml-2">
                                                                - {recibo.stand.client.nombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {recibo.detalles.map((detalle, index) => {
                                                    if (detalle.detalleDeuda?.stand) {
                                                        return (
                                                            <div key={index} className="text-sm">
                                                                <span className="font-medium">Stand {detalle.detalleDeuda.stand.descripcion}</span>
                                                                {detalle.detalleDeuda.stand.nivel && (
                                                                    <span className="text-blue-600 ml-1">
                                                                        - Piso {detalle.detalleDeuda.stand.nivel}
                                                                    </span>
                                                                )}
                                                                {detalle.detalleDeuda.stand.client && (
                                                                    <span className="text-gray-600 ml-2">
                                                                        - {detalle.detalleDeuda.stand.client.nombre}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="space-y-1">
                                                {recibo.detalles.map((detalle, index) => (
                                                    <div key={index} className="text-sm">
                                                        <span className="font-medium">
                                                            {conceptos.find(c => c.idconcepto === detalle.idconcepto)?.descripcion}
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
