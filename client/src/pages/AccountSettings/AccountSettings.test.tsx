import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from './AccountSettings';

const logoutMock = vi.fn();
const navigateMock = vi.fn();
const fetchMock = vi.fn();
let authUser: Record<string, string> | null = {
    name: 'Ada Lovelace',
    nickname: 'adal',
    email: 'ada@example.com',
    sub: 'auth0|abc123',
};

vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: authUser,
        logout: logoutMock,
        getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
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
        fetchMock.mockClear();
        vi.stubGlobal('fetch', fetchMock);
        authUser = {
            name: 'Ada Lovelace',
            nickname: 'adal',
            email: 'ada@example.com',
            sub: 'auth0|abc123',
        };

        fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
            const url = String(input);
            if (url === '/api/auth/verify') {
                return { ok: true, json: async () => ({ success: true }) } as Response;
            }
            if (url === '/api/get-user-info') {
                return { ok: false, json: async () => ({}) } as Response;
            }
            return { ok: false, json: async () => ({}) } as Response;
        });
    });

    it('renders account fields from Auth0', () => {
        renderPage();

        expect(screen.getByText('ACCOUNT SETTINGS')).toBeInTheDocument();
        expect(screen.getByText('Name:')).toBeInTheDocument();
        expect(screen.getByText('Contact Email:')).toBeInTheDocument();
        expect(screen.getByText('3-6')).toBeInTheDocument();
    });

    it('navigates home when the home button is clicked', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'Home' }));
        expect(navigateMock).toHaveBeenCalledWith('/');
    });

    it('calls logout when the log out button is clicked', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'LOG OUT' }));

        expect(logoutMock).toHaveBeenCalledWith({
            logoutParams: { returnTo: window.location.origin },
        });
    });

    it('navigates to the edit page when edit is clicked', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'EDIT' }));
        expect(navigateMock).toHaveBeenCalledWith('/account/edit');
    });

    it('shows fallback copy when user data is missing', () => {
        authUser = null;
        renderPage();

        expect(screen.getByText('Player')).toBeInTheDocument();
    });
});
