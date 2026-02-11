import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from './AccountSettings';

const logoutMock = vi.fn();
const navigateMock = vi.fn();
let authUser: Record<string, string> | null = {
    name: 'Ada Lovelace',
    nickname: 'adal',
    email: 'ada@example.com',
    updated_at: '2026-02-10T10:12:00.000Z',
    picture: 'https://example.com/avatar.png',
    sub: 'auth0|abc123',
};

vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: authUser,
        logout: logoutMock,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => navigateMock,
    };
});

const renderPage = () => render(<AccountSettings />);

describe('AccountSettings', () => {
    beforeEach(() => {
        logoutMock.mockClear();
        navigateMock.mockClear();
        localStorage.clear();
        authUser = {
            name: 'Ada Lovelace',
            nickname: 'adal',
            email: 'ada@example.com',
            updated_at: '2026-02-10T10:12:00.000Z',
            picture: 'https://example.com/avatar.png',
            sub: 'auth0|abc123',
        };
    });

    it('renders profile details from Auth0', () => {
        renderPage();

        expect(screen.getByText('Welcome back, Ada Lovelace')).toBeInTheDocument();
        expect(screen.getByText('ada@example.com')).toBeInTheDocument();
        expect(screen.getByText('adal')).toBeInTheDocument();
        expect(screen.getByText('Auth Provider')).toBeInTheDocument();
        expect(screen.getByText('auth0')).toBeInTheDocument();
    });

    it('navigates back to the homepage', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'Back to Home' }));
        expect(navigateMock).toHaveBeenCalledWith('/');
    });

    it('calls logout when the header log out button is clicked', async () => {
        renderPage();
        const logoutButtons = screen.getAllByRole('button', { name: 'Log out' });
        await userEvent.click(logoutButtons[0]);

        expect(logoutMock).toHaveBeenCalledWith({
            logoutParams: { returnTo: window.location.origin },
        });
    });

    it('persists preference toggles to localStorage', async () => {
        const user = userEvent.setup();
        renderPage();

        const remindersToggle = screen.getByLabelText(/game reminders/i);
        await user.click(remindersToggle);

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem('treegame.account.settings') ?? '{}');
            expect(stored.gameReminders).toBe(true);
        });
    });

    it('falls back to defaults when stored settings are invalid', async () => {
        localStorage.setItem('treegame.account.settings', 'not-json');
        renderPage();

        await waitFor(() => {
            const stored = JSON.parse(localStorage.getItem('treegame.account.settings') ?? '{}');
            expect(stored).toMatchObject({
                emailUpdates: true,
                publicProfile: true,
                gameReminders: false,
            });
        });
    });

    it('shows fallback copy when user data is missing', () => {
        authUser = null;
        renderPage();

        expect(screen.getByText('Welcome back, Player')).toBeInTheDocument();
        expect(screen.getByText('Email not provided')).toBeInTheDocument();
        expect(screen.getByText('Last updated: Not available')).toBeInTheDocument();
    });
});
