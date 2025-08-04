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
    Select,
    SelectItem
} from '@nextui-org/react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useSession } from '@/context/SessionContext'

export default function UsersPage() {
    const session = useSession()
    
    // Estados
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(1)
    const { isOpen, onOpen, onOpenChange } = useDisclosure()
    const [currentUser, setCurrentUser] = useState({
        email: '',
        username: '',
        password: '',
        role: 'USER',
        estado: true
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)
    const rowsPerPage = 10

    // Roles disponibles
    const roles = [
        { value: 'SUPERADMIN', label: 'Super Administrador' },
        { value: 'ADMIN', label: 'Administrador' },
        { value: 'USER', label: 'Usuario' }
    ]

    // Cargar datos
    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/users')
            
            if (!res.ok) throw new Error('Error cargando usuarios')
            
            const data = await res.json()
            setUsers(data)
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
    const filteredItems = users.filter(user =>
        user.username.toLowerCase().includes(filter.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.toLowerCase()) ||
        user.role.toLowerCase().includes(filter.toLowerCase())
    )

    const paginatedItems = filteredItems.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    )

    // Operaciones CRUD
    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return

        try {
            console.log('Intentando eliminar usuario con ID:', id)
            
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            console.log('Respuesta del servidor:', res.status, res.statusText)
            
            if (!res.ok) {
                const errorText = await res.text()
                console.error('Error del servidor:', errorText)
                throw new Error(errorText)
            }

            // Solo actualizar el estado local si la eliminación fue exitosa
            setUsers(prev => prev.filter(u => u.id !== id))
            toast.success('Usuario eliminado correctamente')
        } catch (error) {
            console.error('Error completo:', error)
            toast.error('Error al eliminar usuario: ' + error.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const isEditing = !!currentUser?.id
            const method = isEditing ? 'PUT' : 'POST'
            const url = isEditing
                ? `/api/users/${currentUser.id}`
                : '/api/users'

            const userData = {
                email: currentUser.email,
                username: currentUser.username,
                role: currentUser.role,
                estado: currentUser.estado
            }

            // Solo incluir password si no estamos editando o si se está cambiando
            if (!isEditing || currentUser.password) {
                userData.password = currentUser.password
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            })

            if (!res.ok) throw new Error(await res.text())

            const result = await res.json()

            setUsers(prev => {
                if (isEditing) {
                    return prev.map(u => u.id === result.id ? result : u)
                } else {
                    return [...prev, result]
                }
            })

            toast.success(
                isEditing
                    ? 'Usuario actualizado correctamente'
                    : 'Usuario creado correctamente'
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
                <h1 className="text-2xl font-bold text-white">Gestión de Usuarios</h1>
                <div className="flex gap-3">
                    <Input
                        placeholder="Filtrar por email, usuario o rol..."
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
                            setCurrentUser({
                                email: '',
                                username: '',
                                password: '',
                                role: 'USER',
                                estado: true
                            })
                            onOpen()
                        }}
                    >
                        Nuevo Usuario
                    </Button>
                </div>
            </div>

            <Table
                aria-label="Tabla de usuarios"
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
    <TableColumn key="id" width="80px">ID</TableColumn>
    <TableColumn key="email">Email</TableColumn>
    <TableColumn key="username">Usuario</TableColumn>
    <TableColumn key="role" width="150px">Rol</TableColumn>
    <TableColumn key="estado" width="120px">Estado</TableColumn>
    <TableColumn key="creado">Creado</TableColumn>
    <TableColumn key="actualizado">Actualizado</TableColumn> {/* Nueva columna */}
    <TableColumn key="acciones" width="150px">Acciones</TableColumn>
</TableHeader>

                <TableBody
                    items={paginatedItems}
                    isLoading={loading}
                    loadingContent={<Spinner />}
                >
                    {(item) => (
                        <TableRow key={item.id}>
    <TableCell>{item.id}</TableCell>
    <TableCell>{item.email}</TableCell>
    <TableCell>{item.username}</TableCell>
    <TableCell>
        <Chip color={item.role === 'ADMIN' ? "primary" : "default"}>
            {item.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
        </Chip>
    </TableCell>
    <TableCell>
        <Chip color={item.estado ? "success" : "danger"}>
            {item.estado ? "Activo" : "Inactivo"}
        </Chip>
    </TableCell>
    <TableCell>
        <p className="text-xs text-gray-400">
            {new Date(item.createdAt).toLocaleDateString()}
        </p>
    </TableCell>
    <TableCell>
        <p className="text-xs text-gray-400">
            {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'N/A'}
        </p>
    </TableCell>
    <TableCell>
        <div className="flex gap-2">
            <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => {
                    setCurrentUser({
                        id: item.id,
                        email: item.email,
                        username: item.username,
                        password: '',
                        role: item.role,
                        estado: item.estado
                    })
                    onOpen()
                }}
            >
                Editar
            </Button>
            {session.user.role === 'SUPERADMIN' && (
                <Button
                    size="sm"
                    variant="flat"
                    color="danger"
                    onPress={() => handleDelete(item.id)}
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

            {/* Modal para crear/editar */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </ModalHeader>
                            <Divider />
                            <ModalBody className="py-6 gap-4">
                                <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                                    {/* Campo Email */}
                                    <Input
                                        autoFocus
                                        label="Email"
                                        placeholder="Ej: usuario@ejemplo.com"
                                        type="email"
                                        value={currentUser.email}
                                        onChange={(e) => setCurrentUser({
                                            ...currentUser,
                                            email: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Campo Username */}
                                    <Input
                                        label="Nombre de usuario"
                                        placeholder="Ej: juanperez"
                                        value={currentUser.username}
                                        onChange={(e) => setCurrentUser({
                                            ...currentUser,
                                            username: e.target.value
                                        })}
                                        isRequired
                                    />

                                    {/* Campo Password */}
                                    <Input
    label="Contraseña"
    placeholder={currentUser?.id ? "Dejar en blanco para no cambiar" : "Ingrese contraseña"}
    type={isPasswordVisible ? "text" : "password"}
    value={currentUser.password || ''}
    onChange={(e) => setCurrentUser({
        ...currentUser,
        password: e.target.value
    })}
    isRequired={!currentUser?.id}
    description={currentUser?.id ? "Complete solo si desea cambiar la contraseña" : ""}
    endContent={
        <button
            className="focus:outline-none"
            type="button"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
        >
            {isPasswordVisible ? (
                <EyeSlashIcon className="text-2xl text-default-400 pointer-events-none" />
            ) : (
                <EyeIcon className="text-2xl text-default-400 pointer-events-none" />
            )}
        </button>
    }
/>

                                    {/* Selector de Rol */}
                                    <Select
                                        label="Rol"
                                        selectedKeys={[currentUser.role]}
                                        onChange={(e) => setCurrentUser({
                                            ...currentUser,
                                            role: e.target.value
                                        })}
                                    >
                                        {roles.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.label}
                                            </SelectItem>
                                        ))}
                                    </Select>

                                    {/* Switch de Estado */}
                                    <Switch
                                        isSelected={currentUser.estado}
                                        onValueChange={(value) => {
                                            setCurrentUser({
                                                ...currentUser,
                                                estado: value
                                            })
                                        }}
                                    >
                                        Usuario Activo
                                    </Switch>
                                </form>
                            </ModalBody>
                            <Divider />
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancelar
                                </Button>
                                {(session.user.role === 'ADMIN' || session.user.role === 'SUPERADMIN') && (
                                    <Button
                                        color="primary"
                                        type="submit"
                                        form="user-form"
                                        isLoading={isSubmitting}
                                    >
                                        {currentUser?.id ? 'Guardar' : 'Crear'}
                                    </Button>
                                )}
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    )
}

// Iconos para mostrar/ocultar contraseña
const EyeIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 ${className}`}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
    </svg>
)

const EyeSlashIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className={`w-6 h-6 ${className}`}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
        />
    </svg>
)