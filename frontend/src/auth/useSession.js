import { useContext } from 'react'
import { SessionContext } from './session-context.js'

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useSession debe utilizarse dentro de SessionProvider.')
  }
  return session
}
