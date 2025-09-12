'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Select, SelectItem, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@nextui-org/react'
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
  AreaChart,
  ComposedChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalRecibos: 0,
    totalIngresos: 0,
    totalEgresos: 0,
    totalCompras: 0,
    totalDeudas: 0,
    deudasPagadas: 0,
    deudasPendientes: 0,
    recibosPorMes: [],
    ingresosPorConcepto: [],
    egresosPorConcepto: [],
    comprasPorConcepto: [],
    standsActivos: 0,
    standsInactivos: 0,
    ingresosUltimosMeses: [],
    tendenciaFinanciera: [],
    distribucionMensual: [],
    comparacionTrimestral: [],
    eficienciaStands: [],
    radarFinanciero: [],
    fuelGaugeDeudas: 0
  })
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    año: new Date().getFullYear().toString(),
    mes: 'todos'
  })
  
  // Estados para modales de detalles
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoModal, setTipoModal] = useState('')
  const [datosModal, setDatosModal] = useState([])
  const [datosOriginales, setDatosOriginales] = useState({
    recibos: [],
    egresos: [],
    stands: [],
    compras: [],
    deudas: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (datosOriginales.recibos.length > 0) {
      procesarDatosConFiltros(datosOriginales.recibos, datosOriginales.egresos, datosOriginales.stands, datosOriginales.compras, datosOriginales.deudas)
    }
  }, [filtros, datosOriginales])


  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple APIs
      const [recibosResponse, egresosResponse, standsResponse, comprasResponse, deudasResponse] = await Promise.all([
        fetch('/api/reportes/ingresos-conceptos'),
        fetch('/api/recibo-egreso'),
        fetch('/api/stands'),
        fetch('/api/registro-compra'),
        fetch('/api/reg-deuda')
      ])

      const recibos = await recibosResponse.json()
      const egresos = await egresosResponse.json()
      const stands = await standsResponse.json()
      const compras = await comprasResponse.json()
      const deudas = await deudasResponse.json()

      // Guardar datos originales
      setDatosOriginales({ recibos, egresos, stands, compras, deudas })

      // Procesar datos con filtros actuales
      procesarDatosConFiltros(recibos, egresos, stands, compras, deudas)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const procesarDatosConFiltros = (recibos, egresos, stands, compras, deudas) => {
    // Validar que los datos sean arrays
    const recibosArray = Array.isArray(recibos) ? recibos : []
    const egresosArray = Array.isArray(egresos) ? egresos : []
    const comprasArray = Array.isArray(compras) ? compras : []
    const deudasArray = Array.isArray(deudas) ? deudas : []
    
    // Filtrar datos por año y mes
    let recibosFiltrados = recibosArray.filter(recibo => {
      const fecha = new Date(recibo.fecharecibo)
      const añoRecibo = fecha.getFullYear().toString()
      const mesRecibo = fecha.getMonth() + 1 // 1-12
      
      const coincideAño = filtros.año === 'todos' || añoRecibo === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesRecibo.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })
    
    

    let egresosFiltrados = egresosArray.filter(egreso => {
      const fecha = new Date(egreso.fecharecibo_egreso) // Corregir el campo de fecha
      const añoEgreso = fecha.getFullYear().toString()
      const mesEgreso = fecha.getMonth() + 1 // 1-12
      
      const coincideAño = filtros.año === 'todos' || añoEgreso === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesEgreso.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })
    

    let comprasFiltradas = comprasArray.filter(compra => {
      const fecha = new Date(compra.fecharegistro)
      const añoCompra = fecha.getFullYear().toString()
      const mesCompra = fecha.getMonth() + 1 // 1-12
      
      const coincideAño = filtros.año === 'todos' || añoCompra === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesCompra.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })

    // Para las deudas, no filtrar por fecha ya que queremos ver el estado actual
    // de todas las deudas independientemente de cuándo se crearon
    let deudasFiltradas = deudasArray

    // Procesar datos filtrados
    const totalRecibos = recibosFiltrados.length
    const totalIngresos = recibosFiltrados.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
    const totalEgresos = egresosFiltrados.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0)
    const totalCompras = comprasFiltradas.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0)
    
    // Calcular métricas de deudas
    const totalDeudas = deudasFiltradas.reduce((sum, deuda) => sum + parseFloat(deuda.total || 0), 0)
    const deudasPagadas = deudasFiltradas.filter(deuda => deuda.estado === true).length
    const deudasPendientes = deudasFiltradas.filter(deuda => deuda.estado === false).length
    const fuelGaugeDeudas = deudasFiltradas.length > 0 ? (deudasPagadas / deudasFiltradas.length) * 100 : 0
    
    // Debug logs para verificar datos de deudas
    console.log('=== DEBUG DEUDAS ===')
    console.log('Total deudas:', deudasFiltradas.length)
    console.log('Deudas pagadas:', deudasPagadas)
    console.log('Deudas pendientes:', deudasPendientes)
    console.log('Fuel gauge:', fuelGaugeDeudas)
    console.log('Primeras 3 deudas:', deudasFiltradas.slice(0, 3).map(d => ({ id: d.idregdeuda_detalle, estado: d.estado, total: d.total })))
    console.log('==================')
    
    const recibosPorMes = getRecibosPorMes(recibosFiltrados)
    const ingresosPorConcepto = getIngresosPorConcepto(recibosFiltrados)
    const egresosPorConcepto = getEgresosPorConcepto(egresosFiltrados)
    const comprasPorConcepto = getComprasPorConcepto(comprasFiltradas)
    const ingresosUltimosMeses = getIngresosUltimosMeses(recibosFiltrados)
    const tendenciaFinanciera = getTendenciaFinanciera(recibosFiltrados, egresosFiltrados, comprasFiltradas, deudasFiltradas)
    const distribucionMensual = getDistribucionMensual(recibosFiltrados, egresosFiltrados, comprasFiltradas, deudasFiltradas)
    const comparacionTrimestral = getComparacionTrimestral(recibosFiltrados, egresosFiltrados, comprasFiltradas, deudasFiltradas)
    // Asegurar que tenemos datos válidos
    const standsValidos = Array.isArray(stands) ? stands : []
    const recibosValidos = Array.isArray(recibosFiltrados) ? recibosFiltrados : []
    
    const eficienciaStands = getEficienciaStands(recibosValidos, standsValidos)
    const radarFinanciero = getRadarFinanciero(recibosFiltrados, egresosFiltrados, comprasFiltradas, deudasFiltradas)
    
    const standsActivos = stands.filter(stand => stand.estado).length
    const standsInactivos = stands.filter(stand => !stand.estado).length

    setDashboardData({
      totalRecibos,
      totalIngresos,
      totalEgresos,
      totalCompras,
      totalDeudas,
      deudasPagadas,
      deudasPendientes,
      fuelGaugeDeudas,
      recibosPorMes,
      ingresosPorConcepto,
      egresosPorConcepto,
      comprasPorConcepto,
      standsActivos,
      standsInactivos,
      ingresosUltimosMeses,
      tendenciaFinanciera,
      distribucionMensual,
      comparacionTrimestral,
      eficienciaStands,
      radarFinanciero
    })
  }

  const getRecibosPorMes = (recibos) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const data = meses.map((mes, index) => {
      const recibosDelMes = recibos.filter(recibo => {
        const fecha = new Date(recibo.fecharecibo)
        return fecha.getMonth() === index
      })
      return {
        mes,
        cantidad: recibosDelMes.length,
        ingresos: recibosDelMes.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
      }
    })
    return data
  }

  const getIngresosPorConcepto = (recibos) => {
    const conceptos = {}
    recibos.forEach(recibo => {
      recibo.detalles.forEach(detalle => {
        const concepto = detalle.concepto?.descripcion || 'Sin concepto'
        if (!conceptos[concepto]) {
          conceptos[concepto] = 0
        }
        conceptos[concepto] += parseFloat(detalle.monto || 0)
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
      // Los egresos tienen detalles, no concepto directo
      egreso.detalles?.forEach(detalle => {
        const concepto = detalle.concepto?.descripcion || 'Sin concepto'
        if (!conceptos[concepto]) {
          conceptos[concepto] = 0
        }
        conceptos[concepto] += parseFloat(detalle.monto || 0)
      })
    })
    
    return Object.entries(conceptos)
      .map(([concepto, monto]) => ({ concepto, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
  }

  const getComprasPorConcepto = (compras) => {
    const conceptos = {}
    compras.forEach(compra => {
      const concepto = compra.tipoCompra?.descripcion || 'Sin tipo'
      if (!conceptos[concepto]) {
        conceptos[concepto] = 0
      }
      conceptos[concepto] += parseFloat(compra.monto || 0)
    })
    
    return Object.entries(conceptos)
      .map(([concepto, monto]) => ({ concepto, monto }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
  }

  const getIngresosUltimosMeses = (recibos) => {
    const ultimos6Meses = []
    const hoy = new Date()
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short' })
      
      const recibosDelMes = recibos.filter(recibo => {
        const fechaRecibo = new Date(recibo.fecharecibo)
        return fechaRecibo.getMonth() === fecha.getMonth() && 
               fechaRecibo.getFullYear() === fecha.getFullYear()
      })
      
      const total = recibosDelMes.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
      
      ultimos6Meses.push({
        mes,
        ingresos: total
      })
    }
    
    return ultimos6Meses
  }

  // Nuevas funciones para gráficos adicionales
  const getTendenciaFinanciera = (recibos, egresosData, comprasData, deudasData) => {
    const ultimos6Meses = []
    const hoy = new Date()
    
    // Validar que los datos sean arrays
    const recibosArray = Array.isArray(recibos) ? recibos : []
    const egresosArray = Array.isArray(egresosData) ? egresosData : []
    const comprasArray = Array.isArray(comprasData) ? comprasData : []
    const deudasArray = Array.isArray(deudasData) ? deudasData : []
    
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const mes = fecha.toLocaleDateString('es-ES', { month: 'short' })
      
      const recibosDelMes = recibosArray.filter(recibo => {
        const fechaRecibo = new Date(recibo.fecharecibo)
        return fechaRecibo.getMonth() === fecha.getMonth() && 
               fechaRecibo.getFullYear() === fecha.getFullYear()
      })
      
      const egresosDelMes = egresosArray.filter(egreso => {
        const fechaEgreso = new Date(egreso.fecharecibo)
        return fechaEgreso.getMonth() === fecha.getMonth() && 
               fechaEgreso.getFullYear() === fecha.getFullYear()
      })
      
      const comprasDelMes = comprasArray.filter(compra => {
        const fechaCompra = new Date(compra.fecharegistro)
        return fechaCompra.getMonth() === fecha.getMonth() && 
               fechaCompra.getFullYear() === fecha.getFullYear()
      })
      
      // Para deudas, contar las que se pagaron en este mes
      const deudasPagadasDelMes = deudasArray.filter(deuda => {
        if (!deuda.estado) return false // Solo deudas pagadas
        const fechaPago = new Date(deuda.updatedAt || deuda.createdAt)
        return fechaPago.getMonth() === fecha.getMonth() && 
               fechaPago.getFullYear() === fecha.getFullYear()
      })
      
      const ingresos = recibosDelMes.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
      const egresos = egresosDelMes.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0)
      const compras = comprasDelMes.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0)
      const deudasPagadas = deudasPagadasDelMes.reduce((sum, deuda) => sum + parseFloat(deuda.total || 0), 0)
      const balance = ingresos - egresos - compras
      
      ultimos6Meses.push({
        mes,
        ingresos,
        egresos,
        compras,
        deudasPagadas,
        balance
      })
    }
    
    return ultimos6Meses
  }

  const getDistribucionMensual = (recibos, egresosData, comprasData, deudasData) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    // Validar que los datos sean arrays
    const recibosArray = Array.isArray(recibos) ? recibos : []
    const egresosArray = Array.isArray(egresosData) ? egresosData : []
    const comprasArray = Array.isArray(comprasData) ? comprasData : []
    const deudasArray = Array.isArray(deudasData) ? deudasData : []
    
    console.log('🔍 DEBUG getDistribucionMensual:')
    console.log('Recibos:', recibosArray.length)
    console.log('Egresos:', egresosArray.length)
    console.log('Compras:', comprasArray.length)
    console.log('Deudas:', deudasArray.length)
    
    return meses.map((mes, index) => {
      const recibosDelMes = recibosArray.filter(recibo => {
        const fecha = new Date(recibo.fecharecibo)
        return fecha.getMonth() === index
      })
      
      const egresosDelMes = egresosArray.filter(egreso => {
        const fecha = new Date(egreso.fecharecibo_egreso)
        return fecha.getMonth() === index
      })
      
      const comprasDelMes = comprasArray.filter(compra => {
        const fecha = new Date(compra.fecharegistro)
        return fecha.getMonth() === index
      })
      
      // Para deudas, contar las que se pagaron en este mes
      const deudasPagadasDelMes = deudasArray.filter(deuda => {
        if (!deuda.estado) return false // Solo deudas pagadas
        const fechaPago = new Date(deuda.updatedAt || deuda.createdAt)
        return fechaPago.getMonth() === index
      })
      
      return {
        mes,
        ingresos: recibosDelMes.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0),
        egresos: egresosDelMes.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0),
        compras: comprasDelMes.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0),
        deudasPagadas: deudasPagadasDelMes.reduce((sum, deuda) => sum + parseFloat(deuda.total || 0), 0)
      }
    })
  }

  const getComparacionTrimestral = (recibos, egresosData, compras, deudasData) => {
    const trimestres = [
      { nombre: 'Q1', meses: [0, 1, 2] },
      { nombre: 'Q2', meses: [3, 4, 5] },
      { nombre: 'Q3', meses: [6, 7, 8] },
      { nombre: 'Q4', meses: [9, 10, 11] }
    ]
    
    // Validar que los datos sean arrays
    const recibosArray = Array.isArray(recibos) ? recibos : []
    const egresosArray = Array.isArray(egresosData) ? egresosData : []
    const comprasArray = Array.isArray(compras) ? compras : []
    const deudasArray = Array.isArray(deudasData) ? deudasData : []
    
    return trimestres.map(trimestre => {
      let ingresos = 0
      let egresos = 0
      let compras = 0
      let deudasPagadas = 0
      
      trimestre.meses.forEach(mes => {
        const recibosDelMes = recibosArray.filter(recibo => {
          const fecha = new Date(recibo.fecharecibo)
          return fecha.getMonth() === mes
        })
        
        const egresosDelMes = egresosArray.filter(egreso => {
          const fecha = new Date(egreso.fecharecibo)
          return fecha.getMonth() === mes
        })
        
        const comprasDelMes = comprasArray.filter(compra => {
          const fecha = new Date(compra.fecharegistro)
          return fecha.getMonth() === mes
        })
        
        // Para deudas, contar las que se pagaron en este mes
        const deudasPagadasDelMes = deudasArray.filter(deuda => {
          if (!deuda.estado) return false // Solo deudas pagadas
          const fechaPago = new Date(deuda.updatedAt || deuda.createdAt)
          return fechaPago.getMonth() === mes
        })
        
        ingresos += recibosDelMes.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
        egresos += egresosDelMes.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0)
        compras += comprasDelMes.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0)
        deudasPagadas += deudasPagadasDelMes.reduce((sum, deuda) => sum + parseFloat(deuda.total || 0), 0)
      })
      
      return {
        trimestre: trimestre.nombre,
        ingresos,
        egresos,
        compras,
        deudasPagadas,
        balance: ingresos - egresos - compras
      }
    })
  }

  const getEficienciaStands = (recibos, stands) => {
    try {
      // Validar que los datos sean arrays
      const recibosArray = Array.isArray(recibos) ? recibos : []
      const standsArray = Array.isArray(stands) ? stands : []
      
      if (recibosArray.length === 0 || standsArray.length === 0) {
        return []
      }
      
      const standsConIngresos = standsArray.map(stand => {
        const ingresosStand = recibosArray
          .filter(recibo => recibo.stand?.idstand === stand.idstand)
          .reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
        
        return {
          stand: stand.descripcion || 'Sin nombre',
          piso: stand.nivel || 0,
          ingresos: ingresosStand,
          estado: stand.estado ? 'Activo' : 'Inactivo'
        }
      }).sort((a, b) => b.ingresos - a.ingresos).slice(0, 10)
      
      return standsConIngresos
    } catch (error) {
      console.error('Error en getEficienciaStands:', error)
      return []
    }
  }

  const getRadarFinanciero = (recibos, egresosData, comprasData, deudasData) => {
    // Validar que los datos sean arrays
    const recibosArray = Array.isArray(recibos) ? recibos : []
    const egresosArray = Array.isArray(egresosData) ? egresosData : []
    const comprasArray = Array.isArray(comprasData) ? comprasData : []
    const deudasArray = Array.isArray(deudasData) ? deudasData : []
    
    const totalIngresos = recibosArray.reduce((sum, recibo) => sum + parseFloat(recibo.total || 0), 0)
    const totalEgresos = egresosArray.reduce((sum, egreso) => sum + parseFloat(egreso.total || 0), 0)
    const totalCompras = comprasArray.reduce((sum, compra) => sum + parseFloat(compra.monto || 0), 0)
    const totalDeudasPagadas = deudasArray.filter(deuda => deuda.estado).reduce((sum, deuda) => sum + parseFloat(deuda.total || 0), 0)
    
    // Normalizar valores para el radar (0-100)
    const maxValor = Math.max(totalIngresos, totalEgresos, totalCompras, totalDeudasPagadas)
    
    return [
      { categoria: 'Ingresos', valor: (totalIngresos / maxValor) * 100 },
      { categoria: 'Egresos', valor: (totalEgresos / maxValor) * 100 },
      { categoria: 'Compras', valor: (totalCompras / maxValor) * 100 },
      { categoria: 'Deudas Pagadas', valor: (totalDeudasPagadas / maxValor) * 100 },
      { categoria: 'Balance', valor: Math.max(0, ((totalIngresos - totalEgresos - totalCompras) / maxValor) * 100) }
    ]
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Generar opciones de años (desde 2000 hasta 2050, igual que Reg Deuda)
  const añosDisponibles = () => {
    const years = []
    for (let year = 2000; year <= 2050; year++) {
      years.push(year.toString())
    }
    return years
  }

  // Generar opciones de meses
  const mesesDisponibles = () => {
    const meses = [
      { value: '1', label: 'Enero' },
      { value: '2', label: 'Febrero' },
      { value: '3', label: 'Marzo' },
      { value: '4', label: 'Abril' },
      { value: '5', label: 'Mayo' },
      { value: '6', label: 'Junio' },
      { value: '7', label: 'Julio' },
      { value: '8', label: 'Agosto' },
      { value: '9', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' }
    ]
    return meses
  }

  const handleFiltroChange = (tipo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [tipo]: valor
    }))
  }

  // Funciones para manejar clics en tarjetas
  const abrirModal = (tipo, titulo) => {
    console.log('🔍 Abriendo modal:', tipo, 'con título:', titulo)
    const datos = obtenerDatosDetalle(tipo)
    console.log('🔍 Datos obtenidos para modal:', datos)
    console.log('🔍 Tipo de datos:', typeof datos)
    console.log('🔍 Es array:', Array.isArray(datos))
    
    setTipoModal(titulo)
    setDatosModal(Array.isArray(datos) ? datos : [])
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setTipoModal('')
    setDatosModal([])
  }

  // Función para obtener datos detallados según el tipo
  const obtenerDatosDetalle = (tipo) => {
    console.log('🔍 Obteniendo datos para tipo:', tipo)
    console.log('🔍 Datos originales disponibles:', {
      recibos: datosOriginales.recibos?.length || 0,
      egresos: datosOriginales.egresos?.length || 0,
      compras: datosOriginales.compras?.length || 0,
      deudas: datosOriginales.deudas?.length || 0
    })
    console.log('🔍 Primeros 3 egresos originales:', datosOriginales.egresos?.slice(0, 3))
    
    // Obtener datos filtrados usando la misma lógica que procesarDatosConFiltros
    const recibosArray = Array.isArray(datosOriginales.recibos) ? datosOriginales.recibos : []
    const egresosArray = Array.isArray(datosOriginales.egresos) ? datosOriginales.egresos : []
    const comprasArray = Array.isArray(datosOriginales.compras) ? datosOriginales.compras : []
    const deudasArray = Array.isArray(datosOriginales.deudas) ? datosOriginales.deudas : []
    
    // Aplicar filtros
    const recibosFiltrados = recibosArray.filter(recibo => {
      const fecha = new Date(recibo.fecharecibo)
      const añoRecibo = fecha.getFullYear().toString()
      const mesRecibo = fecha.getMonth() + 1
      
      const coincideAño = filtros.año === 'todos' || añoRecibo === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesRecibo.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })
    
    const egresosFiltrados = egresosArray.filter(egreso => {
      const fecha = new Date(egreso.fecharecibo_egreso)
      const añoEgreso = fecha.getFullYear().toString()
      const mesEgreso = fecha.getMonth() + 1
      
      const coincideAño = filtros.año === 'todos' || añoEgreso === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesEgreso.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })
    
    const comprasFiltradas = comprasArray.filter(compra => {
      const fecha = new Date(compra.fecharegistro)
      const añoCompra = fecha.getFullYear().toString()
      const mesCompra = fecha.getMonth() + 1
      
      const coincideAño = filtros.año === 'todos' || añoCompra === filtros.año
      const coincideMes = filtros.mes === 'todos' || mesCompra.toString() === filtros.mes
      
      return coincideAño && coincideMes
    })
    
    // Las deudas no se filtran por fecha
    const deudasFiltradas = deudasArray
    
    let result = []
    
    switch (tipo) {
      case 'recibos':
        console.log('🔍 Total recibos filtrados:', recibosFiltrados.length)
        console.log('🔍 Primer recibo:', recibosFiltrados[0])
        
        result = recibosFiltrados.flatMap(recibo => {
          console.log('🔍 Estructura completa del recibo:', JSON.stringify(recibo, null, 2))
          console.log('🔍 Stand:', recibo.stand)
          console.log('🔍 Cliente en stand (client):', recibo.stand?.client)
          console.log('🔍 Cliente directo:', recibo.cliente)
          console.log('🔍 Detalles del recibo:', recibo.detalles)
          console.log('🔍 Campos disponibles en recibo:', Object.keys(recibo))
          
          const cliente = recibo.stand?.client?.nombre || 
                         recibo.stand?.client?.nombre_cliente || 
                         recibo.stand?.client?.nombre_completo ||
                         recibo.stand?.cliente?.nombre || 
                         recibo.stand?.cliente?.nombre_cliente || 
                         recibo.cliente?.nombre || 
                         'N/A'
          
          console.log('🔍 Cliente final:', cliente)
          
          // Si hay detalles, mapear cada uno
          if (recibo.detalles && recibo.detalles.length > 0) {
            return recibo.detalles.map(detalle => ({
              id: recibo.idrecibo_ingreso || recibo.id || 'N/A',
              fecha: new Date(recibo.fecharecibo).toLocaleDateString('es-ES'),
              cliente: cliente,
              stand: recibo.stand?.descripcion || 'N/A',
              piso: recibo.stand?.nivel || 'N/A',
              concepto: detalle.concepto?.descripcion || detalle.concepto_deuda?.descripcion || 'N/A',
              total: parseFloat(detalle.monto || 0)
            }))
          } else {
            // Si no hay detalles, usar el recibo completo
            return [{
              id: recibo.idrecibo_ingreso || recibo.id || 'N/A',
              fecha: new Date(recibo.fecharecibo).toLocaleDateString('es-ES'),
              cliente: cliente,
              stand: recibo.stand?.descripcion || 'N/A',
              piso: recibo.stand?.nivel || 'N/A',
              concepto: recibo.concepto_deuda?.descripcion || 'N/A',
              total: parseFloat(recibo.total || 0)
            }]
          }
        })
        break
      
      case 'ingresos':
        result = recibosFiltrados.flatMap(recibo => {
          const cliente = recibo.stand?.client?.nombre || 
                         recibo.stand?.client?.nombre_cliente || 
                         recibo.stand?.client?.nombre_completo ||
                         recibo.stand?.cliente?.nombre || 
                         recibo.stand?.cliente?.nombre_cliente || 
                         recibo.cliente?.nombre || 
                         'N/A'
          
          // Si hay detalles, mapear cada uno
          if (recibo.detalles && recibo.detalles.length > 0) {
            return recibo.detalles.map(detalle => ({
              id: recibo.idrecibo_ingreso || recibo.id || 'N/A',
              fecha: new Date(recibo.fecharecibo).toLocaleDateString('es-ES'),
              cliente: cliente,
              stand: recibo.stand?.descripcion || 'N/A',
              piso: recibo.stand?.nivel || 'N/A',
              concepto: detalle.concepto?.descripcion || detalle.concepto_deuda?.descripcion || 'N/A',
              monto: parseFloat(detalle.monto || 0)
            }))
          } else {
            // Si no hay detalles, usar el recibo completo
            return [{
              id: recibo.idrecibo_ingreso || recibo.id || 'N/A',
              fecha: new Date(recibo.fecharecibo).toLocaleDateString('es-ES'),
              cliente: cliente,
              stand: recibo.stand?.descripcion || 'N/A',
              piso: recibo.stand?.nivel || 'N/A',
              concepto: recibo.concepto_deuda?.descripcion || 'N/A',
              monto: parseFloat(recibo.total || 0)
            }]
          }
        })
        break
      
      case 'egresos':
        console.log('🔍 Total egresos filtrados:', egresosFiltrados.length)
        console.log('🔍 Primeros 3 egresos:', egresosFiltrados.slice(0, 3))
        
        result = egresosFiltrados.flatMap(egreso => {
          console.log('🔍 Estructura completa del egreso:', JSON.stringify(egreso, null, 2))
          console.log('🔍 Detalles del egreso:', egreso.detalles)
          
          return egreso.detalles?.map(detalle => {
            console.log('🔍 Detalle individual:', JSON.stringify(detalle, null, 2))
            console.log('🔍 Concepto en detalle:', detalle.concepto)
            console.log('🔍 Concepto egreso en detalle:', detalle.concepto_egreso)
            console.log('🔍 Descripción en detalle:', detalle.descripcion)
            console.log('🔍 Descripción en egreso:', egreso.descripcion)
            console.log('🔍 Método pago en egreso:', egreso.metodo_pago)
            console.log('🔍 Método pago en detalle:', detalle.metodo_pago)
            console.log('🔍 Estructura completa del método de pago:', JSON.stringify(egreso.metodo_pago, null, 2))
            console.log('🔍 ID método de pago:', egreso.idmetodo_pago)
            console.log('🔍 Campos disponibles en egreso:', Object.keys(egreso))
            console.log('🔍 Campos disponibles en detalle:', Object.keys(detalle))
            
            return {
              id: egreso.idrecibo_egreso || egreso.id || 'N/A',
              fecha: new Date(egreso.fecharecibo_egreso).toLocaleDateString('es-ES'),
              concepto: detalle.concepto?.descripcion || 
                       detalle.concepto_egreso?.descripcion || 
                       detalle.concepto_deuda?.descripcion || 
                       'N/A',
              monto: parseFloat(detalle.monto || 0),
              descripcion: detalle.descripcion || 
                          egreso.descripcion || 
                          detalle.concepto?.descripcion || 
                          'N/A'
            }
          }) || []
        })
        break
      
      case 'compras':
        console.log('🔍 Total compras filtradas:', comprasFiltradas.length)
        console.log('🔍 Primera compra:', comprasFiltradas[0])
        
        result = comprasFiltradas.map(compra => {
          console.log('🔍 Estructura completa de la compra:', JSON.stringify(compra, null, 2))
          console.log('🔍 Campos disponibles en compra:', Object.keys(compra))
          console.log('🔍 ID compra:', compra.idcompra)
          console.log('🔍 ID:', compra.id)
          console.log('🔍 Descripción (proveedor):', compra.descripcion)
          console.log('🔍 Tipo compra:', compra.tipoCompra)
          console.log('🔍 Tipo compra descripción:', compra.tipoCompra?.descripcion)
          console.log('🔍 Número comprobante:', compra.numcomprobante)
          console.log('🔍 Monto:', compra.monto)
          console.log('🔍 Observaciones:', compra.observaciones)
          
          return {
            id: compra.idcompra || compra.id || 'N/A',
            fecha: new Date(compra.fecharegistro).toLocaleDateString('es-ES'),
            proveedor: compra.descripcion || compra.proveedor || compra.nombre_proveedor || compra.proveedor_nombre || 'N/A',
            tipoDoc: compra.tipoCompra?.descripcion || 
                    compra.tipo_documento_compra?.descripcion || 
                    compra.tipo_documento?.descripcion || 
                    compra.tipoDoc?.descripcion ||
                    'N/A',
            numeroDoc: compra.numcomprobante || compra.numero_documento || compra.numeroDoc || compra.num_documento || 'N/A',
            monto: parseFloat(compra.monto || compra.total || compra.importe || 0)
          }
        })
        break
      
      case 'deudas-pagadas':
        console.log('🔍 Deudas filtradas para pagadas:', deudasFiltradas)
        console.log('🔍 Tipo de deudas filtradas:', typeof deudasFiltradas)
        console.log('🔍 Es array:', Array.isArray(deudasFiltradas))
        
        const deudasArray = Array.isArray(deudasFiltradas) ? deudasFiltradas : []
        result = deudasArray.filter(deuda => deuda.estado).map(deuda => ({
          id: deuda.idregdeuda_detalle || deuda.id || 'N/A',
          fecha: new Date(deuda.updatedAt || deuda.createdAt).toLocaleDateString('es-ES'),
          cliente: deuda.stand?.client?.nombre || 
                   deuda.stand?.client?.nombre_cliente || 
                   deuda.stand?.client?.nombre_completo ||
                   deuda.stand?.cliente?.nombre || 
                   deuda.stand?.cliente?.nombre_cliente || 
                   deuda.cliente?.nombre || 
                   'N/A',
          stand: deuda.stand?.descripcion || 'N/A',
          piso: deuda.stand?.nivel || 'N/A',
          concepto: deuda.concepto?.descripcion || 
                   deuda.concepto_deuda?.descripcion || 
                   deuda.concepto_deuda?.concepto?.descripcion ||
                   'N/A',
          monto: parseFloat(deuda.total || 0)
        }))
        break
      
      case 'deudas-pendientes':
        console.log('🔍 Deudas filtradas para pendientes:', deudasFiltradas)
        const deudasPendientesArray = Array.isArray(deudasFiltradas) ? deudasFiltradas : []
        result = deudasPendientesArray.filter(deuda => !deuda.estado).map(deuda => ({
          id: deuda.idregdeuda_detalle || deuda.id || 'N/A',
          fecha: new Date(deuda.createdAt).toLocaleDateString('es-ES'),
          cliente: deuda.stand?.client?.nombre || 
                   deuda.stand?.client?.nombre_cliente || 
                   deuda.stand?.client?.nombre_completo ||
                   deuda.stand?.cliente?.nombre || 
                   deuda.stand?.cliente?.nombre_cliente || 
                   deuda.cliente?.nombre || 
                   'N/A',
          stand: deuda.stand?.descripcion || 'N/A',
          piso: deuda.stand?.nivel || 'N/A',
          concepto: deuda.concepto?.descripcion || 
                   deuda.concepto_deuda?.descripcion || 
                   deuda.concepto_deuda?.concepto?.descripcion ||
                   'N/A',
          monto: parseFloat(deuda.total || 0)
        }))
        break
      
      case 'deudas-total':
        console.log('🔍 Total deudas filtradas:', deudasFiltradas)
        console.log('🔍 Tipo de deudas filtradas:', typeof deudasFiltradas)
        console.log('🔍 Es array:', Array.isArray(deudasFiltradas))
        
        const deudasTotalArray = Array.isArray(deudasFiltradas) ? deudasFiltradas : []
        console.log('🔍 Total deudas array:', deudasTotalArray.length)
        console.log('🔍 Primera deuda:', deudasTotalArray[0])
        
        result = deudasTotalArray.map(deuda => {
          console.log('🔍 Estructura completa de la deuda:', JSON.stringify(deuda, null, 2))
          console.log('🔍 Concepto deuda en deuda:', deuda.concepto_deuda)
          console.log('🔍 Concepto en deuda:', deuda.concepto)
          console.log('🔍 Campos disponibles en deuda:', Object.keys(deuda))
          
          return {
            id: deuda.idregdeuda_detalle || deuda.id || 'N/A',
            fecha: new Date(deuda.updatedAt || deuda.createdAt).toLocaleDateString('es-ES'),
            cliente: deuda.stand?.client?.nombre || 
                     deuda.stand?.client?.nombre_cliente || 
                     deuda.stand?.client?.nombre_completo ||
                     deuda.stand?.cliente?.nombre || 
                     deuda.stand?.cliente?.nombre_cliente || 
                     deuda.cliente?.nombre || 
                     'N/A',
            stand: deuda.stand?.descripcion || 'N/A',
            piso: deuda.stand?.nivel || 'N/A',
            concepto: deuda.concepto?.descripcion || 
                     deuda.concepto_deuda?.descripcion || 
                     deuda.concepto_deuda?.concepto?.descripcion ||
                     'N/A',
            monto: parseFloat(deuda.total || 0),
            estado: deuda.estado ? 'Pagado' : 'Pendiente'
          }
        })
        break
      
      default:
        console.log('🔍 Tipo no reconocido:', tipo)
        result = []
    }
    
    console.log('🔍 Resultado final para', tipo, ':', result)
    console.log('🔍 Tipo del resultado:', typeof result)
    console.log('🔍 Es array el resultado:', Array.isArray(result))
    
    // Asegurar que siempre devuelva un array
    return Array.isArray(result) ? result : []
  }

  const limpiarFiltros = () => {
    setFiltros({
      año: new Date().getFullYear().toString(),
      mes: 'todos'
    })
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-7rem)] flex justify-center items-center">
        <div className="text-white text-xl">Cargando dashboard...</div>
      </div>
    )
  }

  
  console.log('🔍 Dashboard renderizando...')
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard CCPrimavera</h1>
        <div className="flex items-center gap-4">
          <div className="text-white text-sm">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </div>

      {/* Controles de filtro */}
      <Card className="bg-white/10 backdrop-blur-sm">
        <CardBody className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-white text-sm font-medium">Año:</label>
                <Select
                  size="sm"
                  className="w-32"
                  selectedKeys={[filtros.año]}
                  onSelectionChange={(keys) => handleFiltroChange('año', Array.from(keys)[0])}
                >
                  <SelectItem key="todos" value="todos">Todos</SelectItem>
                  {añosDisponibles().map(año => (
                    <SelectItem key={año.toString()} value={año.toString()}>
                      {año}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-white text-sm font-medium">Mes:</label>
                <Select
                  size="sm"
                  className="w-36"
                  selectedKeys={[filtros.mes]}
                  onSelectionChange={(keys) => handleFiltroChange('mes', Array.from(keys)[0])}
                >
                  <SelectItem key="todos" value="todos">Todos</SelectItem>
                  {mesesDisponibles().map(mes => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            
            <Button
              size="sm"
              variant="bordered"
              className="text-white border-white/20 hover:bg-white/10"
              onPress={limpiarFiltros}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div 
          className="bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer hover:from-blue-500 hover:to-blue-600 transition-all duration-200 rounded-lg p-6"
          onClick={() => abrirModal('recibos', 'Total Recibos')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Recibos</p>
              <p className="text-3xl font-bold text-white">{dashboardData.totalRecibos}</p>
            </div>
            <div className="p-3 bg-blue-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-green-600 to-green-700 cursor-pointer hover:from-green-500 hover:to-green-600 transition-all duration-200 rounded-lg p-6"
          onClick={() => abrirModal('ingresos', 'Total Ingresos')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Ingresos</p>
              <p className="text-3xl font-bold text-white">S/ {dashboardData.totalIngresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => abrirModal('egresos', 'Total Egresos')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Egresos</p>
              <p className="text-3xl font-bold text-white">S/ {dashboardData.totalEgresos.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-red-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-purple-600 to-purple-700">
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Balance Neto</p>
                <p className="text-3xl font-bold text-white">
                  S/ {(dashboardData.totalIngresos - dashboardData.totalEgresos - dashboardData.totalCompras).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-full">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardBody>
        </Card>

        <div 
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
          onClick={() => abrirModal('compras', 'Total Compras')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Total Compras</p>
              <p className="text-3xl font-bold text-white">S/ {dashboardData.totalCompras.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-orange-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de deudas y cobros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 cursor-pointer hover:from-indigo-500 hover:to-indigo-600 transition-all duration-200 rounded-lg p-6"
          onClick={() => abrirModal('deudas-total', 'Total Deudas')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Deudas</p>
              <p className="text-3xl font-bold text-white">S/ {dashboardData.totalDeudas.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-indigo-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-green-600 to-green-700 cursor-pointer hover:from-green-500 hover:to-green-600 transition-all duration-200 rounded-lg p-6"
          onClick={() => abrirModal('deudas-pagadas', 'Deudas Pagadas')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Deudas Pagadas</p>
              <p className="text-3xl font-bold text-white">{dashboardData.deudasPagadas}</p>
            </div>
            <div className="p-3 bg-green-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div 
          className="bg-gradient-to-r from-red-600 to-red-700 cursor-pointer hover:from-red-500 hover:to-red-600 transition-all duration-200 rounded-lg p-6"
          onClick={() => abrirModal('deudas-pendientes', 'Deudas Pendientes')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Deudas Pendientes</p>
              <p className="text-3xl font-bold text-white">{dashboardData.deudasPendientes}</p>
            </div>
            <div className="p-3 bg-red-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Fuel Gauge de Deudas */}
        <div 
          className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 rounded-lg cursor-pointer hover:from-yellow-700 hover:to-yellow-800 transition-all duration-200"
          onClick={() => abrirModal('deudas-pagadas', 'Deudas Pagadas')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">% Cobros Completados</p>
              <div className="flex items-center space-x-2">
                <div className="w-16 h-16 relative">
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-yellow-200"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-white"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${dashboardData.fuelGaugeDeudas}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {Math.round(dashboardData.fuelGaugeDeudas)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-yellow-500 rounded-full">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Ingresos por Mes</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.ingresosUltimosMeses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="ingresos" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Recibos por Mes</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.recibosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="cantidad" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Gráficos de conceptos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Top 5 Ingresos por Concepto</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.ingresosPorConcepto}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ concepto, monto }) => `${concepto}: S/ ${monto.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {dashboardData.ingresosPorConcepto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Top 5 Egresos por Concepto</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.egresosPorConcepto}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ concepto, monto }) => `${concepto}: S/ ${monto.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {dashboardData.egresosPorConcepto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Top 5 Compras por Tipo</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.comprasPorConcepto}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ concepto, monto }) => `${concepto}: S/ ${monto.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="monto"
                >
                  {dashboardData.comprasPorConcepto.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Nuevos gráficos avanzados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia Financiera */}
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Tendencia Financiera (Últimos 6 meses)</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={dashboardData.tendenciaFinanciera}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#EF4444" name="Egresos" />
                <Bar dataKey="compras" fill="#F97316" name="Compras" />
                <Bar dataKey="deudasPagadas" fill="#3B82F6" name="Deudas Pagadas" />
                <Line type="monotone" dataKey="balance" stroke="#8B5CF6" strokeWidth={3} name="Balance" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Distribución Mensual */}
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Distribución Mensual</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.distribucionMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="mes" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="ingresos" stackId="a" fill="#10B981" name="Ingresos" />
                <Bar dataKey="egresos" stackId="a" fill="#EF4444" name="Egresos" />
                <Bar dataKey="compras" stackId="a" fill="#F97316" name="Compras" />
                <Bar dataKey="deudasPagadas" stackId="a" fill="#3B82F6" name="Deudas Pagadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Comparación Trimestral y Eficiencia de Stands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparación Trimestral */}
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Comparación Trimestral</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.comparacionTrimestral}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="trimestre" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Bar dataKey="ingresos" fill="#10B981" name="Ingresos" />
                <Bar dataKey="egresos" fill="#EF4444" name="Egresos" />
                <Bar dataKey="compras" fill="#F97316" name="Compras" />
                <Bar dataKey="deudasPagadas" fill="#3B82F6" name="Deudas Pagadas" />
                <Bar dataKey="balance" fill="#8B5CF6" name="Balance" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Eficiencia de Stands */}
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Top 10 Stands por Ingresos</h3>
          </CardHeader>
          <CardBody>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={dashboardData.eficienciaStands || []} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="stand" 
                    stroke="#9CA3AF"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    tickFormatter={(value) => `S/ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                    formatter={(value, name) => [`S/ ${value.toLocaleString()}`, 'Ingresos']}
                  />
                  <Bar 
                    dataKey="ingresos" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Radar Financiero */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Análisis Radar Financiero</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={dashboardData.radarFinanciero}>
                <PolarGrid />
                <PolarAngleAxis dataKey="categoria" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Valores"
                  dataKey="valor"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Gráfico de Dispersión - Ingresos vs Egresos */}
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Correlación Ingresos vs Egresos</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={dashboardData.distribucionMensual}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="ingresos" name="Ingresos" stroke="#9CA3AF" />
                <YAxis dataKey="egresos" name="Egresos" stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Scatter dataKey="egresos" fill="#EF4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Estado de stands */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Estado de Stands</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Activos</span>
                <span className="text-green-400 font-bold">{dashboardData.standsActivos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Inactivos</span>
                <span className="text-red-400 font-bold">{dashboardData.standsInactivos}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${dashboardData.standsActivos + dashboardData.standsInactivos > 0 
                      ? (dashboardData.standsActivos / (dashboardData.standsActivos + dashboardData.standsInactivos)) * 100 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-xl font-semibold text-white">Resumen Financiero</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white">Ingresos Totales</span>
                <span className="text-green-400 font-bold">S/ {dashboardData.totalIngresos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Egresos Totales</span>
                <span className="text-red-400 font-bold">S/ {dashboardData.totalEgresos.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white">Compras Totales</span>
                <span className="text-orange-400 font-bold">S/ {dashboardData.totalCompras.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-600 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold">Balance Neto</span>
                  <span className={`font-bold text-lg ${
                    (dashboardData.totalIngresos - dashboardData.totalEgresos - dashboardData.totalCompras) >= 0 
                      ? 'text-green-400' 
                      : 'text-red-400'
                  }`}>
                    S/ {(dashboardData.totalIngresos - dashboardData.totalEgresos - dashboardData.totalCompras).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Modal de detalles */}
      {modalAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={cerrarModal}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Detalle de {tipoModal.charAt(0).toUpperCase() + tipoModal.slice(1)}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl"
                onClick={cerrarModal}
              >
                ×
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[60vh]">
              {datosModal.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(datosModal[0]).map((key) => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {datosModal.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(item).map((value, valueIndex) => (
                            <td key={valueIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No hay datos disponibles</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Total de registros: {datosModal.length}
              </p>
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={cerrarModal}
              >
                Cerrar
        </button>
      </div>
          </div>
        </div>
      )}
    </div>
  )
}