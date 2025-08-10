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
  Autocomplete,
  AutocompleteItem
} from '@nextui-org/react'
import { toast } from 'react-toastify'
import { useReactToPrint } from 'react-to-print'
import ReciboPrint from './ReciboPrint'
import { useSession } from '@/context/SessionContext'

export default function FormRecibo({ recibo, onClose, onSave }) {
  const session = useSession()

  const [form, setForm] = useState({
    idmetodo_pago: '',
    idstand: '',
    identidad_recaudadora: '',
    numero_operacion: '',
    detalles: []
  });

  const [empresa, setEmpresa] = useState(null);
  const [metodosPago, setMetodosPago] = useState([])
  const [stands, setStands] = useState([])
  const [deudas, setDeudas] = useState([])
  const [allDeudas, setAllDeudas] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [standSearch, setStandSearch] = useState('')
  const [standInputValue, setStandInputValue] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [standError, setStandError] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [entidadesRecaudadoras, setEntidadesRecaudadoras] = useState([])
  const [proximoNumero, setProximoNumero] = useState(null)
  const [reciboGuardado, setReciboGuardado] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const printRef = useRef()

  const filteredStands = useMemo(() => {
    return stands.filter(stand =>
      stand.descripcion.toLowerCase().includes(standSearch.toLowerCase()) ||
      stand.client?.nombre.toLowerCase().includes(standSearch.toLowerCase())
    );
  }, [stands, standSearch, forceUpdate]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData.user);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (recibo && stands.length > 0) {
      const standSeleccionado = stands.find(s => s.idstand === recibo.idstand);
      if (standSeleccionado) {
        setStandInputValue(`${standSeleccionado.descripcion} - ${standSeleccionado.client?.nombre || 'Sin cliente'}`);
      }
    }
  }, [recibo, stands]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metodosRes, standsRes, entidadesRes, numeracionRes, empresaRes] = await Promise.all([
          fetch('/api/metodo-pago').then(res => res.json()),
          fetch('/api/stands?includeClient=true').then(res => res.json()),
          fetch('/api/entidad-recaudadora').then(res => res.json()),
          fetch('/api/documento-numeracion?descripcion=recibo ingreso').then(res => res.json()),
          fetch('/api/empresa').then(res => res.json())
        ]);

        setMetodosPago(metodosRes);
        setStands(standsRes);
        setEntidadesRecaudadoras(entidadesRes);
        if (empresaRes && empresaRes.length > 0) {
          setEmpresa(empresaRes[0]);
        }

        if (numeracionRes) {
          const siguienteNumero = numeracionRes.numeroactual === 0 
            ? numeracionRes.apartir_de_numeracion 
            : numeracionRes.numeroactual + 1;
          setProximoNumero(siguienteNumero);
        }

        if (recibo) {
          const detallesConDeuda = await Promise.all(
            recibo.detalles.map(async detalle => {
              const res = await fetch(`/api/reg-deuda-detalle/${detalle.idregdeuda_detalle}`);
              const deudaDetalle = await res.json();
              
              // Usar el saldo pendiente calculado por la API
              // Para edición, el saldo disponible es el saldo pendiente actual + el monto del recibo actual
              const saldoDisponible = Number(deudaDetalle.saldoPendiente) + Number(detalle.monto);
              
              return {
                ...detalle,
                montoDeuda: deudaDetalle.monto,
                montoPago: detalle.monto,
                saldoPendiente: saldoDisponible
              };
            })
          );
          
          setForm({
            idmetodo_pago: recibo.idmetodo_pago,
            identidad_recaudadora: recibo.identidad_recaudadora,
            idstand: recibo.idstand,
            numero_operacion: recibo.numero_operacion || '',
            detalles: detallesConDeuda
          });
          
          fetchDeudas(recibo.idstand);
        }
      } catch (error) {
        toast.error('Error cargando datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [recibo]);

  const fetchDeudas = async (idstand) => {
    if (!idstand) return;
    try {
      const res = await fetch(`/api/reg-deuda-detalle?standId=${idstand}`);
      const data = await res.json();
      setAllDeudas(data);
      
      const detallesIds = form.detalles.map(d => d.idregdeuda_detalle);
      const deudasFiltradas = data.filter(
        deuda => !detallesIds.includes(deuda.idregdeuda_detalle) && deuda.saldoPendiente > 0
      );
      setDeudas(deudasFiltradas);
    } catch (error) {
      toast.error('Error cargando deudas');
    }
  };

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
      onClose();
      onSave();
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault()
    setShowErrors(true)
    setStandError(!form.idstand)

    if (!form.idstand || !form.idmetodo_pago || form.detalles.length === 0) {
      toast.error('Complete todos los campos requeridos')
      return
    }

    const datosEnvio = {
      idmetodo_pago: form.idmetodo_pago,
      idstand: form.idstand,
      numero_operacion: form.numero_operacion || null,
      identidad_recaudadora: form.identidad_recaudadora || null,
      detalles: form.detalles.map(detalle => ({
        idconcepto: detalle.idconcepto,
        fechadeuda: detalle.fechadeuda,
        idregdeuda_detalle: detalle.idregdeuda_detalle,
        montoPago: Number(detalle.montoPago)
      }))
    }

    const montosInvalidos = datosEnvio.detalles.some(detalle => 
      isNaN(detalle.montoPago) || detalle.montoPago <= 0
    )

    if (montosInvalidos) {
      toast.error('Verifique los montos de pago')
      return
    }

    // Validar que los montos de pago no excedan el saldo pendiente
    for (const detalle of form.detalles) {
      if (detalle.idregdeuda_detalle && detalle.montoPago > detalle.saldoPendiente) {
        toast.error(`El monto de pago (S/. ${detalle.montoPago.toFixed(2)}) excede el saldo pendiente (S/. ${detalle.saldoPendiente.toFixed(2)}) para la deuda seleccionada`);
        return;
      }
    }

    setIsSubmitting(true)

    try {
      const url = recibo 
        ? `/api/recibo-ingreso/${recibo.idrecibo_ingreso}`
        : '/api/recibo-ingreso'
      
      const method = recibo ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEnvio)
      })

      if (!res.ok) throw new Error(await res.text())

      const resultado = await res.json()
      
      setReciboGuardado(resultado)
      toast.success(recibo ? 'Recibo actualizado' : 'Recibo creado')

      // Solo imprimir si es un nuevo recibo, no en edición
      if (!recibo) {
        setTimeout(() => {
          handlePrint();
        }, 500);
      } else {
        onClose();
        onSave();
      }
      
    } catch (error) {
      toast.error('Error guardando recibo: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStandSelection = (key) => {
    const idstand = key ? parseInt(key) : null;
    const standSeleccionado = stands.find(s => s.idstand === idstand);
    
    if (standSeleccionado) {
      setForm({...form, idstand, detalles: []});
      setStandInputValue(`${standSeleccionado.descripcion} - ${standSeleccionado.client?.nombre || 'Sin cliente'}`);
      setStandError(false);
      fetchDeudas(idstand);
      setForceUpdate(prev => !prev);
    } else {
      setForm({...form, idstand: '', detalles: []});
      setStandInputValue('');
    }
  };

  const handleStandInputChange = (value) => {
    setStandSearch(value);
    setStandInputValue(value);
    
    if (value === '') {
      setForm({...form, idstand: '', detalles: []});
    }
  };

  const agregarDeudaADetalle = (deuda) => {
    // Verificar que la deuda tenga saldo pendiente
    if (deuda.saldoPendiente <= 0) {
      toast.error('Esta deuda ya está completamente pagada');
      return;
    }
    
    const saldoDisponible = deuda.saldoPendiente;
    
    setForm(prev => ({
      ...prev,
      detalles: [
        ...prev.detalles,
        {
          idconcepto: deuda.idconcepto_deuda,
          concepto: deuda.concepto,
          fechadeuda: deuda.fechadeudaStand,
          idregdeuda_detalle: deuda.idregdeuda_detalle,
          montoDeuda: deuda.monto,
          totalPagado: deuda.totalPagado || 0,
          saldoPendiente: saldoDisponible,
          montoPago: saldoDisponible
        }
      ]
    }));
    
    setDeudas(prev => prev.filter(d => d.idregdeuda_detalle !== deuda.idregdeuda_detalle));
  };

  const quitarDetalle = (index) => {
    const detalleAEliminar = form.detalles[index];
    
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
    
    const deudaOriginal = allDeudas.find(
      d => d.idregdeuda_detalle === detalleAEliminar.idregdeuda_detalle
    );
    
    if (deudaOriginal && deudaOriginal.saldoPendiente > 0) {
      setDeudas(prev => [...prev, deudaOriginal]);
    }
  };

  const validateNumeroOperacion = (value) => {
    if (value === '') return true;
    return /^[a-zA-Z0-9]+$/.test(value);
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-[80vh] max-h-[80vh] overflow-hidden px-[30px]">
        <div className="flex justify-between items-center mb-4 border-b pb-4">
          <h1 className="text-xl font-bold">{recibo ? 'Editar Recibo de Ingreso' : 'Nuevo Recibo de Ingreso'}</h1>
          
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            label="Método de Pago"
            selectedKeys={form.idmetodo_pago ? [form.idmetodo_pago.toString()] : []}
            onChange={(e) => {
              setForm({...form, idmetodo_pago: e.target.value})
              if (showErrors) setShowErrors(false)
            }}
            isRequired
            errorMessage={showErrors && !form.idmetodo_pago ? "Seleccione un método de pago" : undefined}
            validationState={showErrors && !form.idmetodo_pago ? "invalid" : undefined}
            isDisabled={session.user.role === 'USER' && recibo}
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
            onChange={(e) => setForm({...form, identidad_recaudadora: e.target.value})}
            isDisabled={session.user.role === 'USER' && recibo}
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
            onChange={(e) => {
              const value = e.target.value.trim()
              if (value === '' || /^[a-zA-Z0-9]*$/.test(value)) {
                setForm({...form, numero_operacion: value})
              }
            }}
            description="Ingrese número de transacción bancaria o referencia"
            isInvalid={form.numero_operacion !== '' && !validateNumeroOperacion(form.numero_operacion)}
            errorMessage={!validateNumeroOperacion(form.numero_operacion) ? "Solo se permiten letras y números" : undefined}
            isDisabled={session.user.role === 'USER' && recibo}
          />

          <Autocomplete
            key={`autocomplete-${forceUpdate}`}
            label="Stand"
            placeholder="Buscar stand o cliente..."
            defaultItems={filteredStands}
            selectedKey={form.idstand ? form.idstand.toString() : null}
            inputValue={standInputValue}
            onSelectionChange={handleStandSelection}
            onInputChange={handleStandInputChange}
            className="mb-4"
            allowsCustomValue={false}
            isRequired
            errorMessage={standError ? "Seleccione un stand válido" : undefined}
            validationState={standError ? "invalid" : undefined}
            onBlur={() => !form.idstand && setStandError(true)}
            isDisabled={session.user.role === 'USER' && recibo}
          >
            {(stand) => (
              <AutocompleteItem 
                key={stand.idstand.toString()} 
                textValue={`${stand.descripcion} - ${stand.client?.nombre}`}
              >
                {stand.descripcion} - {stand.client?.nombre || 'Sin cliente'} {stand.nivel && `(Piso ${stand.nivel})`}
              </AutocompleteItem>
            )}
          </Autocomplete>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="font-semibold shrink-0 bg-content1 sticky top-0 z-10">
              Deudas Pendientes
            </CardHeader>
            <CardBody className="p-0 flex-1 min-h-0 overflow-hidden">
              <div className="h-full overflow-y-auto scroll-container">
                <Table 
                  aria-label="Tabla de deudas pendientes"
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
                    <TableColumn>Fecha</TableColumn>
                    <TableColumn>M. Deuda</TableColumn>
                    <TableColumn>Pagado</TableColumn>
                    <TableColumn>Saldo</TableColumn>
                    <TableColumn>Acción</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {deudas.map(deuda => (
                      <TableRow key={deuda.idregdeuda_detalle}>
                        <TableCell>{deuda.concepto?.descripcion || 'Concepto no disponible'}</TableCell>
                        <TableCell>{new Date(deuda.fechadeudaStand).toLocaleDateString()}</TableCell>
                        <TableCell>S/. {deuda.monto.toFixed(2)}</TableCell>
                        <TableCell>S/. {deuda.totalPagado.toFixed(2)}</TableCell>
                        <TableCell>S/. {deuda.saldoPendiente.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            onPress={() => agregarDeudaADetalle(deuda)}
                            isDisabled={session.user.role === 'USER' && recibo}
                          >
                            Agregar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardBody>
          </Card>

          <Card className="flex-1 flex flex-col min-h-0">
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
                    <TableColumn>Fecha Deuda</TableColumn>
                    <TableColumn>M.Deuda</TableColumn>
                    <TableColumn>M.Pago</TableColumn>
                    <TableColumn>Acción</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {form.detalles.map((detalle, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {detalle.concepto?.descripcion || 'Concepto no disponible'}
                        </TableCell>
                        <TableCell>
                          {new Date(detalle.fechadeuda).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-default-600">
                            S/. {(Number(detalle.montoDeuda) || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={detalle.montoPago ?? ''}
                            onChange={(e) => {
                              const saldo = Number(detalle.saldoPendiente) || Number(detalle.montoDeuda) || 0
                              const inputValue = e.target.value
                              
                              if (/^(\d+)?([.]?\d{0,2})?$/.test(inputValue) || inputValue === '') {
                                const numericValue = inputValue === '' ? null : parseFloat(inputValue)
                                const value = Math.min(
                                  numericValue ?? 0,
                                  saldo
                                )
                                
                                const nuevosDetalles = [...form.detalles]
                                nuevosDetalles[index].montoPago = numericValue !== null ? value : null
                                setForm({...form, detalles: nuevosDetalles})
                              }
                            }}
                            min="0.01"
                            max={Number(detalle.saldoPendiente) || Number(detalle.montoDeuda) || 0}
                            step="0.01"
                            startContent={
                              <span className="text-default-400 text-small">S/.</span>
                            }
                            endContent={
                              <div className="flex flex-col whitespace-nowrap">
                                <span style={{fontSize: "8px"}}>Máx:</span>
                                <span style={{fontSize: "8px"}}>
                                  S/. {(Number(detalle.saldoPendiente) || Number(detalle.montoDeuda) || 0).toFixed(2)}
                                </span>
                              </div>
                            }
                            isDisabled={session.user.role === 'USER' && recibo}
                          />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            color="danger"
                            onPress={() => quitarDetalle(index)}
                            isDisabled={session.user.role === 'USER' && recibo}
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
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onPress={() => {
            onClose();
            onSave();
          }}>
            Cancelar
          </Button>
          {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
            <Button 
              type="submit" 
              color="primary" 
              isLoading={isSubmitting}
            >
              {recibo ? 'Guardar' : 'Guardar e Imprimir'}
            </Button>
          )}
          {session.user.role === 'USER' && !recibo && (
            <Button 
              type="submit" 
              color="primary" 
              isLoading={isSubmitting}
            >
              Guardar e Imprimir
            </Button>
          )}
          {session.user.role === 'USER' && recibo && (
            <Button 
              color="primary" 
              isDisabled
            >
              Solo Lectura
            </Button>
          )}
        </div>
      </form>

      {reciboGuardado && !recibo && (
        <div style={{ display: 'none' }}>
          <ReciboPrint
            recibo={reciboGuardado}
            empresa={empresa}
            metodosPago={metodosPago}
            entidadesRecaudadoras={entidadesRecaudadoras}
            detalles={form.detalles}
            ref={printRef}
          />
        </div>
      )}
    </>
  );
}