'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
    Chip,
    Tooltip,
    Select,
    SelectItem
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import { useReactToPrint } from 'react-to-print'
import FormReciboEgreso from '@/components/FormReciboEgreso'
import ReciboEgresoPrint from '@/components/ReciboEgresoPrint'
import PrinterIcon from '@/components/iconos/PrinterIcon'
import DeleteIcon from '@/components/iconos/DeleteIcon'
import PowerIcon from '@/components/iconos/PowerIcon'
import EditIcon from '@/components/iconos/EditIcon'
import { useSession } from '@/context/SessionContext'
export default function RecibosEgresoPage() {
    const session = useSession()
    const [recibos, setRecibos] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentRecibo, setCurrentRecibo] = useState(null)

    // Opciones para registros por página
    const rowsPerPageOptions = [
        { key: "10", label: "10" },
        { key: "25", label: "25" },
        { key: "50", label: "50" },
        { key: "100", label: "100" },
        { key: "all", label: "Todos" }
    ]

    // Estados para la impresión
    const [reciboParaImprimir, setReciboParaImprimir] = useState(null)
    const [empresa, setEmpresa] = useState(null)
    const [conceptosEgreso, setConceptosEgreso] = useState([])
    const printRef = useRef()

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        pageStyle: `
            @page {
                size: A4 landscape;
                margin: 0;
            }
            @media print {
                body * {
                    visibility: hidden;
                }
                .recibo-container, .recibo-container * {
                    visibility: visible;
                }
                .recibo-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    padding: 10mm;
                    box-sizing: border-box;
                }
                .recibos-horizontales {
                    display: flex;
                    width: 100%;
                    height: 100%;
                }
                .recibo-individual {
                    width: 50%;
                    height: 100%;
                    padding: 10mm;
                    box-sizing: border-box;
                    position: relative;
                }
            }
        `,
        onAfterPrint: () => {
            setReciboParaImprimir(null)
        }
    })

    const fetchData = async () => {
        setLoading(true)
        try {
            const [recibosRes, conceptosRes, empresaRes] = await Promise.all([
                fetch('/api/recibo-egreso').then(res => res.json()),
                fetch('/api/concepto-egreso').then(res => res.json()),
                fetch('/api/empresa').then(res => res.json())
            ])

            setRecibos(recibosRes)
            setConceptosEgreso(conceptosRes)
            if (empresaRes && empresaRes.length > 0) {
                setEmpresa(empresaRes[0])
            }
        } catch (error) {
            toast.error('Error cargando datos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredItems = useMemo(() =>
        recibos.filter(recibo =>
            recibo.numerorecibo_egreso.toString().includes(filter) ||
            (recibo.createdBy?.username.toLowerCase().includes(filter.toLowerCase())) ||
            // Buscar en conceptos
            recibo.detalles?.some(detalle => 
                detalle.concepto?.descripcion?.toLowerCase().includes(filter.toLowerCase())
            ) ||
            // Buscar en descripciones
            recibo.detalles?.some(detalle => 
                detalle.descripcion?.toLowerCase().includes(filter.toLowerCase())
            )
        ), [recibos, filter])

    const paginatedItems = useMemo(() =>
        rowsPerPage === 'all' 
            ? filteredItems 
            : filteredItems.slice((page - 1) * rowsPerPage, page * rowsPerPage)
        , [filteredItems, page, rowsPerPage])

    // Resetear página cuando cambie rowsPerPage
    const handleRowsPerPageChange = (value) => {
        setRowsPerPage(value === 'all' ? 'all' : parseInt(value))
        setPage(1)
    }

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este recibo de egreso?')) return
        try {
            const res = await fetch(`/api/recibo-egreso/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())
            setRecibos(prev => prev.filter(r => r.idrecibo_egreso !== id))
            toast.success('Recibo de egreso eliminado')
        } catch (error) {
            toast.error('Error al eliminar')
        }
    }

    const toggleEstado = async (id, estado) => {
        try {
            const res = await fetch(`/api/recibo-egreso/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: !estado })
            })
            if (!res.ok) throw new Error(await res.text())
            fetchData()
            toast.success(`Estado cambiado a ${!estado ? 'Activo' : 'Inactivo'}`)
        } catch (error) {
            toast.error('Error cambiando estado')
        }
    }

    const prepararImpresion = async (id) => {
        try {
            const res = await fetch(`/api/recibo-egreso/${id}`)
            if (!res.ok) throw new Error(await res.text())
            const reciboData = await res.json()
            setReciboParaImprimir(reciboData)
            // Esperar un momento para que se actualice el estado
            setTimeout(() => {
                handlePrint()
            }, 10)
        } catch (error) {
            toast.error('Error al cargar recibo para imprimir')
        }
    }

    const initEdit = (recibo) => {
        setCurrentRecibo(recibo)
        onOpen()
    }

    const initCreate = () => {
        setCurrentRecibo(null)
        onOpen()
    }

    if (loading) return <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
    </div>

    return (
        <div className="p-4">
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-bold text-white">Recibos de Egreso</h1>
                <Button color="primary" onPress={initCreate}>
                    Nuevo Recibo Egreso
                </Button>
            </div>

            <div className="flex gap-3 mb-4">
                <Input
                    placeholder="Buscar por número, concepto, descripción o creador"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-1"
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
            </div>

            <Table>
                <TableHeader>
                    <TableColumn>N° Recibo</TableColumn>
                    <TableColumn>Concepto</TableColumn>
                    <TableColumn>Descripción</TableColumn>
                    <TableColumn>Total</TableColumn>
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>Registrado por</TableColumn>
                    <TableColumn>Estado</TableColumn>
                    <TableColumn>Acciones</TableColumn>
                </TableHeader>
                <TableBody>
                    {paginatedItems.map(recibo => (
                        <TableRow key={recibo.idrecibo_egreso}>
                            <TableCell>{recibo.numerorecibo_egreso}</TableCell>
                            <TableCell>
                                {recibo.detalles && recibo.detalles.length > 0 ? (
                                    <div className="space-y-1">
                                        {recibo.detalles.map((detalle, index) => (
                                            <div key={index} className="text-sm">
                                                {detalle.concepto?.descripcion || 'N/A'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Sin conceptos</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {recibo.detalles && recibo.detalles.length > 0 ? (
                                    <div className="space-y-1">
                                        {recibo.detalles.map((detalle, index) => (
                                            <div key={index} className="text-sm">
                                                {detalle.descripcion || 'Sin descripción'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-gray-400">Sin descripción</span>
                                )}
                            </TableCell>
                            <TableCell>S/. {Number(recibo.total || 0).toFixed(2)}</TableCell>
                            <TableCell>{format(new Date(recibo.fecharecibo_egreso), 'dd/MM/yyyy')}</TableCell>
                            <TableCell>{recibo.createdBy?.username || 'N/A'}</TableCell>
                            <TableCell>
                                <Chip color={recibo.estado ? "success" : "danger"}>
                                    {recibo.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Tooltip content="Editar" color="primary">
                                        <Button isIconOnly size="sm" variant="light" onPress={() => initEdit(recibo)}>
                                            <EditIcon className="text-lg text-primary" />
                                        </Button>
                                    </Tooltip>
                                    
                                    {session.user.role === 'SUPERADMIN' && (
                                        <Tooltip content="Eliminar" color="danger">
                                            <Button isIconOnly size="sm" variant="light" onPress={() => handleDelete(recibo.idrecibo_egreso)}>
                                                <DeleteIcon className="text-lg text-danger" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                    {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                                        <Tooltip content={recibo.estado ? "Desactivar" : "Activar"} color={recibo.estado ? "warning" : "success"}>
                                            <Button
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                onPress={() => toggleEstado(recibo.idrecibo_egreso, recibo.estado)}
                                            >
                                                <PowerIcon className={`text-lg ${recibo.estado ? "text-warning" : "text-success"}`} />
                                            </Button>
                                        </Tooltip>
                                    )}
                                    <Tooltip content="Imprimir" color="secondary">
                                        <Button
                                            isIconOnly
                                            size="sm"
                                            variant="light"
                                            onPress={() => prepararImpresion(recibo.idrecibo_egreso)}
                                        >
                                            <PrinterIcon className="text-lg text-secondary" />
                                        </Button>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {rowsPerPage !== 'all' && (
                <div className="flex w-full justify-center">
                    <Pagination
                        page={page}
                        total={Math.ceil(filteredItems.length / rowsPerPage)}
                        onChange={setPage}
                        className="mt-4"
                    />
                </div>
            )}

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="5xl"
                className="max-h-[95vh]"
            >
                <ModalContent className="h-[95vh]" style={{ maxWidth: "90rem", justifyContent: "center" }}>
                    {(onClose) => (
                        <FormReciboEgreso
                            recibo={currentRecibo}
                            onClose={onClose}
                            onSave={() => {
                                fetchData()
                                onClose()
                            }}
                        />
                    )}
                </ModalContent>
            </Modal>

            {/* Componente de impresión oculto */}
            <div style={{ display: 'none' }}>
                {reciboParaImprimir && empresa && (
                    <ReciboEgresoPrint
                        ref={printRef}
                        recibo={reciboParaImprimir}
                        empresa={empresa}
                        conceptos={conceptosEgreso}
                    />
                )}
            </div>
        </div>
    )
}