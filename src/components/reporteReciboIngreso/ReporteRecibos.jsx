// components/ReporteRecibos.js
import { useState, useEffect } from 'react'
import { 
  Button, 
  Input, 
  Pagination, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Spinner, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  useDisclosure,
  Select,
  SelectItem 
} from '@nextui-org/react'
import { format } from 'date-fns'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ReporteRecibosPDF from './ReporteRecibosPDF'
import ExportarExcelButton from './ExportarExcelButton'
import DownloadIcon from '@/components/iconos/DownloadIcon'
import FilePdfIcon from '@/components/iconos/FilePdfIcon'

const ReporteRecibos = ({ empresa, usuario }) => {
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-01'))
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalMonto, setTotalMonto] = useState(0)
  const [conceptos, setConceptos] = useState([])
  const [metodosPago, setMetodosPago] = useState([])
  const [selectedConcepto, setSelectedConcepto] = useState(null)
  const [selectedMetodoPago, setSelectedMetodoPago] = useState(null)
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  // Cargar conceptos y métodos de pago al iniciar
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Obtener conceptos
        const resConceptos = await fetch('/api/conceptos-deuda')
        const dataConceptos = await resConceptos.json()
        setConceptos(dataConceptos.filter(c => c.estado))
        
        // Obtener métodos de pago
        const resMetodos = await fetch('/api/metodo-pago')
        const dataMetodos = await resMetodos.json()
        setMetodosPago(dataMetodos.filter(m => m.estado))
      } catch (error) {
        console.error('Error cargando opciones:', error)
      }
    }
    
    fetchOptions()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reportes/recibos-ingreso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fechaInicio,
          fechaFin,
          page,
          pageSize,
          idConcepto: selectedConcepto,
          idMetodoPago: selectedMetodoPago
        })
      })

      if (!response.ok) throw new Error('Error al obtener datos')

      const result = await response.json()
      setData(result.data)
      setTotalPages(result.totalPages)
      
      // Calcular el monto total
      const total = result.data.reduce((sum, recibo) => {
        return sum + recibo.detalles.reduce((detalleSum, detalle) => {
          return detalleSum + Number(detalle.monto)
        }, 0)
      }, 0)
      setTotalMonto(total)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [fechaInicio, fechaFin, page, pageSize, selectedConcepto, selectedMetodoPago])

  const handleGenerarReporte = () => {
    setPage(1) // Resetear a la primera página al cambiar filtros
    fetchData()
  }

  const handleResetFilters = () => {
    setSelectedConcepto(null)
    setSelectedMetodoPago(null)
    setPage(1)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Reporte de Recibos de Ingreso</h1>

      {/* Resumen de totales */}
      {!loading && data.length > 0 && (
        <div className="bg-blue-100 p-4 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold">Periodo:</p>
              <p>{format(new Date(fechaInicio + 'T00:00:00'), 'dd/MM/yyyy')} - {format(new Date(fechaFin + 'T00:00:00'), 'dd/MM/yyyy')}</p>
              {selectedConcepto && (
                <p className="font-semibold">Concepto: {conceptos.find(c => c.idconcepto === selectedConcepto)?.descripcion}</p>
              )}
              {selectedMetodoPago && (
                <p className="font-semibold">Método Pago: {metodosPago.find(m => m.idmetodo_pago === selectedMetodoPago)?.descripcion}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-black">Total General:</p>
              <p className="text-xl font-bold text-black">S/ {totalMonto.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Inicio</label>
            <Input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha Fin</label>
            <Input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Concepto</label>
            <Select
              placeholder="Todos los conceptos"
              value={selectedConcepto}
              onChange={(e) => setSelectedConcepto(e.target.value ? parseInt(e.target.value) : null)}
            >
              {conceptos.map((concepto) => (
                <SelectItem key={concepto.idconcepto} value={concepto.idconcepto}>
                  {concepto.descripcion}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Método Pago</label>
            <Select
              placeholder="Todos los métodos"
              value={selectedMetodoPago}
              onChange={(e) => setSelectedMetodoPago(e.target.value ? parseInt(e.target.value) : null)}
            >
              {metodosPago.map((metodo) => (
                <SelectItem key={metodo.idmetodo_pago} value={metodo.idmetodo_pago}>
                  {metodo.descripcion}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button color="primary" onPress={handleGenerarReporte}>
            Generar Reporte
          </Button>
          <Button color="default" onPress={handleResetFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <PDFDownloadLink
          document={<ReporteRecibosPDF 
            usuario={usuario} 
            data={data} 
            fechaInicio={fechaInicio} 
            fechaFin={fechaFin} 
            empresa={empresa} 
            filtros={{
              concepto: selectedConcepto ? conceptos.find(c => c.idconcepto === selectedConcepto)?.descripcion : null,
              metodoPago: selectedMetodoPago ? metodosPago.find(m => m.idmetodo_pago === selectedMetodoPago)?.descripcion : null
            }}
          />}
          fileName={`Recibos_Ingreso_${fechaInicio}_a_${fechaFin}.pdf`}
        >
          {({ loading: pdfLoading }) => (
            <Button 
              color="danger" 
              startContent={<FilePdfIcon />}
              isLoading={pdfLoading}
            >
              {pdfLoading ? 'Generando PDF...' : 'Exportar a PDF'}
            </Button>
          )}
        </PDFDownloadLink>

        <ExportarExcelButton 
          data={data} 
          fechaInicio={fechaInicio} 
          fechaFin={fechaFin} 
          filtros={{
            concepto: selectedConcepto ? conceptos.find(c => c.idconcepto === selectedConcepto)?.descripcion : null,
            metodoPago: selectedMetodoPago ? metodosPago.find(m => m.idmetodo_pago === selectedMetodoPago)?.descripcion : null
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <p className="text-center text-gray-500">No hay datos para mostrar</p>
      ) : (
        <>
          <div className="overflow-auto">
            <Table aria-label="Reporte de recibos de ingreso">
              <TableHeader>
                <TableColumn>N° Recibo</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Cliente/Stand</TableColumn>
                <TableColumn>Método Pago</TableColumn>
                <TableColumn>Concepto</TableColumn>
                <TableColumn>Descripción</TableColumn>
                <TableColumn>Deuda Relacionada</TableColumn>
                <TableColumn>Fecha Deuda</TableColumn>
                <TableColumn>Monto</TableColumn>
              </TableHeader>
              <TableBody>
                {data.flatMap(recibo =>
                  recibo.detalles.map((detalle, index) => (
                    <TableRow key={`${recibo.idrecibo_ingreso}-${index}`}>
                      <TableCell>{recibo.numerorecibo}</TableCell>
                      <TableCell>{format(new Date(recibo.fecharecibo), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        {recibo.stand?.client?.nombre || 'Otro ingreso'}
                        {recibo.stand && ` - ${recibo.stand.descripcion}`}
                      </TableCell>
                      <TableCell>{recibo.metodoPago.descripcion}</TableCell>
                      <TableCell>{detalle.concepto.descripcion}</TableCell>
                      <TableCell>{detalle.descripcion || '-'}</TableCell>
                      <TableCell>
                        {detalle.detalleDeuda?.cabecera?.concepto.descripcion || '-'}
                      </TableCell>
                      <TableCell>
                        {detalle.fechadeuda ? format(new Date(detalle.fechadeuda), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>S/ {Number(detalle.monto).toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-center mt-4">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
              showShadow
            />
          </div>
        </>
      )}

      {/* Modal para vista previa del PDF */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="full">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Vista Previa del Reporte</ModalHeader>
              <ModalBody>
                <div className="h-[80vh]">
                  <div width="100%" height="100%">
                    <ReporteRecibosPDF 
                      data={data} 
                      fechaInicio={fechaInicio} 
                      fechaFin={fechaFin} 
                      empresa={empresa} 
                      usuario={usuario}
                      filtros={{
                        concepto: selectedConcepto ? conceptos.find(c => c.idconcepto === selectedConcepto)?.descripcion : null,
                        metodoPago: selectedMetodoPago ? metodosPago.find(m => m.idmetodo_pago === selectedMetodoPago)?.descripcion : null
                      }}
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button onPress={onClose}>Cerrar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default ReporteRecibos