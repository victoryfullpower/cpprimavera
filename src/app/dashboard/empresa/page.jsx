'use client'
import { useEffect, useState, useMemo } from 'react'
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
    Switch,
    Divider,
    Chip,
    Textarea
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function EmpresaPage() {
    const session = useSession()

    // Estados
    const [empresas, setEmpresas] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentEmpresa, setCurrentEmpresa] = useState({
        nombre_empresa: '',
        ruc: '',
        nombre_comercial: '',
        direccion: '',
        telefono: '',
        celular: '',
        correo: '',
        estado: true
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const rowsPerPage = 10

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/empresa')
            
            if (!res.ok) throw new Error('Error cargando empresas')
            
            const data = await res.json()
            setEmpresas(data)
        } catch (error) {
            toast.error(error.message)
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Filtrar y paginar
    const filteredItems = useMemo(() => 
        empresas.filter(empresa =>
            empresa.nombre_empresa.toLowerCase().includes(filter.toLowerCase()) ||
            empresa.ruc.toLowerCase().includes(filter.toLowerCase()) ||
            (empresa.createdBy?.username.toLowerCase().includes(filter.toLowerCase()))
        ),
        [empresas, filter]
    )

    const paginatedItems = useMemo(() => 
        filteredItems.slice(
            (page - 1) * rowsPerPage,
            page * rowsPerPage
        ),
        [filteredItems, page]
    )

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta empresa?')) return

        try {
            setEmpresas(prev => prev.filter(e => e.idempresa !== id))

            const res = await fetch(`/api/empresa/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error(await res.text())

            toast.success('Empresa eliminada correctamente')
        } catch (error) {
            fetchData()
            toast.error('Error al eliminar empresa')
            console.error('Error:', error)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentEmpresa?.idempresa
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/empresa/${currentEmpresa.idempresa}`
                : '/api/empresa'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre_empresa: currentEmpresa.nombre_empresa,
                    ruc: currentEmpresa.ruc,
                    nombre_comercial: currentEmpresa.nombre_comercial,
                    direccion: currentEmpresa.direccion,
                    telefono: currentEmpresa.telefono,
                    celular: currentEmpresa.celular,
                    correo: currentEmpresa.correo,
                    estado: currentEmpresa.estado
                })
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setEmpresas(prev => {
                if (isEditing) {
                    return prev.map(e => e.idempresa === result.idempresa ? result : e)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Empresa actualizada correctamente'
                    : 'Empresa creada correctamente'
            )
            onOpenChange()
        } catch (error) {
            toast.error('Error al guardar los cambios')
            console.error('Error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <ToastContainer position="bottom-right" />

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-white">Gestión de Empresas</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por nombre, RUC o creador..."
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value)
                            setPage(1)
                        }}
                        className="w-64"
                        isClearable
                        onClear={() => setFilter('')}
                    />
                    <Button
                        color="primary"
                        onPress={() => {
                            setCurrentEmpresa({
                                nombre_empresa: '',
                                ruc: '',
                                nombre_comercial: '',
                                direccion: '',
                                telefono: '',
                                celular: '',
                                correo: '',
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nueva Empresa
                    </Button>
                </div>
            </div>

            {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
            <Table
                aria-label="Tabla de empresas"
                bottomContent={
                    <div className="flex w-full justify-center">
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={Math.ceil(filteredItems.length / rowsPerPage)}
                            onChange={setPage}
                        />
                    </div>
                }
                classNames={{
                    wrapper: "min-h-[400px]",
                }}
            >
                <TableHeader>
                    <TableColumn key="idempresa" width="80px">ID</TableColumn>
                    <TableColumn key="nombre_empresa">Nombre</TableColumn>
                    <TableColumn key="ruc">RUC</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="creadoPor">Creado por</TableColumn>
                    <TableColumn key="acciones" width="180px">Acciones</TableColumn>
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idempresa}>
                            <TableCell>{item.idempresa}</TableCell>
                            <TableCell>
                                <div className="font-medium">{item.nombre_empresa}</div>
                                {item.nombre_comercial && (
                                    <div className="text-sm text-gray-400">{item.nombre_comercial}</div>
                                )}
                            </TableCell>
                            <TableCell>{item.ruc}</TableCell>
                            <TableCell>
                                <Chip color={item.estado ? "success" : "danger"}>
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="primary"
                                            onPress={() => {
                                                setCurrentEmpresa({
                                                    idempresa: item.idempresa,
                                                    nombre_empresa: item.nombre_empresa,
                                                    ruc: item.ruc,
                                                    nombre_comercial: item.nombre_comercial,
                                                    direccion: item.direccion,
                                                    telefono: item.telefono,
                                                    celular: item.celular,
                                                    correo: item.correo,
                                                    estado: item.estado
                                                })
                                                onOpen()
                                            }}
                                        >
                                            Editar
                                        </Button>
                                    )}
                                    {session.user.role === 'SUPERADMIN' && (
                                        <Button
                                            size="sm"
                                            variant="flat"
                                            color="danger"
                                            onPress={() => handleDelete(item.idempresa)}
                                        >
                                            Eliminar
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            )}

            {(session.user.role === 'USER') && (
            <Table
                aria-label="Tabla de empresas"
                bottomContent={
                    <div className="flex w-full justify-center">
                        <Pagination
                            isCompact
                            showControls
                            showShadow
                            color="primary"
                            page={page}
                            total={Math.ceil(filteredItems.length / rowsPerPage)}
                            onChange={setPage}
                        />
                    </div>
                }
                classNames={{
                    wrapper: "min-h-[400px]",
                }}
            >
                <TableHeader>
                    <TableColumn key="idempresa" width="80px">ID</TableColumn>
                    <TableColumn key="nombre_empresa">Nombre</TableColumn>
                    <TableColumn key="ruc">RUC</TableColumn>
                    <TableColumn key="estado" width="120px">Estado</TableColumn>
                    <TableColumn key="creadoPor">Creado por</TableColumn>
                </TableHeader>
                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.idempresa}>
                            <TableCell>{item.idempresa}</TableCell>
                            <TableCell>
                                <div className="font-medium">{item.nombre_empresa}</div>
                                {item.nombre_comercial && (
                                    <div className="text-sm text-gray-400">{item.nombre_comercial}</div>
                                )}
                            </TableCell>
                            <TableCell>{item.ruc}</TableCell>
                            <TableCell>
                                <Chip color={item.estado ? "success" : "danger"}>
                                    {item.estado ? "Activo" : "Inactivo"}
                                </Chip>
                            </TableCell>
                            <TableCell>
                                {item.createdBy?.username || 'N/A'}
                                <p className="text-xs text-gray-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </p>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            )}

            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentEmpresa?.idempresa ? 'Editar Empresa' : 'Nueva Empresa'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="empresa-form" onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Campo Nombre Empresa */}
                                        <Input
                                            autoFocus
                                            label="Nombre Legal"
                                            placeholder="Nombre legal de la empresa"
                                            value={currentEmpresa.nombre_empresa}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                nombre_empresa: e.target.value
                                            })}
                                            isRequired
                                        />

                                        {/* Campo RUC */}
                                        <Input
                                            label="RUC"
                                            placeholder="Número de RUC"
                                            value={currentEmpresa.ruc}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                ruc: e.target.value
                                            })}
                                            isRequired
                                        />

                                        {/* Campo Nombre Comercial */}
                                        <Input
                                            label="Nombre Comercial"
                                            placeholder="Nombre comercial (opcional)"
                                            value={currentEmpresa.nombre_comercial}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                nombre_comercial: e.target.value
                                            })}
                                        />

                                        {/* Campo Teléfono */}
                                        <Input
                                            label="Teléfono"
                                            placeholder="Teléfono fijo"
                                            value={currentEmpresa.telefono}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                telefono: e.target.value
                                            })}
                                        />

                                        {/* Campo Celular */}
                                        <Input
                                            label="Celular"
                                            placeholder="Número de celular"
                                            value={currentEmpresa.celular}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                celular: e.target.value
                                            })}
                                        />

                                        {/* Campo Correo */}
                                        <Input
                                            label="Correo Electrónico"
                                            placeholder="correo@empresa.com"
                                            type="email"
                                            value={currentEmpresa.correo}
                                            onChange={(e) => setCurrentEmpresa({
                                                ...currentEmpresa,
                                                correo: e.target.value
                                            })}
                                        />
                                    </div>

                                    {/* Campo Dirección */}
                                    <Textarea
                                        label="Dirección"
                                        placeholder="Dirección completa"
                                        value={currentEmpresa.direccion}
                                        onChange={(e) => setCurrentEmpresa({
                                            ...currentEmpresa,
                                            direccion: e.target.value
                                        })}
                                    />

                                    {/* Switch de Estado */}
                                    <Switch
                                        isSelected={currentEmpresa.estado}
                                        onValueChange={(value) => {
                                            setCurrentEmpresa({
                                                ...currentEmpresa,
                                                estado: value
                                            })
                                        }}
                                    >
                                        Estado Activo
                                    </Switch>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (<Button
                                    color="primary"
                                    type="submit"
                                    form="empresa-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentEmpresa?.idempresa ? 'Guardar' : 'Crear'}
                                </Button>)}
                                {session.user.role === 'USER' && !currentEmpresa?.idempresa && (<Button
                                    color="primary"
                                    type="submit"
                                    form="empresa-form"
                                    isLoading={isSubmitting}
                                >
                                    {currentEmpresa?.idempresa ? 'Guardar' : 'Crear'}
                                </Button>)}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}