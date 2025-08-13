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
import { FaSearch, FaPrint, FaFilter } from 'react-icons/fa'

export default function EstatusStandsPage() {
    const [stands, setStands] = useState([])
    const [deudas, setDeudas] = useState([])
    const [inquilinosActivos, setInquilinosActivos] = useState({})
    const [loading, setLoading] = useState(true)
    const [filterStand, setFilterStand] = useState('')
    const [filterInquilino, setFilterInquilino] = useState('')
    const [filterCliente, setFilterCliente] = useState('')
    const [selectedStand, setSelectedStand] = useState('')
    const [selectedInquilino, setSelectedInquilino] = useState('')
    const [selectedStandForDetail, setSelectedStandForDetail] = useState(null)
    
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

    // Cargar inquilinos activos para todos los stands
    const cargarInquilinosActivos = async (standsData) => {
        const inquilinosData = {}
        for (const stand of standsData) {
            try {
                const response = await fetch(`/api/inquilino-stand?idstand=${stand.idstand}`)
                if (response.ok) {
                    const data = await response.json()
                    const inquilinoActivo = data.find(item => item.actual)
                    if (inquilinoActivo) {
                        inquilinosData[stand.idstand] = {
                            ...inquilinoActivo.inquilino,
                            fecha_inicio: inquilinoActivo.fecha_inicio
                        }
                    }
                }
            } catch (error) {
                console.error(`Error cargando inquilino para stand ${stand.idstand}:`, error)
            }
        }
        setInquilinosActivos(inquilinosData)
    }

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const [standsRes, deudasRes] = await Promise.all([
                fetch('/api/stands?includeClient=true'),
                fetch('/api/reg-deuda-detalle')
            ])

            if (!standsRes.ok) throw new Error('Error cargando stands')
            if (!deudasRes.ok) throw new Error('Error cargando deudas')

            const standsData = await standsRes.json()
            const deudasData = await deudasRes.json()

            setStands(standsData)
            setDeudas(deudasData)
            
            // Cargar inquilinos activos después de cargar stands
            await cargarInquilinosActivos(standsData)
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

    // Obtener inquilinos activos por stand
    const getInquilinoActivo = (idstand) => {
        return inquilinosActivos[idstand] || null
    }

    // Obtener deudas del cliente (conceptos donde inquilinopaga = false)
    const getDeudasCliente = (idstand) => {
        return deudas.filter(deuda => 
            deuda.idstand === idstand && 
            deuda.concepto && 
            !deuda.concepto.inquilinopaga
        )
    }

    // Obtener deudas del inquilino (conceptos donde inquilinopaga = true)
    const getDeudasInquilino = (idstand) => {
        return deudas.filter(deuda => 
            deuda.idstand === idstand && 
            deuda.concepto && 
            deuda.concepto.inquilinopaga
        )
    }

    // Calcular total de deudas del cliente
    const getTotalDeudasCliente = (idstand) => {
        const deudasCliente = getDeudasCliente(idstand)
        return deudasCliente.reduce((total, deuda) => {
            const monto = parseFloat(deuda.monto) || 0
            const mora = parseFloat(deuda.mora) || 0
            return total + monto + mora
        }, 0)
    }

    // Calcular total de deudas del inquilino
    const getTotalDeudasInquilino = (idstand) => {
        const deudasInquilino = getDeudasInquilino(idstand)
        return deudasInquilino.reduce((total, deuda) => {
            const monto = parseFloat(deuda.monto) || 0
            const mora = parseFloat(deuda.mora) || 0
            return total + monto + mora
        }, 0)
    }

    // Calcular total pagado del cliente
    const getTotalPagadoCliente = (idstand) => {
        const deudasCliente = getDeudasCliente(idstand)
        return deudasCliente.reduce((total, deuda) => {
            return total + (Number(deuda.totalPagado) || 0)
        }, 0)
    }

    // Calcular total pagado del inquilino
    const getTotalPagadoInquilino = (idstand) => {
        const deudasInquilino = getDeudasInquilino(idstand)
        return deudasInquilino.reduce((total, deuda) => {
            return total + (Number(deuda.totalPagado) || 0)
        }, 0)
    }

    // Función para abrir el modal de detalle
    const openDetailModal = (stand) => {
        setSelectedStandForDetail(stand)
        onDetailOpen()
    }

    // Calcular deudas por stand
    const getDeudasPorStand = (idstand) => {
        return deudas.filter(deuda => deuda.idstand === idstand && deuda.estado)
    }

    // Calcular total de deudas por stand
    const getTotalDeudasStand = (idstand) => {
        const deudasStand = getDeudasPorStand(idstand)
        return deudasStand.reduce((total, deuda) => {
            const monto = Number(deuda.monto) || 0
            const mora = Number(deuda.mora) || 0
            return total + monto + mora
        }, 0)
    }

    // Calcular total pagado por stand
    const getTotalPagadoStand = (idstand) => {
        const deudasStand = getDeudasPorStand(idstand)
        return deudasStand.reduce((total, deuda) => {
            return total + (Number(deuda.totalPagado) || 0)
        }, 0)
    }

    // Calcular saldo pendiente por stand
    const getSaldoPendienteStand = (idstand) => {
        const totalDeudas = getTotalDeudasStand(idstand)
        const totalPagado = getTotalPagadoStand(idstand)
        return Math.max(0, totalDeudas - totalPagado)
    }

    // Filtrar stands según criterios
    const filteredStands = useMemo(() => {
        let filtered = stands

        if (filterStand) {
            filtered = filtered.filter(stand => 
                stand.descripcion.toLowerCase().includes(filterStand.toLowerCase())
            )
        }

        if (filterCliente) {
            filtered = filtered.filter(stand => 
                stand.client?.nombre.toLowerCase().includes(filterCliente.toLowerCase())
            )
        }

        if (filterInquilino) {
            filtered = filtered.filter(stand => {
                const inquilino = getInquilinoActivo(stand.idstand)
                return inquilino?.nombre.toLowerCase().includes(filterInquilino.toLowerCase())
            })
        }

        if (selectedStand) {
            filtered = filtered.filter(stand => stand.idstand === parseInt(selectedStand))
        }

        if (selectedInquilino) {
            filtered = filtered.filter(stand => {
                const inquilino = getInquilinoActivo(stand.idstand)
                return inquilino?.idinquilino === parseInt(selectedInquilino)
            })
        }

        return filtered
    }, [stands, filterStand, filterCliente, filterInquilino, selectedStand, selectedInquilino, inquilinosActivos])



    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Spinner size="lg" />
        </div>
    )

    return (
        <div className="p-4">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Reporte de Estatus de Stands</h1>
                <div className="flex gap-2">
                    <Button 
                        color="secondary" 
                        onPress={handlePrint}
                        startContent={<FaPrint />}
                    >
                        Imprimir
                    </Button>
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
                        <Input
                            placeholder="Buscar por stand..."
                            value={filterStand}
                            onChange={(e) => setFilterStand(e.target.value)}
                            startContent={<FaSearch />}
                        />
                        <Input
                            placeholder="Buscar por cliente..."
                            value={filterCliente}
                            onChange={(e) => setFilterCliente(e.target.value)}
                            startContent={<FaSearch />}
                        />
                        <Input
                            placeholder="Buscar por inquilino..."
                            value={filterInquilino}
                            onChange={(e) => setFilterInquilino(e.target.value)}
                            startContent={<FaSearch />}
                        />
                        <Select
                            placeholder="Filtrar por stand específico"
                            value={selectedStand}
                            onChange={(e) => setSelectedStand(e.target.value)}
                        >
                            <SelectItem key="" value="">Todos los stands</SelectItem>
                            {stands.map(stand => (
                                <SelectItem key={stand.idstand} value={stand.idstand.toString()}>
                                    {stand.descripcion}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                </CardBody>
            </Card>

            {/* Tabla de resultados */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">
                        Estatus Financiero de Stands ({filteredStands.length} resultados)
                    </h3>
                </CardHeader>
                <CardBody>
                    <Table aria-label="Estatus de stands">
                        <TableHeader>
                            <TableColumn>Stand</TableColumn>
                            <TableColumn>Cliente</TableColumn>
                            <TableColumn>Inquilino Activo</TableColumn>
                            <TableColumn>Total Deudas</TableColumn>
                            <TableColumn>Total Pagado</TableColumn>
                            <TableColumn>Saldo Pendiente</TableColumn>
                            <TableColumn>Estado</TableColumn>
                            <TableColumn>Acciones</TableColumn>
                        </TableHeader>
                        <TableBody>
                            {filteredStands.map(stand => {
                                const inquilino = getInquilinoActivo(stand.idstand)
                                const totalDeudas = getTotalDeudasStand(stand.idstand)
                                const totalPagado = getTotalPagadoStand(stand.idstand)
                                const saldoPendiente = getSaldoPendienteStand(stand.idstand)
                                
                                return (
                                    <TableRow key={stand.idstand}>
                                        <TableCell>
                                            <div className="font-semibold">{stand.descripcion}</div>
                                            <div className="text-sm text-gray-500">Nivel {stand.nivel}</div>
                                        </TableCell>
                                        <TableCell>
                                            {stand.client ? (
                                                <div>
                                                    <div className="font-medium">{stand.client.nombre}</div>
                                                    <div className="text-sm text-gray-500">ID: {stand.client.idcliente}</div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin cliente asignado</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {inquilino ? (
                                                <div>
                                                    <Chip color="success" variant="flat" size="sm">
                                                        {inquilino.nombre}
                                                    </Chip>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Desde: {format(new Date(inquilino.fecha_inicio), 'dd/MM/yyyy', { locale: es })}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">Sin inquilino activo</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip color="danger" variant="flat">
                                                S/. {totalDeudas.toFixed(2)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            <Chip color="success" variant="flat">
                                                S/. {totalPagado.toFixed(2)}
                                            </Chip>
                                        </TableCell>
                                        <TableCell>
                                            {saldoPendiente > 0 ? (
                                                <Chip color="warning" variant="flat">
                                                    S/. {saldoPendiente.toFixed(2)}
                                                </Chip>
                                            ) : (
                                                <Chip color="success" variant="flat">
                                                    Pagado
                                                </Chip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {saldoPendiente > 0 ? (
                                                <Chip color="warning" variant="flat" size="sm">
                                                    Pendiente
                                                </Chip>
                                            ) : (
                                                <Chip color="success" variant="flat" size="sm">
                                                    Al día
                                                </Chip>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                color="primary"
                                                variant="flat"
                                                onPress={() => openDetailModal(stand)}
                                            >
                                                Ver Detalle
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardBody>
            </Card>

            {/* Modal de Detalle Financiero */}
            <Modal 
                isOpen={isDetailOpen} 
                onClose={onDetailClose}
                size="4xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h3 className="text-lg font-semibold">
                                    Detalle Financiero - {selectedStandForDetail?.descripcion}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Cliente: {selectedStandForDetail?.client?.nombre}
                                </p>
                            </ModalHeader>
                            <ModalBody>
                                {selectedStandForDetail && (
                                    <div className="space-y-6">
                                        {/* Resumen General */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-red-600">
                                                    S/. {getTotalDeudasStand(selectedStandForDetail.idstand).toFixed(2)}
                                                </div>
                                                <div className="text-sm text-gray-600">Total Deudas</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">
                                                    S/. {getTotalPagadoStand(selectedStandForDetail.idstand).toFixed(2)}
                                                </div>
                                                <div className="text-sm text-gray-600">Total Pagado</div>
                                            </div>
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${getSaldoPendienteStand(selectedStandForDetail.idstand) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    S/. {getSaldoPendienteStand(selectedStandForDetail.idstand).toFixed(2)}
                                                </div>
                                                <div className="text-sm text-gray-600">Saldo Pendiente</div>
                                            </div>
                                        </div>

                                        {/* Deudas del Cliente */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-blue-600 border-b border-blue-200 pb-2">
                                                Deudas del Cliente
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
                                                <div className="text-center">
                                                    <div className="text-xl font-bold text-red-600">
                                                        S/. {getTotalDeudasCliente(selectedStandForDetail.idstand).toFixed(2)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Total Deudas</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-xl font-bold text-green-600">
                                                        S/. {getTotalPagadoCliente(selectedStandForDetail.idstand).toFixed(2)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Total Pagado</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className={`text-xl font-bold ${(getTotalDeudasCliente(selectedStandForDetail.idstand) - getTotalPagadoCliente(selectedStandForDetail.idstand)) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        S/. {(getTotalDeudasCliente(selectedStandForDetail.idstand) - getTotalPagadoCliente(selectedStandForDetail.idstand)).toFixed(2)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">Saldo Pendiente</div>
                                                </div>
                                            </div>
                                            
                                            {/* Tabla de deudas del cliente */}
                                            {getDeudasCliente(selectedStandForDetail.idstand).length > 0 ? (
                                                <Table aria-label="Deudas del cliente" className="min-h-[200px]">
                                                    <TableHeader>
                                                        <TableColumn>Concepto</TableColumn>
                                                        <TableColumn>Fecha</TableColumn>
                                                        <TableColumn>Monto</TableColumn>
                                                        <TableColumn>Mora</TableColumn>
                                                        <TableColumn>Pagado</TableColumn>
                                                        <TableColumn>Saldo</TableColumn>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {getDeudasCliente(selectedStandForDetail.idstand).map((deuda, index) => {
                                                            const saldo = (parseFloat(deuda.monto) + parseFloat(deuda.mora || 0)) - parseFloat(deuda.totalPagado || 0)
                                                            return (
                                                                <TableRow key={index}>
                                                                    <TableCell>{deuda.concepto?.descripcion || 'Sin concepto'}</TableCell>
                                                                    <TableCell>{format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.monto).toFixed(2)}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.mora || 0).toFixed(2)}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.totalPagado || 0).toFixed(2)}</TableCell>
                                                                    <TableCell>
                                                                        <Chip 
                                                                            color={saldo > 0 ? "danger" : "success"} 
                                                                            variant="flat" 
                                                                            size="sm"
                                                                        >
                                                                            S/. {saldo.toFixed(2)}
                                                                        </Chip>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                    <p className="text-gray-500">No hay deudas registradas para el cliente</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Deudas del Inquilino */}
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-semibold text-purple-600 border-b border-purple-200 pb-2">
                                                Deudas del Inquilino
                                            </h4>
                                            {getInquilinoActivo(selectedStandForDetail.idstand) ? (
                                                <>
                                                    <div className="p-3 bg-purple-50 rounded-lg">
                                                        <p className="text-sm text-purple-700">
                                                            <strong>Inquilino Activo:</strong> {getInquilinoActivo(selectedStandForDetail.idstand).nombre}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50 rounded-lg">
                                                        <div className="text-center">
                                                            <div className="text-xl font-bold text-red-600">
                                                                S/. {getTotalDeudasInquilino(selectedStandForDetail.idstand).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Total Deudas</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xl font-bold text-green-600">
                                                                S/. {getTotalPagadoInquilino(selectedStandForDetail.idstand).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Total Pagado</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className={`text-xl font-bold ${(getTotalDeudasInquilino(selectedStandForDetail.idstand) - getTotalPagadoInquilino(selectedStandForDetail.idstand)) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                                S/. {(getTotalDeudasInquilino(selectedStandForDetail.idstand) - getTotalPagadoInquilino(selectedStandForDetail.idstand)).toFixed(2)}
                                                            </div>
                                                            <div className="text-sm text-gray-600">Saldo Pendiente</div>
                                                        </div>
                                                    </div>
                                                    
                                                                                                {/* Tabla de deudas del inquilino */}
                                            {getDeudasInquilino(selectedStandForDetail.idstand).length > 0 ? (
                                                <Table aria-label="Deudas del inquilino" className="min-h-[200px]">
                                                    <TableHeader>
                                                        <TableColumn>Concepto</TableColumn>
                                                        <TableColumn>Fecha</TableColumn>
                                                        <TableColumn>Monto</TableColumn>
                                                        <TableColumn>Mora</TableColumn>
                                                        <TableColumn>Pagado</TableColumn>
                                                        <TableColumn>Saldo</TableColumn>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {getDeudasInquilino(selectedStandForDetail.idstand).map((deuda, index) => {
                                                            const saldo = (parseFloat(deuda.monto) + parseFloat(deuda.mora || 0)) - parseFloat(deuda.totalPagado || 0)
                                                            return (
                                                                <TableRow key={index}>
                                                                    <TableCell>{deuda.concepto?.descripcion || 'Sin concepto'}</TableCell>
                                                                    <TableCell>{format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.monto).toFixed(2)}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.mora || 0).toFixed(2)}</TableCell>
                                                                    <TableCell>S/. {parseFloat(deuda.totalPagado || 0).toFixed(2)}</TableCell>
                                                                    <TableCell>
                                                                        <Chip 
                                                                            color={saldo > 0 ? "danger" : "success"} 
                                                                            variant="flat" 
                                                                            size="sm"
                                                                        >
                                                                            S/. {saldo.toFixed(2)}
                                                                        </Chip>
                                                                    </TableCell>
                                                                </TableRow>
                                                            )
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                    <p className="text-gray-500">No hay deudas registradas para el inquilino</p>
                                                </div>
                                            )}
                                                </>
                                            ) : (
                                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                                    <p className="text-gray-500">No hay inquilino activo asignado a este stand</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cerrar
                                </Button>
                                <Button 
                                    color="primary" 
                                    onPress={handleDetailPrint}
                                    startContent={<FaPrint />}
                                >
                                    Imprimir Detalle
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {/* Componente oculto para impresión del detalle */}
            <div style={{ display: 'none' }}>
                <div ref={detailPrintRef} className="detail-container">
                    {selectedStandForDetail && (
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-center mb-6">Detalle Financiero - {selectedStandForDetail.descripcion}</h1>
                            <div className="text-center mb-4">
                                <p className="text-lg"><strong>Cliente:</strong> {selectedStandForDetail.client?.nombre || 'Sin cliente'}</p>
                                <p className="text-lg"><strong>Inquilino Activo:</strong> {getInquilinoActivo(selectedStandForDetail.idstand)?.nombre || 'Sin inquilino'}</p>
                                <p className="text-sm text-gray-600">Fecha: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                            </div>
                            
                            {/* Resumen General */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-center">Resumen General</h2>
                                <table className="w-full border-collapse border border-gray-300 mb-6">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 p-3 text-center">Total Deudas</th>
                                            <th className="border border-gray-300 p-3 text-center">Total Pagado</th>
                                            <th className="border border-gray-300 p-3 text-center">Saldo Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="border border-gray-300 p-3 text-center font-bold text-red-600">
                                                S/. {getTotalDeudasStand(selectedStandForDetail.idstand).toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-3 text-center font-bold text-green-600">
                                                S/. {getTotalPagadoStand(selectedStandForDetail.idstand).toFixed(2)}
                                            </td>
                                            <td className="border border-gray-300 p-3 text-center font-bold text-orange-600">
                                                S/. {getSaldoPendienteStand(selectedStandForDetail.idstand).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Deudas del Cliente */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-blue-600">Deudas del Cliente</h2>
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="text-center p-3 bg-blue-50 rounded">
                                        <div className="text-lg font-bold text-red-600">S/. {getTotalDeudasCliente(selectedStandForDetail.idstand).toFixed(2)}</div>
                                        <div className="text-sm">Total Deudas</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded">
                                        <div className="text-lg font-bold text-green-600">S/. {getTotalPagadoCliente(selectedStandForDetail.idstand).toFixed(2)}</div>
                                        <div className="text-sm">Total Pagado</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded">
                                        <div className="text-lg font-bold text-orange-600">S/. {(getTotalDeudasCliente(selectedStandForDetail.idstand) - getTotalPagadoCliente(selectedStandForDetail.idstand)).toFixed(2)}</div>
                                        <div className="text-sm">Saldo Pendiente</div>
                                    </div>
                                </div>
                                
                                <table className="w-full border-collapse border border-gray-300">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="border border-gray-300 p-2 text-left">Concepto</th>
                                            <th className="border border-gray-300 p-2 text-center">Fecha</th>
                                            <th className="border border-gray-300 p-2 text-right">Monto</th>
                                            <th className="border border-gray-300 p-2 text-right">Mora</th>
                                            <th className="border border-gray-300 p-2 text-right">Pagado</th>
                                            <th className="border border-gray-300 p-2 text-right">Saldo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getDeudasCliente(selectedStandForDetail.idstand).map((deuda, index) => {
                                            const saldo = (parseFloat(deuda.monto) + parseFloat(deuda.mora || 0)) - parseFloat(deuda.totalPagado || 0)
                                            return (
                                                <tr key={index}>
                                                    <td className="border border-gray-300 p-2">{deuda.concepto?.descripcion || 'Sin concepto'}</td>
                                                    <td className="border border-gray-300 p-2 text-center">{format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</td>
                                                    <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.monto).toFixed(2)}</td>
                                                    <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.mora || 0).toFixed(2)}</td>
                                                    <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.totalPagado || 0).toFixed(2)}</td>
                                                    <td className="border border-gray-300 p-2 text-right font-bold">S/. {saldo.toFixed(2)}</td>
                                                </tr>
                                            )
                                        })}
                                        {getDeudasCliente(selectedStandForDetail.idstand).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500">
                                                    No hay deudas registradas para el cliente
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Deudas del Inquilino */}
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4 text-purple-600">Deudas del Inquilino</h2>
                                {getInquilinoActivo(selectedStandForDetail.idstand) ? (
                                    <>
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-purple-50 rounded">
                                                <div className="text-lg font-bold text-red-600">S/. {getTotalDeudasInquilino(selectedStandForDetail.idstand).toFixed(2)}</div>
                                                <div className="text-sm">Total Deudas</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded">
                                                <div className="text-lg font-bold text-green-600">S/. {getTotalPagadoInquilino(selectedStandForDetail.idstand).toFixed(2)}</div>
                                                <div className="text-sm">Total Pagado</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded">
                                                <div className="text-lg font-bold text-orange-600">S/. {(getTotalDeudasInquilino(selectedStandForDetail.idstand) - getTotalPagadoInquilino(selectedStandForDetail.idstand)).toFixed(2)}</div>
                                                <div className="text-sm">Saldo Pendiente</div>
                                            </div>
                                        </div>
                                        
                                        <table className="w-full border-collapse border border-gray-300">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 p-2 text-left">Concepto</th>
                                                    <th className="border border-gray-300 p-2 text-center">Fecha</th>
                                                    <th className="border border-gray-300 p-2 text-right">Monto</th>
                                                    <th className="border border-gray-300 p-2 text-right">Mora</th>
                                                    <th className="border border-gray-300 p-2 text-right">Pagado</th>
                                                    <th className="border border-gray-300 p-2 text-right">Saldo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {getDeudasInquilino(selectedStandForDetail.idstand).map((deuda, index) => {
                                                    const saldo = (parseFloat(deuda.monto) + parseFloat(deuda.mora || 0)) - parseFloat(deuda.totalPagado || 0)
                                                    return (
                                                        <tr key={index}>
                                                            <td className="border border-gray-300 p-2">{deuda.concepto?.descripcion || 'Sin concepto'}</td>
                                                            <td className="border border-gray-300 p-2 text-center">{format(new Date(deuda.fechadeudaStand), 'dd/MM/yyyy', { locale: es })}</td>
                                                            <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.monto).toFixed(2)}</td>
                                                            <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.mora || 0).toFixed(2)}</td>
                                                            <td className="border border-gray-300 p-2 text-right">S/. {parseFloat(deuda.totalPagado || 0).toFixed(2)}</td>
                                                            <td className="border border-gray-300 p-2 text-right font-bold">S/. {saldo.toFixed(2)}</td>
                                                        </tr>
                                                    )
                                                })}
                                                {getDeudasInquilino(selectedStandForDetail.idstand).length === 0 && (
                                                    <tr>
                                                        <td colSpan={6} className="border border-gray-300 p-4 text-center text-gray-500">
                                                            No hay deudas registradas para el inquilino
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded text-center">
                                        <p className="text-gray-500">No hay inquilino activo asignado a este stand</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Componente oculto para impresión */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="reporte-container">
                    <div className="p-8">
                        <h1 className="text-3xl font-bold text-center mb-8">Reporte de Estatus de Stands</h1>
                        <p className="text-center mb-6">Fecha: {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
                        
                        <table className="w-full border-collapse border border-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-gray-300 p-2 text-left">Stand</th>
                                    <th className="border border-gray-300 p-2 text-left">Cliente</th>
                                    <th className="border border-gray-300 p-2 text-left">Inquilino</th>
                                    <th className="border border-gray-300 p-2 text-right">Total Deudas</th>
                                    <th className="border border-gray-300 p-2 text-right">Total Pagado</th>
                                    <th className="border border-gray-300 p-2 text-right">Saldo Pendiente</th>
                                    <th className="border border-gray-300 p-2 text-center">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStands.map(stand => {
                                    const inquilino = getInquilinoActivo(stand.idstand)
                                    const totalDeudas = getTotalDeudasStand(stand.idstand)
                                    const totalPagado = getTotalPagadoStand(stand.idstand)
                                    const saldoPendiente = getSaldoPendienteStand(stand.idstand)
                                    
                                    return (
                                        <tr key={stand.idstand}>
                                            <td className="border border-gray-300 p-2">{stand.descripcion}</td>
                                            <td className="border border-gray-300 p-2">{stand.client?.nombre || 'Sin cliente'}</td>
                                            <td className="border border-gray-300 p-2">{inquilino?.nombre || 'Sin inquilino'}</td>
                                            <td className="border border-gray-300 p-2 text-right">S/. {totalDeudas.toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-right">S/. {totalPagado.toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-right">S/. {saldoPendiente.toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-center">
                                                {saldoPendiente > 0 ? 'Pendiente' : 'Al día'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                        
                        <div className="mt-8 text-sm text-gray-600">
                            <p><strong>Total de Stands:</strong> {filteredStands.length}</p>
                            <p><strong>Stands con deuda pendiente:</strong> {filteredStands.filter(stand => getSaldoPendienteStand(stand.idstand) > 0).length}</p>
                            <p><strong>Stands al día:</strong> {filteredStands.filter(stand => getSaldoPendienteStand(stand.idstand) === 0).length}</p>
                        </div>
                                         </div>
                 </div>
             </div>
             
             <ToastContainer position="bottom-right" />
         </div>
     )
 } 