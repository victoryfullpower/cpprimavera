'use client'
import { useState, useEffect } from 'react'
import { Button, Input, Card, CardBody, CardHeader, Divider, Spinner, Table, TableHeader, TableColumn, TableBody,
   TableRow, TableCell, Pagination } from '@nextui-org/react'
import { format } from 'date-fns'
import { PDFDownloadLink } from '@react-pdf/renderer'
import ArqueoCajaPDF from '@/components/reporteAqueoCaja/ArqueoCajaPDF'
import ArqueoCajaExcel from '@/components/reporteAqueoCaja/ArqueoCajaExcel'
import FilePdfIcon from '@/components/iconos/FilePdfIcon'
import { useSession } from '@/context/SessionContext'

export default function ReporteArqueoCaja() {
  const [fechaCorte, setFechaCorte] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [reporte, setReporte] = useState(null)
  const [loading, setLoading] = useState(false)
  const [pageIngresos, setPageIngresos] = useState(1)
  const [pageEgresos, setPageEgresos] = useState(1)
  const pageSize = 5
  const session = useSession()

  const generarReporte = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/reportes/arqueo-caja', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fechaCorte })
      })

      if (!response.ok) throw new Error('Error al generar reporte')

      const data = await response.json()
      setReporte(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    generarReporte()
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Reporte de Arqueo de Caja</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Fecha de Corte</label>
          <Input
            type="date"
            value={fechaCorte}
            onChange={(e) => setFechaCorte(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button color="primary" onPress={generarReporte} isLoading={loading}>
            Generar Reporte
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {reporte && !loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-green-50">
              <CardHeader className="font-bold">Total Ingresos</CardHeader>
              <Divider />
              <CardBody>
                <p className="text-2xl font-bold text-green-700">
                  S/ {reporte.totalIngresos.toFixed(2)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-red-50">
              <CardHeader className="font-bold">Total Egresos</CardHeader>
              <Divider />
              <CardBody>
                <p className="text-2xl font-bold text-red-700">
                  S/ {reporte.totalEgresos.toFixed(2)}
                </p>
              </CardBody>
            </Card>

            <Card className="bg-blue-50">
              <CardHeader className="font-bold">Saldo Final</CardHeader>
              <Divider />
              <CardBody>
                <p className={`text-2xl font-bold ${
                  reporte.saldo >= 0 ? 'text-blue-700' : 'text-red-700'
                }`}>
                  S/ {reporte.saldo.toFixed(2)}
                </p>
              </CardBody>
            </Card>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-white">Ingresos por Método de Pago</h2>
            <Table aria-label="Ingresos por método de pago">
              <TableHeader>
                <TableColumn>Método de Pago</TableColumn>
                <TableColumn>Monto</TableColumn>
              </TableHeader>
              <TableBody>
                {reporte.ingresosPorMetodo.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.metodo}</TableCell>
                    <TableCell>S/ {item.monto.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 mb-4">
            <PDFDownloadLink
              document={<ArqueoCajaPDF reporte={reporte} usuario={session.user.name} />}
              fileName={`Arqueo_Caja_${fechaCorte}.pdf`}
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

            <ArqueoCajaExcel 
              reporte={reporte}
            />
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2 text-white">Detalle de Ingresos</h2>
            <Table aria-label="Detalle de ingresos">
              <TableHeader>
                <TableColumn>N° Recibo</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Método Pago</TableColumn>
                <TableColumn>Entidad</TableColumn>
                <TableColumn>N° Operación</TableColumn>
                <TableColumn>Total</TableColumn>
              </TableHeader>
              <TableBody>
                {reporte.detalleIngresos
                  .slice((pageIngresos - 1) * pageSize, pageIngresos * pageSize)
                  .map((ingreso) => (
                    <TableRow key={ingreso.idrecibo_ingreso}>
                      <TableCell>{ingreso.numerorecibo}</TableCell>
                      <TableCell>{format(new Date(ingreso.fecharecibo), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>{ingreso.metodoPago.descripcion}</TableCell>
                      <TableCell>{ingreso.entidadRecaudadora?.descripcion || '-'}</TableCell>
                      <TableCell>{ingreso.numero_operacion || '-'}</TableCell>
                      <TableCell>S/ {Number(ingreso.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(reporte.detalleIngresos.length / pageSize)}
                page={pageIngresos}
                onChange={setPageIngresos}
              />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-white">Detalle de Egresos</h2>
            <Table aria-label="Detalle de egresos">
              <TableHeader>
                <TableColumn>N° Recibo</TableColumn>
                <TableColumn>Fecha</TableColumn>
                <TableColumn>Total</TableColumn>
              </TableHeader>
              <TableBody>
                {reporte.detalleEgresos
                  .slice((pageEgresos - 1) * pageSize, pageEgresos * pageSize)
                  .map((egreso) => (
                    <TableRow key={egreso.idrecibo_egreso}>
                      <TableCell>{egreso.numerorecibo_egreso}</TableCell>
                      <TableCell>{format(new Date(egreso.fecharecibo_egreso), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>S/ {Number(egreso.total).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <div className="flex justify-center mt-4">
              <Pagination
                total={Math.ceil(reporte.detalleEgresos.length / pageSize)}
                page={pageEgresos}
                onChange={setPageEgresos}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}