import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletionPopup } from '../components/CompletionPopup/CompletionPopup';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

describe('CompletionPopup', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the completion message and title', () => {
        render(<CompletionPopup onRestart={() => { }} />);

        expect(screen.getByText('All Quests Done!')).toBeInTheDocument();
        expect(screen.getByText(/You finished all the quests, check your progress on homepage and if its not at 100% play again./i)).toBeInTheDocument();
    });

    it('renders the Homepage button', () => {
        render(<CompletionPopup onRestart={() => { }} />);

        expect(screen.getByRole('button', { name: /homepage/i })).toBeInTheDocument();
    });

    it('navigates to homepage when Homepage button is clicked', async () => {
        const user = userEvent.setup();
        render(<CompletionPopup onRestart={() => { }} />);

        const homepageButton = screen.getByRole('button', { name: /homepage/i });
        await user.click(homepageButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
