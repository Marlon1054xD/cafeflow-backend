import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useSession } from '../auth/useSession'

function getLoginError(error) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Correo o contraseña incorrectos. Revísalos e inténtalo de nuevo.'
  }
  if (error instanceof TypeError) {
    return 'No pudimos conectar con la API. Comprueba que esté activa y que CORS_ORIGINS incluya http://localhost:5173.'
  }
  return error.message || 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

export default function LoginPage() {
  const { login } = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      const returnPath = location.state?.from?.pathname
      navigate(returnPath?.startsWith('/') ? returnPath : '/catalogo', {
        replace: true,
      })
    } catch (loginError) {
      setError(getLoginError(loginError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-layout">
      <section className="login-panel" aria-labelledby="login-title">
        <Link className="brand" to="/login" aria-label="CaféFlow, inicio">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CaféFlow</span>
        </Link>
        <p className="eyebrow">Una buena cerveza, buenos momentos</p>
        <h1 id="login-title">Qué gusto verte.</h1>
        <p className="intro">
          Inicia sesión para descubrir nuestra selección de cervezas.
        </p>

        <form
          aria-busy={isSubmitting}
          className="login-form"
          onSubmit={handleSubmit}
        >
          <div className="form-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              autoComplete="email"
              id="login-email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
              required
              type="email"
              value={email}
            />
          </div>
          <div className="form-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              autoComplete="current-password"
              id="login-password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              type="password"
              value={password}
            />
          </div>

          {error && (
            <p className="form-error" data-testid="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button-primary login-submit"
            data-testid="login-submit"
            disabled={isSubmitting}
            id="login-submit"
            type="submit"
          >
            {isSubmitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-note">Tu próxima favorita está más cerca.</p>
      </section>
      <aside className="login-aside" aria-label="Nuestra selección">
        <div className="aside-glow" aria-hidden="true" />
        <span className="aside-label">Selección artesanal</span>
        <p className="aside-quote">
          Descubre sabores
          <br />
          que se quedan
          <br />
          contigo.
        </p>
        <span className="aside-caption">CaféFlow · Colombia</span>
      </aside>
    </main>
  )
}
