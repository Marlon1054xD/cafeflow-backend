import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCervezas } from '../api/client'
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

function BeerCard({ beer }) {
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
              <BeerCard key={beer.id ?? beer._id} beer={beer} />
            ))}
          </div>
        )}
      </section>
      <footer className="catalog-footer">CaféFlow · Buenos momentos, buena cerveza.</footer>
    </main>
  )
}
