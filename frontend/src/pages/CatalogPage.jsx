import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, crearPedido, getCervezas } from '../api/client'
import { useSession } from '../auth/useSession'

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function getCatalogError(error) {
  if (error instanceof TypeError) {
    return 'No pudimos conectar con la API. Revisa la conexión e inténtalo otra vez.'
  }
  return error.message || 'No se pudo cargar el catálogo. Inténtalo otra vez.'
}

function getOrderError(error) {
  if (error instanceof TypeError) {
    return 'No pudimos conectar con la API. Revisa la conexión e inténtalo otra vez.'
  }
  if (error instanceof ApiError && error.status === 404) {
    return 'Esta cerveza ya no está disponible en el catálogo. Actualiza la página e inténtalo con otra.'
  }
  if (error instanceof ApiError && error.status === 409) {
    return error.message || 'Esta cerveza dejó de estar disponible. Elige otra del catálogo.'
  }
  return error.message || 'No se pudo crear el pedido. Inténtalo otra vez.'
}

function BeerCard({ beer, onSelect }) {
  const id = beer.id ?? beer._id

  return (
    <article
      className="beer-card"
      data-cerveza-id={id}
      data-testid="cerveza-card"
    >
      <div className="beer-card-top">
        <span className="beer-symbol" aria-hidden="true">C</span>
        <span className={`availability ${beer.disponible ? 'is-available' : 'is-unavailable'}`}>
          <span className="availability-dot" aria-hidden="true" />
          {beer.disponible ? 'Disponible' : 'Agotada'}
        </span>
      </div>
      <div className="beer-info">
        <h2>{beer.nombre}</h2>
        <p>{beer.descripcion}</p>
      </div>
      <div className="beer-card-bottom">
        <span className="beer-price">{copFormatter.format(beer.precio)}</span>
        <span className="beer-id">ID: {id}</span>
      </div>
      <button
        className="button button-secondary beer-order-button"
        data-testid="pedir-cerveza"
        disabled={!beer.disponible}
        onClick={() => onSelect(beer)}
        type="button"
      >
        {beer.disponible ? 'Pedir esta cerveza' : 'No disponible'}
      </button>
    </article>
  )
}

export default function CatalogPage() {
  const { logout, session } = useSession()
  const navigate = useNavigate()
  const [cervezas, setCervezas] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [attempt, setAttempt] = useState(0)
  const [selectedBeer, setSelectedBeer] = useState(null)
  const [cantidad, setCantidad] = useState('1')
  const [orderError, setOrderError] = useState('')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  useEffect(() => {
    let isCurrent = true

    async function loadCatalog() {
      setIsLoading(true)
      setError('')
      try {
        const results = await getCervezas()
        if (isCurrent) setCervezas(results)
      } catch (loadError) {
        if (isCurrent) setError(getCatalogError(loadError))
      } finally {
        if (isCurrent) setIsLoading(false)
      }
    }

    loadCatalog()
    return () => {
      isCurrent = false
    }
  }, [attempt])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleSelectBeer(beer) {
    setSelectedBeer(beer)
    setCantidad('1')
    setOrderError('')
  }

  async function handleCreateOrder(event) {
    event.preventDefault()
    setOrderError('')

    const quantity = Number(cantidad)
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setOrderError('La cantidad debe ser un entero positivo.')
      return
    }

    setIsSubmittingOrder(true)
    try {
      const pedido = await crearPedido(
        selectedBeer.id ?? selectedBeer._id,
        quantity,
        session.token,
      )
      navigate(`/pedidos/${encodeURIComponent(pedido.id)}`)
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        logout()
        navigate('/login', {
          replace: true,
          state: { message: 'Tu sesión venció. Inicia sesión para continuar.' },
        })
        return
      }
      setOrderError(getOrderError(requestError))
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  return (
    <main className="catalog-page" data-testid="catalogo">
      <header className="catalog-header">
        <Link className="brand" to="/catalogo" aria-label="CaféFlow, catálogo">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CaféFlow</span>
        </Link>
        <div className="header-account">
          <span className="user-greeting">
            Hola{session.user?.nombre ? `, ${session.user.nombre}` : ''}
          </span>
          <button className="button button-quiet" onClick={handleLogout} type="button">
            Cerrar sesión
          </button>
        </div>
      </header>

      <section className="catalog-content" aria-labelledby="catalog-title">
        <p className="eyebrow">Hechas para disfrutar</p>
        <h1 id="catalog-title">Nuestro catálogo</h1>
        <p className="catalog-intro">
          Una selección para encontrar tu próximo gran sabor.
        </p>

        {isLoading ? (
          <p aria-live="polite" className="catalog-status" role="status">
            Cargando cervezas…
          </p>
        ) : error ? (
          <div className="catalog-message" role="alert">
            <p>{error}</p>
            <button
              className="button button-secondary"
              onClick={() => setAttempt((current) => current + 1)}
              type="button"
            >
              Reintentar
            </button>
          </div>
        ) : cervezas.length === 0 ? (
          <p className="catalog-message" role="status">
            Todavía no hay cervezas en el catálogo. Vuelve pronto para descubrir
            nuevas opciones.
          </p>
        ) : (
          <div className="beer-grid">
            {cervezas.map((beer) => (
              <BeerCard
                key={beer.id ?? beer._id}
                beer={beer}
                onSelect={handleSelectBeer}
              />
            ))}
          </div>
        )}

        {selectedBeer && (
          <section className="order-panel" aria-labelledby="order-title">
            <h2 id="order-title">Pedir {selectedBeer.nombre}</h2>
            <p>
              Precio unitario: {copFormatter.format(selectedBeer.precio)}
            </p>
            <form
              aria-busy={isSubmittingOrder}
              className="order-form"
              onSubmit={handleCreateOrder}
            >
              <div className="form-field">
                <label htmlFor="pedido-cantidad">Cantidad</label>
                <input
                  id="pedido-cantidad"
                  name="cantidad"
                  min="1"
                  onChange={(event) => setCantidad(event.target.value)}
                  required
                  step="1"
                  type="number"
                  value={cantidad}
                />
              </div>
              {orderError && (
                <p className="form-error" data-testid="pedido-error" role="alert">
                  {orderError}
                </p>
              )}
              <button
                className="button button-primary"
                disabled={isSubmittingOrder}
                id="pedido-confirmar"
                type="submit"
              >
                {isSubmittingOrder ? 'Enviando pedido…' : 'Confirmar pedido'}
              </button>
            </form>
          </section>
        )}
      </section>
      <footer className="catalog-footer">CaféFlow · Buenos momentos, buena cerveza.</footer>
    </main>
  )
}
