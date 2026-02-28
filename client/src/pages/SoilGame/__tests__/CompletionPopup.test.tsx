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

    it('renders "All Quests Done!" when all quests are completed', () => {
        render(<CompletionPopup questsCompleted={3} totalQuests={3} score={75} />);

        expect(screen.getByText('All Quests Done!')).toBeInTheDocument();
        expect(screen.getByText(/You finished all the quests, check your progress on homepage and if its not at 100% play again./i)).toBeInTheDocument();
        expect(screen.getByText(/Score Earned:/i).closest('p')).toHaveTextContent('Score Earned: +75 points from 3 quests');
    });

    it('renders "Game Exited" when not all quests are completed', () => {
        render(<CompletionPopup questsCompleted={1} totalQuests={3} score={25} />);

        expect(screen.getByText('Game Exited')).toBeInTheDocument();
        expect(screen.getByText(/You completed 1 out of 3 quests\. Check your progress on the homepage and play again to complete more quests\./i)).toBeInTheDocument();
        expect(screen.getByText(/Score Earned:/i).closest('p')).toHaveTextContent('Score Earned: +25 points from 1 quest');
    });

    it('renders correct message when zero quests are completed', () => {
        render(<CompletionPopup questsCompleted={0} totalQuests={3} score={0} />);

        expect(screen.getByText('Game Exited')).toBeInTheDocument();
        expect(screen.getByText(/You completed 0 out of 3 quests\. Check your progress on the homepage and play again to complete more quests\./i)).toBeInTheDocument();
        expect(screen.getByText(/Score Earned:/i).closest('p')).toHaveTextContent('Score Earned: +0 points from 0 quests');
    });

    it('renders the Homepage button', () => {
        render(<CompletionPopup questsCompleted={1} totalQuests={3} score={25} />);

        expect(screen.getByRole('button', { name: /homepage/i })).toBeInTheDocument();
    });

    it('navigates to homepage when Homepage button is clicked', async () => {
        const user = userEvent.setup();
        render(<CompletionPopup questsCompleted={1} totalQuests={3} score={25} />);

        const homepageButton = screen.getByRole('button', { name: /homepage/i });
        await user.click(homepageButton);

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
