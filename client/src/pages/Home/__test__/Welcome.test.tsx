/*
Unit tests for the welcome page

It checks if the welcome page renders the correct title, introduction text, and buttons for signing up and logging in
It also tests the navigation functionality of the buttons to ensure they redirect to the correct pages when clicked
*/

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../../../test/test-utils'
import userEvent from '@testing-library/user-event'
import { Welcome } from '../Welcome'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Welcome Page', () => {
  it('renders welcome title', () => {
    render(<Welcome />)
    
      expect(screen.getByText(/Welcome to Bristlecone/i)).toBeInTheDocument()
  })

  it('renders introduction text', () => {
    render(<Welcome />)
    
    expect(screen.getByText(/nature needs your help/i)).toBeInTheDocument()
  })

  it('renders Sign Up button', () => {
    render(<Welcome />)
    
    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    expect(signUpButton).toBeInTheDocument()
  })

    it('renders Log In button', () => {
        render(<Welcome />)

        const loginButton = screen.getByRole('button', { name: /log in/i })
        expect(loginButton).toBeInTheDocument()
    })


  it('navigates to signup page when Sign Up is clicked', async () => {
    const user = userEvent.setup()
    render(<Welcome />)
    
    const signUpButton = screen.getByRole('button', { name: /sign up/i })
    await user.click(signUpButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/signup')
  })

  it('navigates to login page when Log In is clicked', async () => {
    const user = userEvent.setup()
    render(<Welcome />)
    
    const loginButton = screen.getByRole('button', { name: /log in/i })
    await user.click(loginButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
