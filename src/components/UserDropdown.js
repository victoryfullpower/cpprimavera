// components/UserDropdown.js
'use client'
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar, User } from "@nextui-org/react"
import { signOut } from "next-auth/react"
import { FiUser, FiLogOut, FiSettings } from "react-icons/fi"

export default function UserDropdown({ user }) {
  if (!user) return null

  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar
            isBordered
            as="button"
            className="transition-transform"
            color="primary"
            name={user.name || user.email}
            size="sm"
            src={user.image}
          />
          <span className="hidden md:inline font-medium">{user.name || user.email}</span>
        </div>
      </DropdownTrigger>
      <DropdownMenu aria-label="User Actions" variant="flat">
        <DropdownItem key="profile" className="h-14 gap-2">
          <div className="flex flex-col">
            <p className="font-semibold">Sesión iniciada como</p>
            <p className="font-medium text-primary">{user.email}</p>
          </div>
        </DropdownItem>
        <DropdownItem key="settings" startContent={<FiSettings className="text-lg" />}>
          Configuración
        </DropdownItem>
        <DropdownItem 
          key="logout" 
          color="danger"
          startContent={<FiLogOut className="text-lg" />}
          onClick={() => signOut()}
        >
          Cerrar sesión
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  )
}