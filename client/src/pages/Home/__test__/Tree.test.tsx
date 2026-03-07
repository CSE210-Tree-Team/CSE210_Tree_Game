import { describe, it, expect } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import { Tree } from '../components/Tree/Tree'
import { TREE_HEALTH_THRESHOLD, TREE_UNHEALTHY_THRESHOLD, TREE_IMAGES } from '../constant'

describe('Tree Component', () => {
    it('renders healthy tree when water >= 70', () => {
        render(<Tree water={80} />)

        const img = screen.getByAltText('Tree-Healthy') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain('tree_healthy.svg')
    })

    it('renders unhealthy tree when water is between 40-69', () => {
        render(<Tree water={50} />)

        const img = screen.getByAltText('Tree-Unhealthy') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain('tree_unhealthy.svg')
    })

    it('renders withered tree when water < 40', () => {
        render(<Tree water={30} />)

        const img = screen.getByAltText('Tree-Withered') as HTMLImageElement
        expect(img).toBeInTheDocument()
        expect(img.src).toContain('tree_withered.svg')
    })

    it('uses correct threshold values from constants', () => {
        // Test boundary conditions
        render(<Tree water={TREE_HEALTH_THRESHOLD} />)
        let img = screen.getByAltText('Tree-Healthy') as HTMLImageElement
        expect(img.src).toContain(TREE_IMAGES.HEALTHY)

        render(<Tree water={TREE_UNHEALTHY_THRESHOLD} />)
        img = screen.getByAltText('Tree-Unhealthy') as HTMLImageElement
        expect(img.src).toContain(TREE_IMAGES.UNHEALTHY)

        render(<Tree water={TREE_UNHEALTHY_THRESHOLD - 1} />)
        img = screen.getByAltText('Tree-Withered') as HTMLImageElement
        expect(img.src).toContain(TREE_IMAGES.WITHERED)
    })

    it('applies correct CSS class and renders image', () => {
        const { container } = render(<Tree water={50} />)

        const treeContainer = container.querySelector('div[class*="treeContainer"]')
        expect(treeContainer).toBeInTheDocument()

        const img = container.querySelector('img[class*="treeImage"]')
        expect(img).toBeInTheDocument()
    })
})