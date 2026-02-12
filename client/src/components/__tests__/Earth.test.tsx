import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Earth } from '../Earth'

describe('Earth Component', () => {
  it('renders with correct image based on earth level - healthy', () => {
    const mockOnClick = vi.fn()
    render(<Earth earth={80} onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Earth') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('soil_health.png')
  })

  it('renders with typical soil image', () => {
    const mockOnClick = vi.fn()
    render(<Earth earth={50} onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Earth') as HTMLImageElement
    expect(img.src).toContain('soil_typical.png')
  })

  it('renders with dry soil image', () => {
    const mockOnClick = vi.fn()
    render(<Earth earth={30} onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Earth') as HTMLImageElement
    expect(img.src).toContain('soil_dry.png')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()
    render(<Earth earth={50} onClick={mockOnClick} />)
    
    const img = screen.getByAltText('Earth')
    await user.click(img)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})
