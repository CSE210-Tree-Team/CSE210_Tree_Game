import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Earth } from '../components/Earth'
import { EARTH_HEALTH_THRESHOLD, EARTH_UNHEALTHY_THRESHOLD, EARTH_IMAGES } from '../constant'

describe('Earth Component', () => {
    it('renders with correct image based on earth level - healthy', () => {
        const mockOnClick = vi.fn()
        render(<Earth earth={80} onClick={mockOnClick} />)

        const img = screen.getByAltText('Earth-Healthy') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain(EARTH_IMAGES.HEALTHY)
    })

    it('renders with typical/unhealthy soil image', () => {
        const mockOnClick = vi.fn()
        render(<Earth earth={50} onClick={mockOnClick} />)

        const img = screen.getByAltText('Earth-Unhealthy') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain(EARTH_IMAGES.UNHEALTHY)
    })

    it('renders with withered/dry soil image', () => {
        const mockOnClick = vi.fn()
        render(<Earth earth={30} onClick={mockOnClick} />)

        const img = screen.getByAltText('Earth-Withered') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain(EARTH_IMAGES.WITHERED)
    })

    it('uses correct threshold values from constants', () => {
        const mockOnClick = vi.fn()

        // Test at threshold
        render(<Earth earth={EARTH_HEALTH_THRESHOLD} onClick={mockOnClick} />)
        let img = screen.getByAltText('Earth-Healthy') as HTMLImageElement
        expect(img.src).toContain(EARTH_IMAGES.HEALTHY)

        // Test typical threshold
        render(<Earth earth={EARTH_UNHEALTHY_THRESHOLD} onClick={mockOnClick} />)
        img = screen.getByAltText('Earth-Unhealthy') as HTMLImageElement
        expect(img.src).toContain(EARTH_IMAGES.UNHEALTHY)

        // Test below typical threshold
        render(<Earth earth={EARTH_UNHEALTHY_THRESHOLD - 1} onClick={mockOnClick} />)
        img = screen.getByAltText('Earth-Withered') as HTMLImageElement
        expect(img.src).toContain(EARTH_IMAGES.WITHERED)
    })

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup()
        const mockOnClick = vi.fn()
        render(<Earth earth={50} onClick={mockOnClick} />)

        const img = screen.getByAltText('Earth-Unhealthy')
        await user.click(img)

        expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('applies correct CSS class', () => {
        const mockOnClick = vi.fn()
        const { container } = render(<Earth earth={50} onClick={mockOnClick} />)
        const earthContainer = container.querySelector('div[class*="earthContainer"]')
        expect(earthContainer).toBeInTheDocument()

        const img = screen.getByAltText('Earth-Unhealthy')
        expect(img).toBeInTheDocument()
    })
})