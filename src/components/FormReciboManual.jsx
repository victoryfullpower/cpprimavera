// 'use client'
// import { useState, useEffect, useMemo } from 'react'
// import {
//     Button,
//     Input,
//     Select,
//     SelectItem,
//     Table,
//     TableHeader,
//     TableColumn,
//     TableBody,
//     TableRow,
//     TableCell,
//     Spinner,
//     Card,
//     CardHeader,
//     CardBody,
//     Divider,
//     Modal,
//     ModalContent,
//     ModalHeader,
//     ModalBody,
//     ModalFooter,
//     useDisclosure
// } from '@nextui-org/react'
// import { toast } from 'react-toastify'
// import 'react-toastify/dist/ReactToastify.css'
// import { format } from 'date-fns'
// import DatePicker from 'react-datepicker'
// import 'react-datepicker/dist/react-datepicker.css'

// export default function FormReciboManual({ recibo, onClose, onSave }) {
//     const [form, setForm] = useState({
//         idmetodo_pago: '',
//         numero_operacion: '',
//         identidad_recaudadora: '',
//         detalles: []
//     })

//     const [nuevoDetalle, setNuevoDetalle] = useState({
//         idconcepto: '',
//         descripcion: '',
//         monto: '',
//         fecha: new Date()
//     })

//     const [metodosPago, setMetodosPago] = useState([])
//     const [entidadesRecaudadoras, setEntidadesRecaudadoras] = useState([])
//     const [conceptos, setConceptos] = useState([])
//     const [loading, setLoading] = useState(true)
//     const [isSubmitting, setIsSubmitting] = useState(false)
//     const [proximoNumero, setProximoNumero] = useState(null)
//     const [showEmptyDetailsModal, setShowEmptyDetailsModal] = useState(false)

//     // Cargar datos iniciales
//     useEffect(() => {
//         const fetchData = async () => {
//             try {
//                 const [metodosRes, entidadesRes, conceptosRes, numeracionRes] = await Promise.all([
//                     fetch('/api/metodo-pago').then(res => res.json()),
//                     fetch('/api/entidad-recaudadora').then(res => res.json()),
//                     fetch('/api/conceptos-deuda').then(res => res.json()),
//                     fetch('/api/documento-numeracion?descripcion=recibo ingreso').then(res => res.json())
//                 ])

//                 setMetodosPago(metodosRes)
//                 setEntidadesRecaudadoras(entidadesRes)
//                 setConceptos(conceptosRes.filter(c => !c.deuda))

//                 if (numeracionRes) {
//                     const siguienteNumero = numeracionRes.numeroactual === 0
//                         ? numeracionRes.apartir_de_numeracion
//                         : numeracionRes.numeroactual + 1
//                     setProximoNumero(siguienteNumero)
//                 }

//                 if (recibo) {
//                     setForm({
//                         idmetodo_pago: recibo.idmetodo_pago,
//                         identidad_recaudadora: recibo.identidad_recaudadora,
//                         numero_operacion: recibo.numero_operacion || '',
//                         detalles: recibo.detalles.map(d => ({
//                             ...d,
//                             descripcion: d.concepto.descripcion,
//                             fechadeuda: new Date(d.fechadeuda)
//                         }))
//                     })
//                 }
//             } catch (error) {
//                 toast.error('Error cargando datos')
//                 console.error('Error:', error)
//             } finally {
//                 setLoading(false)
//             }
//         }

//         fetchData()
//     }, [recibo])

//     const agregarDetalle = () => {
//         if (!nuevoDetalle.idconcepto || !nuevoDetalle.monto) {
//             toast.error('Complete concepto y monto para agregar detalle')
//             return
//         }

//         const conceptoSeleccionado = conceptos.find(c => c.idconcepto === parseInt(nuevoDetalle.idconcepto))

//         setForm(prev => ({
//             ...prev,
//             detalles: [
//                 ...prev.detalles,
//                 {
//                     idconcepto: parseInt(nuevoDetalle.idconcepto),
//                     concepto: conceptoSeleccionado,
//                     descripcion: nuevoDetalle.descripcion || conceptoSeleccionado.descripcion,
//                     montoPago: parseFloat(nuevoDetalle.monto),
//                     fechadeuda: new Date(nuevoDetalle.fecha)
//                 }
//             ]
//         }))

//         setNuevoDetalle({
//             idconcepto: '',
//             descripcion: '',
//             monto: '',
//             fecha: new Date()
//         })
//     }

//     const quitarDetalle = (index) => {
//         setForm(prev => ({
//             ...prev,
//             detalles: prev.detalles.filter((_, i) => i !== index)
//         }))
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault()

