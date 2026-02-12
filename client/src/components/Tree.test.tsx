import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { Tree } from './Tree'

describe('Tree Component', () => {
  it('renders healthy tree when water >= 70', () => {
    render(<Tree water={80} />)
    
    const img = screen.getByAltText('Tree') as HTMLImageElement
    expect(img).toBeInTheDocument()
    expect(img.src).toContain('tree_health.png')
  })

  it('renders typical tree when water is between 40-69', () => {
    render(<Tree water={50} />)
    
    const img = screen.getByAltText('Tree') as HTMLImageElement
    expect(img.src).toContain('tree_typical.png')
  })

  it('renders dry tree when water < 40', () => {
    render(<Tree water={30} />)
    
    const img = screen.getByAltText('Tree') as HTMLImageElement
    expect(img.src).toContain('tree_dry.png')
  })
})
