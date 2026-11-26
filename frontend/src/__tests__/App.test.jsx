import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../App.jsx'
import { ApiError, crearPedido, getCervezas, getPedido, login } from '../api/client'

jest.mock('../api/client', () => {
  class MockApiError extends Error {
    constructor(message, status, response) {
      super(message)
      this.name = 'ApiError'
      this.status = status
      this.response = response
    }
  }

  return {
    ApiError: MockApiError,
    crearPedido: jest.fn(),
    getCervezas: jest.fn(),
    getPedido: jest.fn(),
    login: jest.fn(),
  }
})

const TEST_TOKEN = 'jwt-prueba-cafeflow'
const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function CurrentPath() {
  const location = useLocation()
  return <output data-testid="current-path">{location.pathname}</output>
}

function renderApp(initialPath = '/login') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
      <CurrentPath />
    </MemoryRouter>,
  )
}

async function signIn(user) {
  await user.type(
    screen.getByRole('textbox', { name: 'Correo electrónico' }),
    'cliente@example.test',
  )
  await user.type(screen.getByLabelText('Contraseña'), 'clave-de-prueba')
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

const beers = [
  {
    id: 'lager-001',
    nombre: 'Lager',
    descripcion: 'Suave y refrescante',
    precio: 8500,
    disponible: true,
  },
  {
    id: 'stout-002',
    nombre: 'Stout',
    descripcion: 'Tostada e intensa',
    precio: 10500,
    disponible: false,
  },
]

beforeEach(() => {
  jest.resetAllMocks()
  login.mockResolvedValue({
    access_token: TEST_TOKEN,
    user: { nombre: 'Ana' },
  })
  getCervezas.mockResolvedValue([])
  crearPedido.mockResolvedValue({ id: 'pedido-123' })
  getPedido.mockResolvedValue({
    id: 'pedido-123',
    items: [
      {
        cervezaId: 'lager-001',
        nombre: 'Lager',
        cantidad: 2,
        precioUnitario: 8500,
      },
    ],
    total: 17000,
    estado: 'pendiente',
  })
})

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

test('mantiene el formulario en /login y muestra el error ante HTTP 401', async () => {
  const user = userEvent.setup()
  login.mockRejectedValueOnce(new ApiError('Unauthorized', 401, { message: 'Unauthorized' }))
  renderApp()

  await signIn(user)

  expect(await screen.findByTestId('login-error')).toHaveTextContent(
    'Correo o contraseña incorrectos.',
  )
  expect(screen.getByTestId('current-path')).toHaveTextContent('/login')
  expect(login).toHaveBeenCalledWith('cliente@example.test', 'clave-de-prueba')
})

test('guarda la sesión real y navega a /catalogo después del login exitoso', async () => {
  const user = userEvent.setup()
  renderApp()

  await signIn(user)

  expect(await screen.findByTestId('catalogo')).toBeInTheDocument()
  expect(screen.getByText('Hola, Ana')).toBeInTheDocument()
  expect(screen.getByTestId('current-path')).toHaveTextContent('/catalogo')
  expect(login).toHaveBeenCalledWith('cliente@example.test', 'clave-de-prueba')
})

test('muestra el estado vacío cuando el catálogo no tiene cervezas', async () => {
  const user = userEvent.setup()
  getCervezas.mockResolvedValueOnce([])
  renderApp()

  await signIn(user)

  expect(
    await screen.findByText(/Todavía no hay cervezas en el catálogo/),
  ).toBeInTheDocument()
  expect(getCervezas).toHaveBeenCalledTimes(1)
})

test('muestra precios en COP y no permite seleccionar una cerveza agotada', async () => {
  const user = userEvent.setup()
  getCervezas.mockResolvedValueOnce(beers)
  renderApp()

  await signIn(user)

  const lagerHeading = await screen.findByRole('heading', { name: 'Lager' })
  const lagerCard = lagerHeading.closest('[data-testid="cerveza-card"]')
  expect(within(lagerCard).getByRole('heading', { name: 'Lager' })).toBeInTheDocument()
  expect(
    within(lagerCard).getByText(
      (_content, element) =>
        element.classList.contains('beer-price') &&
        element.textContent === copFormatter.format(8500),
    ),
  ).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Stout' })).toBeInTheDocument()
  expect(
    screen.getByText(
      (_content, element) =>
        element.classList.contains('beer-price') &&
        element.textContent === copFormatter.format(10500),
    ),
  ).toBeInTheDocument()

  const soldOutButton = screen.getByRole('button', { name: 'No disponible' })
  expect(soldOutButton).toBeDisabled()
  await user.click(soldOutButton)
  expect(screen.queryByRole('heading', { name: 'Pedir Stout' })).not.toBeInTheDocument()
  expect(crearPedido).not.toHaveBeenCalled()
})

test('crea el pedido con cerveza, cantidad y JWT y muestra su detalle confirmado', async () => {
  const user = userEvent.setup()
  getCervezas.mockResolvedValueOnce([beers[0]])
  crearPedido.mockResolvedValueOnce({ id: 'pedido-456' })
  getPedido.mockResolvedValueOnce({
    id: 'pedido-456',
    items: [
      {
        cervezaId: 'lager-001',
        nombre: 'Lager',
        cantidad: 2,
        precioUnitario: 8500,
      },
    ],
    total: 17000,
    estado: 'pendiente',
  })
  renderApp()

  await signIn(user)
  await user.click(await screen.findByRole('button', { name: 'Pedir esta cerveza' }))
  const quantity = screen.getByRole('spinbutton', { name: 'Cantidad' })
  await user.clear(quantity)
  await user.type(quantity, '2')
  await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }))

  expect((await screen.findByTestId('pedido-total')).textContent).toBe(
    `Total: ${copFormatter.format(17000)}`,
  )
  expect(screen.getByTestId('pedido-estado')).toHaveTextContent('pendiente')
  expect(screen.getByTestId('current-path')).toHaveTextContent('/pedidos/pedido-456')
  expect(crearPedido).toHaveBeenCalledWith('lager-001', 2, TEST_TOKEN)
  expect(getPedido).toHaveBeenCalledWith('pedido-456', TEST_TOKEN)
})

test('rechaza la cantidad cero y no solicita crear un pedido', async () => {
  const user = userEvent.setup()
  getCervezas.mockResolvedValueOnce([beers[0]])
  renderApp()

  await signIn(user)
  await user.click(await screen.findByRole('button', { name: 'Pedir esta cerveza' }))
  const quantity = screen.getByRole('spinbutton', { name: 'Cantidad' })
  await user.clear(quantity)
  await user.type(quantity, '0')

  expect(quantity).toHaveValue(0)
  expect(quantity.validity.rangeUnderflow).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Confirmar pedido' }))
  expect(crearPedido).not.toHaveBeenCalled()
  expect(screen.getByTestId('current-path')).toHaveTextContent('/catalogo')
})