//         // Validar que haya al menos un detalle
//         if (form.detalles.length === 0) {
//             setShowEmptyDetailsModal(true)
//             return
//         }

//         setIsSubmitting(true)

//         // Preparar datos para enviar
//         const datosEnvio = {
//             idmetodo_pago: form.idmetodo_pago,
//             numero_operacion: form.numero_operacion || null,
//             identidad_recaudadora: form.identidad_recaudadora || null,
//             detalles: form.detalles.map(detalle => ({
//                 idconcepto: detalle.idconcepto,
//                 fechadeuda: detalle.fechadeuda.toISOString(),
//                 montoPago: Number(detalle.montoPago),
//                 descripcion: detalle.descripcion
//             }))
//         }

//         try {
//             const url = recibo
//                 ? `/api/recibo-ingreso/${recibo.idrecibo_ingreso}`
//                 : '/api/recibo-ingreso'

//             const method = recibo ? 'PUT' : 'POST'

//             const res = await fetch(url, {
//                 method,
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(datosEnvio)
//             })

//             if (!res.ok) throw new Error(await res.text())

//             toast.success(recibo ? 'Recibo actualizado' : 'Recibo creado')
//             onSave()
//         } catch (error) {
//             toast.error('Error guardando recibo: ' + error.message)
//             console.error('Error:', error)
//         } finally {
//             setIsSubmitting(false)
//         }
//     }

//     if (loading) {
//         return (
//             <div className="flex justify-center items-center h-64">
//                 <Spinner size="lg" />
//             </div>
//         )
//     }

//     return (
//         <>
//             <form onSubmit={handleSubmit} className="flex flex-col gap-1 h-[80vh] max-h-[80vh] overflow-hidden px-[30px]">
//                 {/* Encabezado con número de recibo */}
//                 <div className="flex justify-between items-center mb-4 border-b pb-4">
//                     <h1 className="text-xl font-bold">Ingreso Manual</h1>

//                     <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
//                         {recibo ? (
//                             <>
//                                 <span className="text-sm font-medium text-primary-800">Recibo N°:</span>
//                                 <span className="text-lg font-bold text-primary-900">
//                                     {recibo.numerorecibo}
//                                 </span>
//                             </>
//                         ) : (
//                             <>
//                                 <span className="text-sm font-medium text-primary-800">Próximo N°:</span>
//                                 <span className="text-lg font-bold text-primary-900">
//                                     {proximoNumero || '--'}
//                                 </span>
//                             </>
//                         )}
//                     </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <Select
//                         label="Método de Pago"
//                         selectedKeys={form.idmetodo_pago ? [form.idmetodo_pago.toString()] : []}
//                         onChange={(e) => setForm({ ...form, idmetodo_pago: e.target.value })}
//                         isRequired
//                     >
//                         {metodosPago.map(metodo => (
//                             <SelectItem key={metodo.idmetodo_pago} value={metodo.idmetodo_pago}>
//                                 {metodo.descripcion}
//                             </SelectItem>
//                         ))}
//                     </Select>

//                     <Select
//                         label="Entidad Recaudadora (Opcional)"
//                         selectedKeys={form.identidad_recaudadora ? [form.identidad_recaudadora.toString()] : []}
//                         onChange={(e) => setForm({ ...form, identidad_recaudadora: e.target.value })}
//                     >
//                         {entidadesRecaudadoras.map(entidad => (
//                             <SelectItem key={entidad.identidad_recaudadora} value={entidad.identidad_recaudadora}>
//                                 {entidad.descripcion}
//                             </SelectItem>
//                         ))}
//                     </Select>

//                     <Input
//                         label="Número de Operación (Opcional)"
//                         value={form.numero_operacion}
//                         onChange={(e) => setForm({ ...form, numero_operacion: e.target.value })}
//                         description="Ingrese número de transacción bancaria o referencia"
//                     />
//                 </div>

//                 <Divider className="my-4" />

//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                     <Select
//                         label="Concepto"
//                         selectedKeys={nuevoDetalle.idconcepto ? [nuevoDetalle.idconcepto.toString()] : []}
//                         onChange={(e) => {
//                             const concepto = conceptos.find(c => c.idconcepto === parseInt(e.target.value))
//                             setNuevoDetalle({
//                                 ...nuevoDetalle,
//                                 idconcepto: e.target.value,
//                                 descripcion: concepto?.descripcion || ''
//                             })
//                         }}
//                     >
//                         {conceptos.map(concepto => (
//                             <SelectItem key={concepto.idconcepto} value={concepto.idconcepto}>
//                                 {concepto.descripcion}
//                             </SelectItem>
//                         ))}
//                     </Select>

