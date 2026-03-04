import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { WateringCan } from '../components/WateringCan'
import { WATER_CAN_IMAGE } from '../constant'

describe('WateringCan Component', () => {
    it('renders watering can image', () => {
        const mockOnClick = vi.fn()
        render(<WateringCan onClick={mockOnClick} />)

        const img = screen.getByAltText('Water Can')
        expect(img).toBeInTheDocument()
    })

    it('uses correct image path from constants', () => {
        const mockOnClick = vi.fn()
        render(<WateringCan onClick={mockOnClick} />)

        const img = screen.getByAltText('Water Can') as HTMLImageElement
        expect(img.src).toContain(WATER_CAN_IMAGE)
    })

    it('calls onClick when clicked', async () => {
        const user = userEvent.setup()
        const mockOnClick = vi.fn()
        render(<WateringCan onClick={mockOnClick} />)

        const img = screen.getByAltText('Water Can')
        await user.click(img)

        expect(mockOnClick).toHaveBeenCalledTimes(1)
    })

    it('applies correct CSS class', () => {
        const mockOnClick = vi.fn()
        const { container } = render(<WateringCan onClick={mockOnClick} />)
        const wateringCanContainer = container.querySelector('div[class*="wateringCanContainer"]')
        expect(wateringCanContainer).toBeInTheDocument()

        const img = screen.getByAltText('Water Can')
        expect(img).toBeInTheDocument()
    })
})