import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { WateringCan } from '../WateringCan'

describe('WateringCan Component', () => {
  it('renders watering can image', () => {
    const mockOnClick = vi.fn()
    render(<WateringCan onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Water Can')
    expect(img).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()
    render(<WateringCan onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Water Can')
    await user.click(img)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
