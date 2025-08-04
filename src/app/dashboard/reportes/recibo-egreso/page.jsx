'use client'
import { useState, useEffect } from 'react'
import ReporteEgresos from '@/components/reporteReciboEgreso/ReporteEgresos'
import { Spinner } from '@nextui-org/react'
import { useSession } from '@/context/SessionContext'

export default function ReporteRecibosEgresoPage() {
    const session = useSession()
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
            <ReporteEgresos empresa={empresa} usuario={session.user.name} />
        </div>
    )
}