//                     <Input
//                         label="Descripción (Opcional)"
//                         value={nuevoDetalle.descripcion}
//                         onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, descripcion: e.target.value })}
//                     />

//                     <Input
//                         label="Monto"
//                         type="number"
//                         value={nuevoDetalle.monto}
//                         onChange={(e) => setNuevoDetalle({ ...nuevoDetalle, monto: e.target.value })}
//                         startContent={<span className="text-default-400 text-small">S/.</span>}
//                         min="0.01"
//                         step="0.01"
//                     />

//                     <div className="flex flex-col">
//                         <label className="text-sm text-foreground-500 mb-1">Fecha</label>
//                         <DatePicker
//                             selected={nuevoDetalle.fecha}
//                             onChange={(date) => setNuevoDetalle({ ...nuevoDetalle, fecha: date })}
//                             dateFormat="dd/MM/yyyy"
//                             className="custom-datepicker"
//                             wrapperClassName="custom-datepicker-wrapper"
//                             popperClassName="custom-datepicker-popper"
//                             showYearDropdown
//                             dropdownMode="select"
//                         />
//                     </div>
//                 </div>

//                 <div className="flex justify-end">
//                     <Button
//                         color="primary"
//                         onPress={agregarDetalle}
//                         isDisabled={!nuevoDetalle.idconcepto || !nuevoDetalle.monto}
//                     >
//                         Agregar Detalle
//                     </Button>
//                 </div>

//                 <Divider className="my-4" />

//                 <Card className="flex-1 flex flex-col min-h-0" style={{ zIndex: "0", minHeight: "200px", maxHeight: "400px" }}>
//                     <CardHeader className="font-semibold shrink-0 bg-content1 sticky top-0 z-10">
//                         Detalles del Recibo
//                     </CardHeader>
//                     <CardBody className="p-0 flex-1 min-h-0 overflow-hidden">
//                         <div className="h-full overflow-y-auto scroll-container">
//                             <Table
//                                 aria-label="Tabla de detalles del recibo"
//                                 removeWrapper
//                                 classNames={{
//                                     base: "min-w-full",
//                                     table: "min-w-full",
//                                     wrapper: "border-none",
//                                     th: "bg-content1 sticky top-0"
//                                 }}
//                                 isHeaderSticky
//                             >
//                                 <TableHeader>
//                                     <TableColumn>Concepto</TableColumn>
//                                     <TableColumn>Descripción</TableColumn>
//                                     <TableColumn>Fecha</TableColumn>
//                                     <TableColumn>Monto</TableColumn>
//                                     <TableColumn>Acción</TableColumn>
//                                 </TableHeader>
//                                 <TableBody>
//                                     {form.detalles.map((detalle, index) => (
//                                         <TableRow key={index}>
//                                             <TableCell>{detalle.concepto?.descripcion || detalle.descripcion}</TableCell>
//                                             <TableCell>{detalle.descripcion}</TableCell>
//                                             <TableCell>{format(new Date(detalle.fechadeuda), 'dd/MM/yyyy')}</TableCell>
//                                             <TableCell>S/. {Number(detalle.montoPago || 0).toFixed(2)}</TableCell>
//                                             <TableCell>
//                                                 <Button
//                                                     size="sm"
//                                                     color="danger"
//                                                     onPress={() => quitarDetalle(index)}
//                                                 >
//                                                     Quitar
//                                                 </Button>
//                                             </TableCell>
//                                         </TableRow>
//                                     ))}
//                                 </TableBody>
//                             </Table>
//                         </div>
//                     </CardBody>
//                 </Card>

//                 <div className="flex justify-between items-center mt-4">
//                     <div className="text-lg font-bold">
//                         Total: S/. {form.detalles.length > 0
//                             ? form.detalles.reduce((sum, det) => sum + (Number(det.montoPago) || 0), 0).toFixed(2)
//                             : '0.00'}
//                     </div>
//                     <div className="flex gap-2">
//                         <Button onPress={onClose}>Cancelar</Button>
//                         <Button
//                             type="submit"
//                             color="primary"
//                             isLoading={isSubmitting}
//                             isDisabled={form.detalles.length === 0}
//                         >
//                             Guardar
//                         </Button>
//                     </div>
//                 </div>
//             </form>

