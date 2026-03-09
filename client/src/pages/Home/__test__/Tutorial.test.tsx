/*
Unit tests for the tutorial component

It checks if the Tutorial component renders the correct content for both pages, including text and buttons
It tests navigation between the first and second pages using the next and back buttons, ensuring the correct content is displayed
It verifies that the onClose callback is called when the "I'm Ready" button is clicked on the second page
It also checks for the presence of the grass variant styling and background overlay on both pages to ensure consistent visual design
*/
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../../../test/test-utils';
import userEvent from '@testing-library/user-event';
import Tutorial from '../components/Tutorial/Tutorial';

describe('Tutorial Component', () => {
    it('renders first page initially', () => {
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        expect(screen.getByText('Welcome to Bristlecone')).toBeInTheDocument();
        expect(screen.getByText(/Care for your own virtual tree/i)).toBeInTheDocument();
        expect(screen.getByText(/Your tree experiences time/i)).toBeInTheDocument();
        expect(screen.getByText(/Goal: Maintain 2 vital resources/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    it('navigates to second page when Next button is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('How To Play:')).toBeInTheDocument();
        });
    });

    it('displays second page content after clicking Next', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText(/Click the watering can/i)).toBeInTheDocument();
            expect(screen.getByText(/Click the soil underneath/i)).toBeInTheDocument();
            expect(screen.getByText(/Keep a close eye on your resource bar/i)).toBeInTheDocument();
        });
    });

    it('displays Back button on second page', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByAltText('Back')).toBeInTheDocument();
        });
    });

    it('navigates back to first page when Back button is clicked', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        // Navigate to second page
        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('How To Play:')).toBeInTheDocument();
        });

        const backArrow = screen.getByAltText('Back');
        await user.click(backArrow);

        await waitFor(() => {
            expect(screen.getByText('Welcome to Bristlecone')).toBeInTheDocument();
        });
    });

    it('calls onClose when Ready button is clicked on second page', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        render(<Tutorial onClose={mockOnClose} />);

        // Navigate to second page
        const nextButton = screen.getByRole('button', { name: /next/i });
        await user.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('How To Play:')).toBeInTheDocument();
        });

        // Click I'm Ready button
        const readyButton = screen.getByRole('button', { name: /i'm ready/i });
        await user.click(readyButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });


    it('renders with grass variant styling', () => {
        const mockOnClose = vi.fn();
        const { container } = render(<Tutorial onClose={mockOnClose} />);

        const popup = container.querySelector('[class*="grass"]');
        expect(popup).toBeInTheDocument();
    });


    it('has background on both pages', async () => {
        const user = userEvent.setup();
        const mockOnClose = vi.fn();
        const { container } = render(<Tutorial onClose={mockOnClose} />);

        let overlay = container.querySelector('[class*="overlay"]');
        expect(overlay).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /next/i }));

        await waitFor(() => {
            overlay = container.querySelector('[class*="overlay"]');
            expect(overlay).toBeInTheDocument();
        });
    });
});