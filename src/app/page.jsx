'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@nextui-org/react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState({
    totalRecibos: 0,
    totalIngresos: 0,
    totalEgresos: 0,
    recibosPorMes: [],
    ingresosPorConcepto: [],
    egresosPorConcepto: [],
    standsActivos: 0,
    standsInactivos: 0,
    ingresosUltimosMeses: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Obtener datos de recibos de ingreso
      const recibosResponse = await fetch('/api/reportes/ingresos-conceptos')
      const recibos = await recibosResponse.ok ? await recibosResponse.json() : []
      
      // Obtener datos de recibos de egreso
      const egresosResponse = await fetch('/api/recibo-egreso')
      const egresos = await egresosResponse.ok ? await egresosResponse.json() : []
      
      // Obtener datos de stands
      const standsResponse = await fetch('/api/stands')
      const stands = await standsResponse.ok ? await standsResponse.json() : []
      
      // Procesar datos
      const totalRecibos = recibos.length
      const totalIngresos = recibos.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
      const totalEgresos = egresos.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0)
      
      // Recibos por mes (últimos 6 meses)
      const recibosPorMes = getRecibosPorMes(recibos)
      
      // Ingresos por concepto
      const ingresosPorConcepto = getIngresosPorConcepto(recibos)
      
      // Egresos por concepto
      const egresosPorConcepto = getEgresosPorConcepto(egresos)
      
      // Stands activos/inactivos
      const standsActivos = stands.filter(stand => stand.estado).length
      const standsInactivos = stands.filter(stand => !stand.estado).length
      
      // Ingresos últimos meses
      const ingresosUltimosMeses = getIngresosUltimosMeses(recibos)
      
      setDashboardData({
        totalRecibos,
        totalIngresos,
        totalEgresos,
        recibosPorMes,
        ingresosPorConcepto,
        egresosPorConcepto,
        standsActivos,
        standsInactivos,
        ingresosUltimosMeses
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRecibosPorMes = (recibos) => {
    const meses = {}
    const ultimos6Meses = []
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      ultimos6Meses.push({ mes, cantidad: 0 })
    }
    
    recibos.forEach(recibo => {
      const fecha = new Date(recibo.fecharecibo)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      
      if (meses[mes]) {
        meses[mes]++
      } else {
        meses[mes] = 1
      }
    })
    
    return ultimos6Meses.map(item => ({
      ...item,
      cantidad: meses[item.mes] || 0
    }))
  }

  const getIngresosPorConcepto = (recibos) => {
    const conceptos = {}
    
    recibos.forEach(recibo => {
      recibo.detalles?.forEach(detalle => {
        const concepto = detalle.concepto?.descripcion || 'Sin concepto'
        if (conceptos[concepto]) {
          conceptos[concepto] += parseFloat(detalle.monto || 0)
        } else {
          conceptos[concepto] = parseFloat(detalle.monto || 0)
        }
      })
    })
    
    return Object.entries(conceptos)
      .map(([concepto, monto]) => ({ concepto, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
  }

  const getEgresosPorConcepto = (egresos) => {
    const conceptos = {}
    
    egresos.forEach(egreso => {
      egreso.detalles?.forEach(detalle => {
        const concepto = detalle.concepto?.descripcion || 'Sin concepto'
        if (conceptos[concepto]) {
          conceptos[concepto] += parseFloat(detalle.monto || 0)
        } else {
          conceptos[concepto] = parseFloat(detalle.monto || 0)
        }
      })
    })
    
    return Object.entries(conceptos)
      .map(([concepto, monto]) => ({ concepto, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
  }

  const getIngresosUltimosMeses = (recibos) => {
    const meses = {}
    const ultimos6Meses = []
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date()
      fecha.setMonth(fecha.getMonth() - i)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      ultimos6Meses.push({ mes, ingresos: 0 })
    }
    
    recibos.forEach(recibo => {
      const fecha = new Date(recibo.fecharecibo)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })
      
      if (meses[mes]) {
        meses[mes] += parseFloat(recibo.total || 0)
      } else {
        meses[mes] = parseFloat(recibo.total || 0)
      }
    })
    
    return ultimos6Meses.map(item => ({
      ...item,
      ingresos: meses[item.mes] || 0
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex justify-center items-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard CCPrimavera</h1>
        <div className="text-white text-sm">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
          <CardBody className="text-white">
            <div className="text-2xl font-bold">{dashboardData.totalRecibos}</div>
            <div className="text-blue-100">Total Recibos</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600">
          <CardBody className="text-white">
            <div className="text-2xl font-bold">S/. {dashboardData.totalIngresos.toFixed(2)}</div>
            <div className="text-green-100">Total Ingresos</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-red-500 to-red-600">
          <CardBody className="text-white">
            <div className="text-2xl font-bold">S/. {dashboardData.totalEgresos.toFixed(2)}</div>
            <div className="text-red-100">Total Egresos</div>
          </CardBody>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600">
          <CardBody className="text-white">
            <div className="text-2xl font-bold">S/. {(dashboardData.totalIngresos - dashboardData.totalEgresos).toFixed(2)}</div>
            <div className="text-purple-100">Balance Neto</div>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de ingresos por mes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Ingresos por Mes</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.ingresosUltimosMeses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => [`S/. ${value.toFixed(2)}`, 'Ingresos']} />
                <Area type="monotone" dataKey="ingresos" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Gráfico de recibos por mes */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recibos por Mes</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.recibosPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos de conceptos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ingresos por concepto */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top 5 Ingresos por Concepto</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.ingresosPorConcepto}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ concepto, monto }) => `${concepto}: S/. ${monto.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {dashboardData.ingresosPorConcepto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`S/. ${value.toFixed(2)}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Egresos por concepto */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Top 5 Egresos por Concepto</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.egresosPorConcepto}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ concepto, monto }) => `${concepto}: S/. ${monto.toFixed(2)}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {dashboardData.egresosPorConcepto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`S/. ${value.toFixed(2)}`, 'Monto']} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Estado de stands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Estado de Stands</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-green-600 font-medium">Stands Activos</span>
                <span className="text-2xl font-bold text-green-600">{dashboardData.standsActivos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600 font-medium">Stands Inactivos</span>
                <span className="text-2xl font-bold text-red-600">{dashboardData.standsInactivos}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ 
                    width: `${dashboardData.standsActivos + dashboardData.standsInactivos > 0 ? 
                      (dashboardData.standsActivos / (dashboardData.standsActivos + dashboardData.standsInactivos)) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Resumen Financiero</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Ingresos Totales</span>
                <span className="text-lg font-bold text-green-600">S/. {dashboardData.totalIngresos.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Egresos Totales</span>
                <span className="text-lg font-bold text-red-600">S/. {dashboardData.totalEgresos.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Balance Neto</span>
                  <span className={`text-xl font-bold ${(dashboardData.totalIngresos - dashboardData.totalEgresos) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    S/. {(dashboardData.totalIngresos - dashboardData.totalEgresos).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}