//             {/* Modal de validación */}
//             <Modal isOpen={showEmptyDetailsModal} onClose={() => setShowEmptyDetailsModal(false)}>
//                 <ModalContent>
//                     {(onClose) => (
//                         <>
//                             <ModalHeader className="flex flex-col gap-1">Validación requerida</ModalHeader>
//                             <ModalBody>
//                                 <p>Debe agregar al menos un detalle antes de guardar el recibo.</p>
//                             </ModalBody>
//                             <ModalFooter>
//                                 <Button color="primary" onPress={onClose}>
//                                     Entendido
//                                 </Button>
//                             </ModalFooter>
//                         </>
//                     )}
//                 </ModalContent>
//             </Modal>
//         </>
//     )
// }
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
import ReciboPrint from './ReciboPrint'
import { useSession } from '@/context/SessionContext'

export default function FormReciboManual({ recibo, onClose, onSave }) {
    const session = useSession()

    const [form, setForm] = useState({
        idmetodo_pago: '',
        numero_operacion: '',
        identidad_recaudadora: '',
        detalles: []
    })

    const [nuevoDetalle, setNuevoDetalle] = useState({
        idconcepto: '',
        descripcion: '',
        monto: '',
        fecha: new Date()
    })

    const [metodosPago, setMetodosPago] = useState([])
    const [entidadesRecaudadoras, setEntidadesRecaudadoras] = useState([])
    const [conceptos, setConceptos] = useState([])
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
                .print-only {
                    display: none;
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
                const [metodosRes, entidadesRes, conceptosRes, numeracionRes, empresaRes] = await Promise.all([
                    fetch('/api/metodo-pago').then(res => res.json()),
                    fetch('/api/entidad-recaudadora').then(res => res.json()),
                    fetch('/api/conceptos-deuda').then(res => res.json()),
                    fetch('/api/documento-numeracion?descripcion=recibo ingreso').then(res => res.json()),
                    fetch('/api/empresa').then(res => res.json())
                ])

                setMetodosPago(metodosRes)
                setEntidadesRecaudadoras(entidadesRes)
                setConceptos(conceptosRes.filter(c => !c.deuda))
                setEmpresaData(empresaRes[0])

                if (numeracionRes) {
                    const siguienteNumero = numeracionRes.numeroactual === 0
                        ? numeracionRes.apartir_de_numeracion
                        : numeracionRes.numeroactual + 1
                    setProximoNumero(siguienteNumero)
                }

                if (recibo) {
                    setForm({
                        idmetodo_pago: recibo.idmetodo_pago,
                        identidad_recaudadora: recibo.identidad_recaudadora,
                        numero_operacion: recibo.numero_operacion || '',
                        detalles: recibo.detalles.map(d => ({
                            ...d,
                            descripcion: d.concepto.descripcion,
                            fechadeuda: new Date(d.fechadeuda)
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
        if (!nuevoDetalle.idconcepto || !nuevoDetalle.monto) {
            toast.error('Complete concepto y monto para agregar detalle')
            return
        }

        const conceptoSeleccionado = conceptos.find(c => c.idconcepto === parseInt(nuevoDetalle.idconcepto))

        setForm(prev => ({
            ...prev,
            detalles: [
                ...prev.detalles,
                {
                    idconcepto: parseInt(nuevoDetalle.idconcepto),
                    concepto: conceptoSeleccionado,
                    descripcion: nuevoDetalle.descripcion || conceptoSeleccionado.descripcion,
                    montoPago: parseFloat(nuevoDetalle.monto),
                    fechadeuda: new Date(nuevoDetalle.fecha)
                }
            ]
        }))

        setNuevoDetalle({
            idconcepto: '',
            descripcion: '',
            monto: '',
            fecha: new Date()
        })
    }

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
            const datosEnvio = {
                idmetodo_pago: form.idmetodo_pago,
                numero_operacion: form.numero_operacion || null,
                identidad_recaudadora: form.identidad_recaudadora || null,
                detalles: form.detalles.map(detalle => ({
                    idconcepto: detalle.idconcepto,
                    fechadeuda: detalle.fechadeuda.toISOString(),
                    montoPago: Number(detalle.montoPago),
                    descripcion: detalle.descripcion
                }))
            };

            const url = recibo
                ? `/api/recibo-ingreso/${recibo.idrecibo_ingreso}`
                : '/api/recibo-ingreso';
            const method = recibo ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosEnvio)
            });

            if (!res.ok) throw new Error(await res.text());

            const resultado = await res.json();
            toast.success(recibo ? 'Recibo actualizado' : 'Recibo creado');
            setReciboGuardado(resultado);
console.log("resultado",resultado)

            // ESTA ES LA PARTE CLAVE - GUARDAMOS Y MANEJAMOS LA IMPRESIÓN
            if (!recibo) {
                // Para nuevos recibos: guardar y preparar impresión
                await new Promise(resolve => setTimeout(resolve, 500)); // Pequeña pausa
               setTimeout(() => {
                  console.log("reciboguardado",reciboGuardado)
               }, 500);
                                           

                handlePrint();
            } else {
                // Para ediciones: solo cerrar
                onClose();
                onSave();
            }

        } catch (error) {
            toast.error('Error guardando recibo: ' + error.message);
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
                {/* Encabezado con número de recibo */}
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                    <h1 className="text-xl font-bold">Ingreso Manual</h1>

                    <div className="flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
                        {recibo ? (
                            <>
                                <span className="text-sm font-medium text-primary-800">Recibo N°:</span>
                                <span className="text-lg font-bold text-primary-900">
                                    {recibo.numerorecibo}
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Método de Pago"
                        selectedKeys={form.idmetodo_pago ? [form.idmetodo_pago.toString()] : []}
                        onChange={(e) => setForm({ ...form, idmetodo_pago: e.target.value })}
                        isRequired
                    >
                        {metodosPago.map(metodo => (
                            <SelectItem key={metodo.idmetodo_pago} value={metodo.idmetodo_pago}>
                                {metodo.descripcion}
                            </SelectItem>
                        ))}
                    </Select>

                    <Select
                        label="Entidad Recaudadora (Opcional)"
                        selectedKeys={form.identidad_recaudadora ? [form.identidad_recaudadora.toString()] : []}
                        onChange={(e) => setForm({ ...form, identidad_recaudadora: e.target.value })}
                    >
                        {entidadesRecaudadoras.map(entidad => (
                            <SelectItem key={entidad.identidad_recaudadora} value={entidad.identidad_recaudadora}>
                                {entidad.descripcion}
                            </SelectItem>
                        ))}
                    </Select>

                    <Input
                        label="Número de Operación (Opcional)"
                        value={form.numero_operacion}
                        onChange={(e) => setForm({ ...form, numero_operacion: e.target.value })}
                        description="Ingrese número de transacción bancaria o referencia"
                    />
                </div>

                <Divider className="my-4" />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Select
                        label="Concepto"
                        selectedKeys={nuevoDetalle.idconcepto ? [nuevoDetalle.idconcepto.toString()] : []}
                        onChange={(e) => {
                            const concepto = conceptos.find(c => c.idconcepto === parseInt(e.target.value))
                            setNuevoDetalle({
                                ...nuevoDetalle,
                                idconcepto: e.target.value,
                                descripcion: concepto?.descripcion || ''
                            })
                        }}
                    >
                        {conceptos.map(concepto => (
                            <SelectItem key={concepto.idconcepto} value={concepto.idconcepto}>
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

                    <div className="flex flex-col">
                        <label className="text-sm text-foreground-500 mb-1">Fecha</label>
                        <DatePicker
                            selected={nuevoDetalle.fecha}
                            onChange={(date) => setNuevoDetalle({ ...nuevoDetalle, fecha: date })}
                            dateFormat="dd/MM/yyyy"
                            className="custom-datepicker"
                            wrapperClassName="custom-datepicker-wrapper"
                            popperClassName="custom-datepicker-popper"
                            showYearDropdown
                            dropdownMode="select"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        color="primary"
                        onPress={agregarDetalle}
                        isDisabled={!nuevoDetalle.idconcepto || !nuevoDetalle.monto}
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
                                    <TableColumn>Fecha</TableColumn>
                                    <TableColumn>Monto</TableColumn>
                                    <TableColumn>Acción</TableColumn>
                                </TableHeader>
                                <TableBody>
                                    {form.detalles.map((detalle, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{detalle.concepto?.descripcion || detalle.descripcion}</TableCell>
                                            <TableCell>{detalle.descripcion}</TableCell>
                                            <TableCell>{format(new Date(detalle.fechadeuda), 'dd/MM/yyyy')}</TableCell>
                                            <TableCell>S/. {Number(detalle.montoPago || 0).toFixed(2)}</TableCell>
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
                            ? form.detalles.reduce((sum, det) => sum + (Number(det.montoPago) || 0), 0).toFixed(2)
                            : '0.00'}
                    </div>
                    <div className="flex gap-2">
                        <Button onPress={onClose}>Cancelar</Button>
                        {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (<Button
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

            {/* Modal de validación */}
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

            {/* Componente oculto para imprimir */}
            {reciboGuardado && (
                <div style={{ display: 'none' }}>
                    <ReciboPrint
                        recibo={reciboGuardado}
                        empresa={empresaData}
                        metodosPago={metodosPago}
                        entidadesRecaudadoras={entidadesRecaudadoras}
                        detalles={form.detalles}
                        ref={printRef}
                    />
                </div>
            )}
        </>
    )
}