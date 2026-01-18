import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'

// Automatically cleanup after each test
afterEach(() => {
  cleanup()
})
