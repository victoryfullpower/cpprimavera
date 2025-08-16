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
    Card,
    CardBody,
    CardHeader,
    Chip,
    Spinner,
    Tooltip,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useReactToPrint } from 'react-to-print'
import { useRef } from 'react'
import { FaSearch, FaPrint, FaEye } from 'react-icons/fa'

export default function StatusInquilinoPage() {
    const [inquilinos, setInquilinos] = useState([])
    const [deudas, setDeudas] = useState([])
    const [stands, setStands] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterInquilino, setFilterInquilino] = useState('')
    const [selectedInquilino, setSelectedInquilino] = useState(null)
    
    const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure()
    const printRef = useRef()
    const detailPrintRef = useRef()

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

    const handleDetailPrint = useReactToPrint({
        contentRef: detailPrintRef,
        pageStyle: `
            @page {
                size: A4 portrait;
                margin: 15mm;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                .detail-container, .detail-container * {
                    visibility: visible;
                }
                .detail-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                }
            }
        `,
        onAfterPrint: () => {
            toast.success('Detalle impreso correctamente')
        }
    })

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [inquilinosRes, deudasRes, standsRes] = await Promise.all([
                fetch('/api/inquilinos'),
                fetch('/api/reg-deuda-detalle'),
                fetch('/api/stands?includeClient=true')
            ])

            if (!inquilinosRes.ok) throw new Error('Error cargando inquilinos')
            if (!deudasRes.ok) throw new Error('Error cargando deudas')
            if (!standsRes.ok) throw new Error('Error cargando stands')

            const inquilinosData = await inquilinosRes.json()
            const deudasData = await deudasRes.json()
            const standsData = await standsRes.json()

            console.log('Inquilinos cargados:', inquilinosData)
            console.log('Deudas cargadas:', deudasData)
            console.log('Stands cargados:', standsData)

            setInquilinos(inquilinosData)
            setDeudas(deudasData)
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

    // Filtrar inquilinos
    const filteredInquilinos = useMemo(() => {
        return inquilinos.filter(inquilino =>
            inquilino.nombre.toLowerCase().includes(filterInquilino.toLowerCase())
        )
    }, [inquilinos, filterInquilino])

    // Obtener deudas de un inquilino
    const getDeudasInquilino = (idinquilino) => {
        const deudasFiltradas = deudas.filter(deuda => 
            deuda.idinquilino_activo === idinquilino && 
            deuda.saldoPendiente > 0 &&
            deuda.estado === true
        )
        console.log(`Deudas para inquilino ${idinquilino}:`, deudasFiltradas)
        return deudasFiltradas
    }

    // Obtener stands donde está activo un inquilino
    const getStandsInquilino = (idinquilino) => {
        const standsFiltrados = stands.filter(stand => {
            // Verificar si el stand tiene inquilino_stand y si alguno es el inquilino actual
            return stand.inquilino_stand?.some(is => 
                is.idinquilino === idinquilino && is.actual === true
            )
        })
        console.log(`Stands para inquilino ${idinquilino}:`, standsFiltrados)
        return standsFiltrados
    }

    // Calcular total de deudas de un inquilino
    const getTotalDeudasInquilino = (idinquilino) => {
        const deudasInquilino = getDeudasInquilino(idinquilino)
        return deudasInquilino.reduce((total, deuda) => {
            return total + Number(deuda.saldoPendiente)
        }, 0)
    }

    // Abrir modal de detalle
    const openDetail = (inquilino) => {
        setSelectedInquilino(inquilino)
        onDetailOpen()
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="p-6">
            <ToastContainer />
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Status Inquilino</h1>
                    <p className="text-sm text-gray-600">
                        {filteredInquilinos.length} inquilino{filteredInquilinos.length !== 1 ? 's' : ''} encontrado{filteredInquilinos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        color="primary" 
                        startContent={<FaPrint />}
                        onPress={handlePrint}
                    >
                        Imprimir Reporte
                    </Button>
                </div>
            </div>

            {/* Filtros */}
            <Card className="mb-6">
                <CardBody>
                    <div className="flex gap-4">
                        <Input
                            label="Buscar por Inquilino"
                            placeholder="Nombre del inquilino..."
                            value={filterInquilino}
                            onChange={(e) => setFilterInquilino(e.target.value)}
                            startContent={<FaSearch className="text-gray-400" />}
                            className="max-w-xs"
                        />
                    </div>
                </CardBody>
            </Card>

            {/* Tabla principal */}
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold">Listado de Inquilinos</h2>
                </CardHeader>
                <CardBody>
                    <Table aria-label="Tabla de inquilinos">
                        <TableHeader>
                            <TableColumn>Inquilino</TableColumn>
                            <TableColumn>Stands Activos</TableColumn>
                            <TableColumn>Total Deudas</TableColumn>
                            <TableColumn>Estado</TableColumn>
                            <TableColumn>Acciones</TableColumn>
                        </TableHeader>
                        <TableBody emptyContent={
                            filterInquilino ? 'No se encontraron inquilinos con ese nombre' : 'No hay inquilinos registrados'
                        }>
                            {filteredInquilinos.map((inquilino) => {
                                const totalDeudas = getTotalDeudasInquilino(inquilino.idinquilino)
                                const standsActivos = getStandsInquilino(inquilino.idinquilino)
                                const tieneDeudas = totalDeudas > 0
                                
                                return (
                                    <TableRow key={inquilino.idinquilino}>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">{inquilino.nombre}</p>
                                                <p className="text-sm text-gray-500">ID: {inquilino.idinquilino}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {standsActivos.length > 0 ? (
                                                <div className="space-y-1">
                                                    {standsActivos.map((stand, index) => (
                                                        <Chip 
                                                            key={stand.idstand} 
                                                            color="success" 
                                                            variant="flat" 
                                                            size="sm"
                                                        >
                                                            {stand.descripcion} - {stand.client?.nombre || 'Sin cliente'}
                                                        </Chip>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin stands activos</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {tieneDeudas ? (
                                                <Chip color="danger" variant="flat">
                                                    S/. {totalDeudas.toFixed(2)}
                                                </Chip>
                                            ) : (
                                                <Chip color="success" variant="flat">
                                                    Sin deudas
                                                </Chip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                color={tieneDeudas ? "warning" : "success"} 
                                                variant="flat"
                                            >
                                                {tieneDeudas ? "Con Deudas" : "Al Día"}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Tooltip content="Ver Detalle">
                                                <Button
                                                    isIconOnly
                                                    size="sm"
                                                    color="primary"
                                                    variant="light"
                                                    onPress={() => openDetail(inquilino)}
                                                >
                                                    <FaEye />
                                                </Button>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Modal de Detalle */}
            <Modal 
                isOpen={isDetailOpen} 
                onClose={onDetailClose}
                size="5xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <div className="flex justify-between items-center w-full">
                                    <span>Detalle del Inquilino: {selectedInquilino?.nombre}</span>
                                    <Button 
                                        color="primary" 
                                        startContent={<FaPrint />}
                                        onPress={handleDetailPrint}
                                    >
                                        Imprimir Detalle
                                    </Button>
                                </div>
                            </ModalHeader>
                            <ModalBody>
                                {selectedInquilino && (
                                    <div className="space-y-6">
                                        {/* Información del Inquilino */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">Información del Inquilino</h3>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p><strong>Nombre:</strong> {selectedInquilino.nombre}</p>
                                                        <p><strong>ID:</strong> {selectedInquilino.idinquilino}</p>
                                                    </div>
                                                                                                         <div>
                                                         <p><strong>Estado:</strong> {selectedInquilino.estado ? 'Activo' : 'Inactivo'}</p>
                                                     </div>
                                                </div>
                                            </CardBody>
                                        </Card>

                                        {/* Stands Activos */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">Stands Activos</h3>
                                            </CardHeader>
                                            <CardBody>
                                                {getStandsInquilino(selectedInquilino.idinquilino).length > 0 ? (
                                                    <div className="space-y-2">
                                                        {getStandsInquilino(selectedInquilino.idinquilino).map((stand) => (
                                                            <div key={stand.idstand} className="p-3 border rounded-lg">
                                                                <p><strong>Stand:</strong> {stand.descripcion}</p>
                                                                <p><strong>Cliente:</strong> {stand.client?.nombre || 'Sin cliente'}</p>
                                                                <p><strong>Nivel:</strong> {stand.nivel}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500">No tiene stands activos</p>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {/* Deudas Pendientes */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">Deudas Pendientes</h3>
                                            </CardHeader>
                                            <CardBody>
                                                {getDeudasInquilino(selectedInquilino.idinquilino).length > 0 ? (
                                                    <div className="space-y-2">
                                                        {getDeudasInquilino(selectedInquilino.idinquilino).map((deuda) => (
                                                            <div key={deuda.idregdeuda_detalle} className="p-3 border rounded-lg">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div>
                                                                        <p><strong>Concepto:</strong> {deuda.concepto?.descripcion}</p>
                                                                        <p><strong>Stand:</strong> {deuda.stand?.descripcion}</p>
                                                                        <p><strong>Fecha:</strong> {format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p><strong>Monto:</strong> S/. {Number(deuda.monto).toFixed(2)}</p>
                                                                        <p><strong>Mora:</strong> S/. {Number(deuda.mora || 0).toFixed(2)}</p>
                                                                        <p><strong>Saldo:</strong> S/. {Number(deuda.saldoPendiente).toFixed(2)}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-green-600 font-semibold">No tiene deudas pendientes</p>
                                                )}
                                            </CardBody>
                                        </Card>

                                        {/* Resumen */}
                                        <Card>
                                            <CardHeader>
                                                <h3 className="text-lg font-semibold">Resumen</h3>
                                            </CardHeader>
                                            <CardBody>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="p-4 bg-blue-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-blue-600">
                                                            {getStandsInquilino(selectedInquilino.idinquilino).length}
                                                        </p>
                                                        <p className="text-sm text-blue-800">Stands Activos</p>
                                                    </div>
                                                    <div className="p-4 bg-orange-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-orange-600">
                                                            {getDeudasInquilino(selectedInquilino.idinquilino).length}
                                                        </p>
                                                        <p className="text-sm text-orange-800">Deudas Pendientes</p>
                                                    </div>
                                                    <div className="p-4 bg-red-50 rounded-lg">
                                                        <p className="text-2xl font-bold text-red-600">
                                                            S/. {getTotalDeudasInquilino(selectedInquilino.idinquilino).toFixed(2)}
                                                        </p>
                                                        <p className="text-sm text-red-800">Total Deudas</p>
                                                    </div>
                                                </div>
                                            </CardBody>
                                        </Card>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Contenido para impresión del reporte principal */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="reporte-container">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-6">Reporte Status Inquilino</h1>
                        <p className="text-sm text-gray-600 mb-4">
                            Generado el: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left">Inquilino</th>
                                    <th className="border border-gray-300 p-2 text-left">Stands Activos</th>
                                    <th className="border border-gray-300 p-2 text-right">Total Deudas</th>
                                    <th className="border border-gray-300 p-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInquilinos.map((inquilino) => {
                                    const totalDeudas = getTotalDeudasInquilino(inquilino.idinquilino)
                                    const standsActivos = getStandsInquilino(inquilino.idinquilino)
                                    const tieneDeudas = totalDeudas > 0
                                    
                                    return (
                                        <tr key={inquilino.idinquilino}>
                                            <td className="border border-gray-300 p-2">
                                                <p className="font-semibold">{inquilino.nombre}</p>
                                                <p className="text-sm text-gray-500">ID: {inquilino.idinquilino}</p>
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                {standsActivos.length > 0 ? (
                                                    standsActivos.map((stand, index) => (
                                                        <div key={stand.idstand} className="text-sm">
                                                            {stand.descripcion} - {stand.client?.nombre || 'Sin cliente'}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-gray-400">Sin stands activos</span>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-right">
                                                {tieneDeudas ? (
                                                    <span className="font-semibold text-red-600">
                                                        S/. {totalDeudas.toFixed(2)}
                                                    </span>
                                                ) : (
                                                    <span className="text-green-600">Sin deudas</span>
                                                )}
                                            </td>
                                            <td className="border border-gray-300 p-2 text-center">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    tieneDeudas ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {tieneDeudas ? "Con Deudas" : "Al Día"}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Contenido para impresión del detalle */}
            <div style={{ display: 'none' }}>
                <div ref={detailPrintRef} className="detail-container">
                    {selectedInquilino && (
                        <div className="p-6">
                            <h1 className="text-2xl font-bold mb-6">Detalle del Inquilino: {selectedInquilino.nombre}</h1>
                            <p className="text-sm text-gray-600 mb-4">
                                Generado el: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                            
                            <div className="space-y-6">
                                                                 <div>
                                     <h3 className="text-lg font-semibold mb-2">Información del Inquilino</h3>
                                     <p><strong>Nombre:</strong> {selectedInquilino.nombre}</p>
                                     <p><strong>ID:</strong> {selectedInquilino.idinquilino}</p>
                                     <p><strong>Estado:</strong> {selectedInquilino.estado ? 'Activo' : 'Inactivo'}</p>
                                 </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Stands Activos</h3>
                                    {getStandsInquilino(selectedInquilino.idinquilino).length > 0 ? (
                                        getStandsInquilino(selectedInquilino.idinquilino).map((stand) => (
                                            <div key={stand.idstand} className="mb-2">
                                                <p><strong>Stand:</strong> {stand.descripcion}</p>
                                                <p><strong>Cliente:</strong> {stand.client?.nombre || 'Sin cliente'}</p>
                                                <p><strong>Nivel:</strong> {stand.nivel}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500">No tiene stands activos</p>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Deudas Pendientes</h3>
                                    {getDeudasInquilino(selectedInquilino.idinquilino).length > 0 ? (
                                        getDeudasInquilino(selectedInquilino.idinquilino).map((deuda) => (
                                            <div key={deuda.idregdeuda_detalle} className="mb-2 p-2 border rounded">
                                                <p><strong>Concepto:</strong> {deuda.concepto?.descripcion}</p>
                                                <p><strong>Stand:</strong> {deuda.stand?.descripcion}</p>
                                                <p><strong>Fecha:</strong> {format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</p>
                                                <p><strong>Monto:</strong> S/. {Number(deuda.monto).toFixed(2)}</p>
                                                <p><strong>Mora:</strong> S/. {Number(deuda.mora || 0).toFixed(2)}</p>
                                                <p><strong>Saldo:</strong> S/. {Number(deuda.saldoPendiente).toFixed(2)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-green-600 font-semibold">No tiene deudas pendientes</p>
                                    )}
                                </div>
                                
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Resumen</h3>
                                    <p><strong>Stands Activos:</strong> {getStandsInquilino(selectedInquilino.idinquilino).length}</p>
                                    <p><strong>Deudas Pendientes:</strong> {getDeudasInquilino(selectedInquilino.idinquilino).length}</p>
                                    <p><strong>Total Deudas:</strong> S/. {getTotalDeudasInquilino(selectedInquilino.idinquilino).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
