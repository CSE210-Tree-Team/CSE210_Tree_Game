import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Homepage } from './homepage'

// Mock Auth0
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { email: 'test@example.com' },
    isAuthenticated: true,
    logout: vi.fn(),
    getAccessTokenSilently: vi.fn().mockResolvedValue('mock-token'),
  }),
  Auth0Provider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock fetch
global.fetch = vi.fn()

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Homepage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          username: 'testuser',
          displayName: 'Test User',
          email: 'test@example.com',
          roles: [],
        },
        tree: {
          treeID: 'tree123',
          health: 'healthy',
          growthStage: 1,
          resourceLevels: {
            water: 50,
            earth: 60,
            sun: 70,
          },
        },
      }),
    })
  })

  it('renders hello message', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Hello/i)).toBeInTheDocument()
    })
  })

  it('renders ResourceBoard', () => {
    render(<Homepage />)
    
      expect(screen.getByText(/Growth Progress/i)).toBeInTheDocument()
  })

    it('renders Tree component', async () => {
        render(<Homepage />)
        await waitFor(() => {
            expect(screen.getByAltText('Tree')).toBeInTheDocument()
        })
    })

  it('renders Earth component', () => {
    render(<Homepage />)
    
    expect(screen.getByAltText('Earth')).toBeInTheDocument()
  })

  it('renders WateringCan component', () => {
    render(<Homepage />)
    
    expect(screen.getByAltText('Water Can')).toBeInTheDocument()
  })

  it('navigates to soil game when Earth is clicked', async () => {
    const user = userEvent.setup()
    render(<Homepage />)
    
    const earthImg = screen.getByAltText('Earth')
    await user.click(earthImg)
    
    expect(mockNavigate).toHaveBeenCalledWith('/soil')
  })

  it('navigates to water game when WateringCan is clicked', async () => {
    const user = userEvent.setup()
    render(<Homepage />)
    
    const waterCanImg = screen.getByAltText('Water Can')
    await user.click(waterCanImg)
    
    expect(mockNavigate).toHaveBeenCalledWith('/water')
  })

  it('fetches user info on mount', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/get-user-info')
    })
  })
})
