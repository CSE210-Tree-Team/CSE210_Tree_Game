import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// clean after tests
afterEach(() => {
    cleanup()
})