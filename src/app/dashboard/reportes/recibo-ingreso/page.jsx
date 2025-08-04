// app/dashboard/reportes/recibos-ingreso/page.js
'use client'
import { useState, useEffect } from 'react'
import ReporteRecibos from '@/components/reporteReciboIngreso/ReporteRecibos'
import { Spinner } from '@nextui-org/react'
import { useSession } from '@/context/SessionContext'
export default function ReporteRecibosIngresoPage() {
    const session = useSession()
    console.log(session.user.name)
  const [empresa, setEmpresa] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await fetch('/api/empresa')
        const data = await res.json()
        if (data && data.length > 0) {
          setEmpresa(data[0])
        }
      } catch (error) {
        console.error('Error cargando empresa:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEmpresa()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="p-4">
      <ReporteRecibos empresa={empresa} usuario={session.user.name} />
    </div>
  )
}