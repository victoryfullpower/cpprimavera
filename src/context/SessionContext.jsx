// context/SessionContext.jsx
'use client'

import { createContext, useContext } from 'react'

export const SessionContext = createContext(null)

export function useSession() {
  return useContext(SessionContext)
}

export function SessionProvider({ children, session }) {
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  )
}