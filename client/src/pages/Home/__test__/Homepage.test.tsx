import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import { render, screen, waitFor } from '../../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Homepage } from '../homepage'

vi.mock('../../../AudioSystem', () => ({
  audioSystem: {
    playAmbient: vi.fn(),
    stopAmbient: vi.fn(),
    fadeOut: vi.fn(),
  },
}));

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
global.fetch = vi.fn() as Mock<typeof fetch>

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
    ;(global.fetch as Mock).mockResolvedValue({
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
          health: 'Healthy',
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

  it('renders hello message with user display name', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      expect(screen.getByText(/Hello, Test User/i)).toBeInTheDocument()
    })
  })

  it('renders hello message with default "User" when no user info', () => {
    render(<Homepage />)
    
    // Before data loads
    expect(screen.getByText(/Hello, User/i)).toBeInTheDocument()
  })

  it('renders ResourceBoard with Growth Progress title', () => {
    render(<Homepage />)
    
    expect(screen.getByText(/Growth Progress/i)).toBeInTheDocument()
  })

  it('renders Tree component with correct alt text based on water level', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      // Water is 50, which is between 40-70, so it's Unhealthy
      const treeImg = screen.getByAltText(/Tree-Unhealthy/i)
      expect(treeImg).toBeInTheDocument()
    })
  })

  it('renders Earth component with correct alt text based on earth level', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      // Earth is 60, which is between 45-75, so it's Unhealthy
      const earthImg = screen.getByAltText(/Earth-Unhealthy/i)
      expect(earthImg).toBeInTheDocument()
    })
  })

  it('renders WateringCan component', () => {
    render(<Homepage />)
    
    expect(screen.getByAltText('Water Can')).toBeInTheDocument()
  })

  it('renders Logout button', () => {
    render(<Homepage />)
    
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument()
  })

  it('renders Settings button', () => {
    render(<Homepage />)
    
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('navigates to account settings when Settings is clicked', async () => {
    const user = userEvent.setup()
    render(<Homepage />)

    const settingsButton = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/account')
  })

    it('navigates to soil game when Earth is clicked', async () => {
        const user = userEvent.setup()
        render(<Homepage />)

        const earthImg = screen.getByAltText('Earth-Unhealthy') 

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
      const hasUserInfoCall = (global.fetch as Mock).mock.calls.some(
        (call: unknown[]) => call[0] === '/api/get-user-info'
      )
      expect(hasUserInfoCall).toBe(true)
    })
  })

  it('displays resource levels from API response', async () => {
    render(<Homepage />)
    
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument() // water
      expect(screen.getByText('60%')).toBeInTheDocument() // earth
    })
  })
})
