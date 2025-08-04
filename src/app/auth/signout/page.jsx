"use client";
import { signOut } from "next-auth/react"

export default function CustomSignOut() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">Cerrar sesión</h1>
        <p className="mb-6">¿Estás seguro de que quieres salir de tu cuenta?</p>
        <button
          onClick={() => signOut()}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
        >
          Confirmar cierre de sesión
        </button>
      </div>
    </div>
  )
}