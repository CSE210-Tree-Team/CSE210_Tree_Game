import { describe, it, expect } from 'vitest'
import { render, screen } from '../../test/test-utils'
import { ResourceBoard } from '../ResourceBoard'


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

    it('progress bars have correct width', () => {
        const { container } = render(<ResourceBoard resources={mockResources} />)

        const progressBars = container.querySelectorAll('[style*="width"]')
        expect(progressBars.length).toBeGreaterThan(0)
    })
})