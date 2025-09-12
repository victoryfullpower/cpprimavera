"use client";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import {useRouter} from 'next/navigation'
import {useState} from 'react'

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const router = useRouter()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  
  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log("login",res)
      if (res.error) {
        // Translate error messages to Spanish
        let errorMessage = res.error
        if (res.error === 'No user found') {
          errorMessage = 'Usuario no encontrado'
        } else if (res.error === 'Wrong password') {
          errorMessage = 'Contraseña incorrecta'
        } else if (res.error === 'CredentialsSignin') {
          errorMessage = 'Credenciales inválidas'
        }
        setError(errorMessage)
      } else {
        // El login fue exitoso, obtener el rol del usuario y redirigir
        try {
          // Esperar un momento para que la sesión se actualice
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Obtener información del usuario
          const userResponse = await fetch('/api/users/me')
          if (userResponse.ok) {
            const userData = await userResponse.json()
            // Redirigir según el rol del usuario
            if (userData.role === 'USER') {
              router.push('/dashboard/stand')
            } else {
              router.push('/dashboard')
            }
          } else {
            // Si no se puede obtener el rol, redirigir al dashboard por defecto
            router.push('/dashboard')
          }
        } catch (error) {
          console.error('Error obteniendo información del usuario:', error)
          router.push('/dashboard')
        }
        router.refresh()
      }
    } catch (error) {
      setError('Error de conexión. Intente nuevamente.')
    } finally {
      setIsLoading(false)
    }
  });

  return (
    <div className="h-[100vh] flex justify-center items-center bg-gray-900">
      <form onSubmit={onSubmit} className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6 text-center">
            <p className="font-medium">{error}</p>
          </div>
        )}

        <h1 className="text-slate-200 font-bold text-3xl mb-6 text-center">Iniciar Sesión</h1>

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="text-slate-300 mb-2 block text-sm font-medium">
              Email:
            </label>
            <input
              type="email"
              {...register("email", {
                required: {
                  value: true,
                  message: "El email es requerido",
                },
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido",
                },
              })}
              className="p-3 rounded-lg block w-full bg-gray-700 text-slate-200 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="usuario@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <span className="text-red-400 text-xs mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label htmlFor="password" className="text-slate-300 mb-2 block text-sm font-medium">
              Contraseña:
            </label>
            <input
              type="password"
              {...register("password", {
                required: {
                  value: true,
                  message: "La contraseña es requerida",
                },
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres",
                },
              })}
              className="p-3 rounded-lg block w-full bg-gray-700 text-slate-200 border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder="******"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="text-red-400 text-xs mt-1 block">
                {errors.password.message}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            ¿No tienes cuenta?{' '}
            <a href="/auth/register" className="text-blue-400 hover:text-blue-300 underline">
              Regístrate aquí
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}
export default LoginPage;
