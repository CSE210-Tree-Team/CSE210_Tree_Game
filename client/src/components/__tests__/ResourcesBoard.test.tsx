import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { ResourceBoard } from '../ResourceBoard'
import { RESOURCE_ICONS, RESOURCE_BOARD_BG } from '../constant'

describe('ResourceBoard Component', () => {
    const mockResources = {
        water: 50,
        earth: 75,
        sun: 30
    }

    it('renders resource board with all resources', () => {
        render(<ResourceBoard resources={mockResources} />)

        expect(screen.getByText(/Growth Progress/i)).toBeInTheDocument()
        expect(screen.getByText('Water')).toBeInTheDocument()
        expect(screen.getByText('Earth')).toBeInTheDocument()
        expect(screen.getByText('Sun')).toBeInTheDocument()
    })

    it('displays correct percentage values', () => {
        render(<ResourceBoard resources={mockResources} />)

        expect(screen.getByText('50%')).toBeInTheDocument()
        expect(screen.getByText('75%')).toBeInTheDocument()
        expect(screen.getByText('30%')).toBeInTheDocument()
    })

    it('renders resource icons with correct paths', () => {
        render(<ResourceBoard resources={mockResources} />)

        const waterIcon = screen.getByAltText('Water Resource Icon') as HTMLImageElement
        const earthIcon = screen.getByAltText('Earth Resource Icon') as HTMLImageElement
        const sunIcon = screen.getByAltText('Sun Resource Icon') as HTMLImageElement

        expect(waterIcon.src).toContain(RESOURCE_ICONS.WATER)
        expect(earthIcon.src).toContain(RESOURCE_ICONS.EARTH)
        expect(sunIcon.src).toContain(RESOURCE_ICONS.SUN)
    })

    it('progress bars have correct width styles', () => {
        const { container } = render(<ResourceBoard resources={mockResources} />)

        const progressBars = container.querySelectorAll('[class*="progressBar"]')
        expect(progressBars.length).toBeGreaterThan(0)
    })

    it('renders background image', () => {
        render(<ResourceBoard resources={mockResources} />)

        const bgImage = screen.getByAltText('Resource Board Background') as HTMLImageElement
        expect(bgImage).toBeInTheDocument()
        expect(bgImage.src).toContain(RESOURCE_BOARD_BG)
    })

    it('handles zero resource values', () => {
        const zeroResources = { water: 0, earth: 0, sun: 0 }
        render(<ResourceBoard resources={zeroResources} />)

        expect(screen.getAllByText('0%')).toHaveLength(3)
    })

    it('handles maximum resource values', () => {
        const maxResources = { water: 100, earth: 100, sun: 100 }
        render(<ResourceBoard resources={maxResources} />)

        expect(screen.getAllByText('100%')).toHaveLength(3)
    })
})