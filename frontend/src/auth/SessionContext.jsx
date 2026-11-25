import { useCallback, useMemo, useState } from 'react'
import { login as loginRequest } from '../api/client'
import { SessionContext } from './session-context.js'

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null)

  const login = useCallback(async (email, password) => {
    const result = await loginRequest(email, password)
    if (typeof result?.access_token !== 'string' || !result.access_token) {
      throw new Error('La API no devolvió un token de acceso válido.')
    }
    setSession({ token: result.access_token, user: result.user ?? null })
  }, [])

  const logout = useCallback(() => {
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({ session, login, logout }),
    [session, login, logout],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
