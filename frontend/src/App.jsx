import { Navigate, Route, Routes } from 'react-router-dom'
import { SessionProvider } from './auth/SessionContext.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import CatalogPage from './pages/CatalogPage'
import LoginPage from './pages/LoginPage'
import PedidoDetailPage from './pages/PedidoDetailPage'
import { useSession } from './auth/useSession'

function AppRoutes() {
  const { session } = useSession()

  return (
    <Routes>
      <Route
        path="/login"
        element={session ? <Navigate to="/catalogo" replace /> : <LoginPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/catalogo" element={<CatalogPage />} />
        <Route path="/pedidos/:id" element={<PedidoDetailPage />} />
      </Route>
      <Route
        path="*"
        element={<Navigate to={session ? '/catalogo' : '/login'} replace />}
      />
    </Routes>
  )
}

export default function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  )
}
