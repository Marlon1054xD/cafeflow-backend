import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, getPedido } from '../api/client'
import { useSession } from '../auth/useSession'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function getPedidoError(error) {
  if (error instanceof TypeError) {
    return 'No pudimos conectar con la API. Revisa la conexión e inténtalo otra vez.'
  }
  if (error instanceof ApiError && [400, 404].includes(error.status)) {
    return 'No encontramos este pedido o no tienes permiso para consultarlo.'
  }
  return error.message || 'No se pudo cargar el detalle del pedido.'
}

export default function PedidoDetailPage() {
  const { id } = useParams()
  const { logout, session } = useSession()
  const navigate = useNavigate()
  const [pedido, setPedido] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isCurrent = true

    async function loadPedido() {
      setIsLoading(true)
      setError('')
      setPedido(null)
      try {
        const result = await getPedido(id, session.token)
        if (isCurrent) setPedido(result)
      } catch (requestError) {
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout()
          navigate('/login', {
            replace: true,
            state: { message: 'Tu sesión venció. Inicia sesión para continuar.' },
          })
          return
        }
        if (isCurrent) setError(getPedidoError(requestError))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadPedido()
    return () => {
      isCurrent = false
    }
  }, [id, logout, navigate, session.token])

  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <Link className="brand" to="/catalogo" aria-label="CaféFlow, catálogo">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CaféFlow</span>
        </Link>
      </header>
      <section
        className="catalog-content order-detail"
        data-testid="pedido-detalle"
        aria-labelledby="pedido-title"
      >
        <p className="eyebrow">Tu compra</p>
        <h1 id="pedido-title">Detalle del pedido</h1>
        {isLoading ? (
          <p className="catalog-status" role="status">Cargando pedido…</p>
        ) : error ? (
          <div className="catalog-message" data-testid="pedido-error" role="alert">
            <p>{error}</p>
            <Link className="button button-secondary" to="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        ) : pedido ? (
          <div className="order-summary">
            <div className="order-items">
              {pedido.items.map((item, index) => (
                <article className="order-item" key={`${item.cervezaId}-${index}`}>
                  <h2>{item.nombre}</h2>
                  <p>Cantidad: {item.cantidad}</p>
                  <p>Precio unitario: {copFormatter.format(item.precioUnitario)}</p>
                </article>
              ))}
            </div>
            <p className="order-total" data-testid="pedido-total">
              Total: {copFormatter.format(pedido.total)}
            </p>
            <p className="order-status" data-testid="pedido-estado">
              Estado: {pedido.estado}
            </p>
            <Link className="button button-secondary" to="/catalogo">
              Volver al catálogo
            </Link>
          </div>
        ) : null}
      </section>
      <footer className="catalog-footer">CaféFlow · Buenos momentos, buena cerveza.</footer>
    </main>
  )
}
