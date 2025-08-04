'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
    Button,
    Input,
    Select,
    SelectItem,
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Card,
    CardHeader,
    CardBody,
    Divider,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { useReactToPrint } from 'react-to-print'
import ReciboEgresoPrint from './ReciboEgresoPrint'
import { useSession } from '@/context/SessionContext'

export default function FormReciboEgreso({ recibo, onClose, onSave }) {
    const session = useSession()

    const [form, setForm] = useState({
        detalles: []
    })

    const [nuevoDetalle, setNuevoDetalle] = useState({
        idconcepto_egreso: '',
        descripcion: '',
        monto: ''
    })

    const [conceptosEgreso, setConceptosEgreso] = useState([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [proximoNumero, setProximoNumero] = useState(null)
    const [showEmptyDetailsModal, setShowEmptyDetailsModal] = useState(false)
    const [empresaData, setEmpresaData] = useState(null)
    const [reciboGuardado, setReciboGuardado] = useState(null)

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
            onClose()
            onSave()
        }
    })

    // Cargar datos iniciales
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [conceptosRes, numeracionRes, empresaRes] = await Promise.all([
                    fetch('/api/concepto-egreso').then(res => res.json()),
                    fetch('/api/documento-numeracion?descripcion=recibo egreso').then(res => res.json()),
                    fetch('/api/empresa').then(res => res.json())
                ])

                setConceptosEgreso(conceptosRes)
                setEmpresaData(empresaRes[0])

                if (numeracionRes) {
                    const siguienteNumero = numeracionRes.numeroactual === 0
                        ? numeracionRes.apartir_de_numeracion
                        : numeracionRes.numeroactual + 1
                    setProximoNumero(siguienteNumero)
                }

                if (recibo) {
                    setForm({
                        detalles: recibo.detalles.map(d => ({
                            ...d,
                            idconcepto_egreso: d.idconcepto_egreso,
                            concepto: d.concepto,
                            monto: d.monto,
                            descripcion: d.descripcion || ''
                        }))
                    })
                }
            } catch (error) {
                toast.error('Error cargando datos')
                console.error('Error:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [recibo])

    const agregarDetalle = () => {
        if (!nuevoDetalle.idconcepto_egreso || !nuevoDetalle.monto) {
            toast.error('Complete concepto y monto para agregar detalle');
            return;
        }

        const monto = parseFloat(nuevoDetalle.monto);
        if (isNaN(monto) || monto <= 0) {
            toast.error('El monto debe ser un número mayor a cero');
            return;
        }

        const conceptoSeleccionado = conceptosEgreso.find(
            c => c.idconcepto_egreso === parseInt(nuevoDetalle.idconcepto_egreso)
        );

        setForm(prev => ({
            ...prev,
            detalles: [
                ...prev.detalles,
                {
                    idconcepto_egreso: parseInt(nuevoDetalle.idconcepto_egreso),
                    concepto: conceptoSeleccionado,
                    descripcion: nuevoDetalle.descripcion || conceptoSeleccionado.descripcion,
                    monto: monto
                }
            ]
        }));

        setNuevoDetalle({
            idconcepto_egreso: '',
            descripcion: '',
            monto: ''
        });
    };

    const quitarDetalle = (index) => {
        setForm(prev => ({
            ...prev,
            detalles: prev.detalles.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.detalles.length === 0) {
            setShowEmptyDetailsModal(true);
            return;
        }

        setIsSubmitting(true);

        try {
            // Preparar datos para enviar
            const detallesParaEnviar = form.detalles.map(detalle => ({
                idconcepto_egreso: parseInt(detalle.idconcepto_egreso),
                monto: parseFloat(detalle.monto) || 0,
                descripcion: detalle.descripcion || ''
            }));

            const datosEnvio = {
                detalles: detallesParaEnviar
            };

            const url = recibo
                ? `/api/recibo-egreso/${recibo.idrecibo_egreso}`
                : '/api/recibo-egreso';

            const method = recibo ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosEnvio)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error en la solicitud');
            }

            const data = await res.json();
            toast.success(recibo ? 'Recibo actualizado' : 'Recibo creado');
            setReciboGuardado(data);

            if (!recibo) {
                setTimeout(() => {
                    handlePrint();
                }, 500);
            } else {
                onClose();
                onSave();
            }
        } catch (error) {
            toast.error(error.message || 'Error guardando recibo');
            console.error('Error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-1 h-[80vh] max-h-[80vh] overflow-hidden px-[30px]">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h1 className="text-xl font-bold">Recibo de Egreso</h1>
                    <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
                        {recibo ? (
                            <>
                                <span className="text-sm font-medium text-primary-800">Recibo N°:</span>
                                <span className="text-lg font-bold text-primary-900">
                                    {recibo.numerorecibo_egreso}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="text-sm font-medium text-primary-800">Próximo N°:</span>
                                <span className="text-lg font-bold text-primary-900">
                                    {proximoNumero || '--'}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <Divider className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Concepto"
                        selectedKeys={nuevoDetalle.idconcepto_egreso ? [nuevoDetalle.idconcepto_egreso.toString()] : []}
                        onChange={(e) => {
                            const concepto = conceptosEgreso.find(c => c.idconcepto_egreso === parseInt(e.target.value))
                            setNuevoDetalle({
                                ...nuevoDetalle,
                                idconcepto_egreso: e.target.value,
                                descripcion: concepto?.descripcion || ''
                            })
                        }}
                    >
                        {conceptosEgreso.map(concepto => (
                            <SelectItem key={concepto.idconcepto_egreso} value={concepto.idconcepto_egreso}>
                                {concepto.descripcion}
                            </SelectItem>
                        ))}
                    </Select>

                    <Input
                        label="Descripción (Opcional)"
                        value={nuevoDetalle.descripcion}
                        onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, descripcion: e.target.value })}
                    />

                    <Input
                        label="Monto"
                        type="number"
                        value={nuevoDetalle.monto}
                        onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, monto: e.target.value })}
                        startContent={<span className="text-default-400 text-small">S/.</span>}
                        min="0.01"
                        step="0.01"
                    />
                </div>

                <div className="flex justify-end">
                    <Button
                        color="primary"
                        onPress={agregarDetalle}
                        isDisabled={!nuevoDetalle.idconcepto_egreso || !nuevoDetalle.monto}
                    >
                        Agregar Detalle
                    </Button>
                </div>

                <Divider className="my-4" />

                <Card className="flex-1 flex flex-col min-h-0" style={{ zIndex: "0", minHeight: "200px", maxHeight: "400px" }}>
                    <CardHeader className="font-semibold shrink-0 bg-content1 sticky top-0 z-10">
                        Detalles del Recibo
                    </CardHeader>
                    <CardBody className="p-0 flex-1 min-h-0 overflow-hidden">
                        <div className="h-full overflow-y-auto scroll-container">
                            <Table
                                aria-label="Tabla de detalles del recibo"
                                removeWrapper
                                classNames={{
                                    base: "min-w-full",
                                    table: "min-w-full",
                                    wrapper: "border-none",
                                    th: "bg-content1 sticky top-0"
                                }}
                                isHeaderSticky
                            >
                                <TableHeader>
                                    <TableColumn>Concepto</TableColumn>
                                    <TableColumn>Descripción</TableColumn>
                                    <TableColumn>Monto</TableColumn>
                                    <TableColumn>Acción</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {form.detalles.map((detalle, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{detalle.concepto?.descripcion || detalle.descripcion}</TableCell>
                                            <TableCell>{detalle.descripcion}</TableCell>
                                            <TableCell>S/. {Number(detalle.monto || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    size="sm"
                                                    color="danger"
                                                    onPress={() => quitarDetalle(index)}
                                                >
                                                    Quitar
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>

                <div className="flex justify-between items-center mt-4">
                    <div className="text-lg font-bold">
                        Total: S/. {form.detalles.length > 0
                            ? form.detalles
                                .reduce((sum, det) => sum + (Number(det.monto) || 0), 0)
                                .toFixed(2)
                            : '0.00'}
                    </div>
                    <div className="flex gap-2">
                        <Button onPress={onClose}>Cancelar</Button>
                        {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') &&(<Button
                            type="submit"
                            color="primary"
                            isLoading={isSubmitting}
                            isDisabled={form.detalles.length === 0}
                        >
                            {recibo ? 'Guardar' : 'Guardar e Imprimir'}
                        </Button>)}
                        {session.user.role === 'USER' && !recibo &&(<Button
                            type="submit"
                            color="primary"
                            isLoading={isSubmitting}
                            isDisabled={form.detalles.length === 0}
                        >
                            {recibo ? 'Guardar' : 'Guardar e Imprimir'}
                        </Button>)}
                    </div>
                </div>
            </form>

            <Modal isOpen={showEmptyDetailsModal} onClose={() => setShowEmptyDetailsModal(false)}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Validación requerida</ModalHeader>
                            <ModalBody>
                                <p>Debe agregar al menos un detalle antes de guardar el recibo.</p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" onPress={onClose}>
                                    Entendido
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>

            {reciboGuardado && (
                <div style={{ display: 'none' }}>
                    <ReciboEgresoPrint
                        recibo={reciboGuardado}
                        empresa={empresaData}
                        conceptos={conceptosEgreso}
                        ref={printRef}
                    />
                </div>
            )}
        </>
    )
}