import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsEdit } from './AccountSettings';

const navigateMock = vi.fn();
const fetchMock = vi.fn();
let authUser: Record<string, string> | null = {
    name: 'Ada Lovelace',
    nickname: 'adal',
    email: 'ada@example.com',
};

vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: authUser,
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

const renderPage = () => render(<AccountSettingsEdit />);

describe('AccountSettingsEdit', () => {
    beforeEach(() => {
        navigateMock.mockClear();
        fetchMock.mockClear();
        vi.stubGlobal('fetch', fetchMock);
        authUser = {
            name: 'Ada Lovelace',
            nickname: 'adal',
            email: 'ada@example.com',
        };

        fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            if (url === '/api/auth/verify') {
                return { ok: true, json: async () => ({ success: true }) } as Response;
            }
            if (url === '/api/account/profile' && (!init?.method || init.method === 'GET')) {
                return { ok: false, json: async () => ({}) } as Response;
            }
            if (url === '/api/account/profile' && init?.method === 'PUT') {
                return { ok: true, json: async () => ({ success: true }) } as Response;
            }
            return { ok: false, json: async () => ({}) } as Response;
        });
    });

    it('renders edit fields', () => {
        renderPage();

        expect(screen.getByText('ACCOUNT SETTINGS')).toBeInTheDocument();
        expect(screen.getByLabelText('Name:')).toHaveValue('Ada Lovelace');
        expect(screen.getByLabelText('Parent Email:')).toHaveValue('');
        expect(screen.getByLabelText('Email:')).toHaveValue('ada@example.com');
        expect(screen.getByLabelText('Education Level:')).toHaveValue('3-6');
    });

    it('saves values and navigates back to account', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.clear(screen.getByLabelText('Name:'));
        await user.type(screen.getByLabelText('Name:'), 'AAA');
        await user.type(screen.getByLabelText('Parent Email:'), 'p@example.com');
        await user.click(screen.getByRole('button', { name: 'SAVE' }));

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/account/profile',
            expect.objectContaining({
                method: 'PUT',
            })
        );
        const putCall = fetchMock.mock.calls.find((call) => String(call[0]) === '/api/account/profile' && call[1]?.method === 'PUT');
        const body = JSON.parse(String(putCall?.[1]?.body ?? '{}'));
        expect(body.name).toBe('AAA');
        expect(body.parentEmail).toBe('p@example.com');
        expect(navigateMock).toHaveBeenCalledWith('/account');
    });

    it('blocks save when parent email is invalid', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText('Parent Email:'), 'jewhfihei');
        await user.click(screen.getByRole('button', { name: 'SAVE' }));

        const putCall = fetchMock.mock.calls.find(
            (call) => String(call[0]) === '/api/account/profile' && call[1]?.method === 'PUT'
        );
        expect(putCall).toBeUndefined();

        const alertText = screen
            .getAllByRole('alert')
            .map((node) => node.textContent ?? '')
            .join(' ');
        expect(alertText).toMatch(/valid parent email/i);
        expect(navigateMock).not.toHaveBeenCalledWith('/account');
    });

    it('blocks save when email is invalid', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.clear(screen.getByLabelText('Email:'));
        await user.type(screen.getByLabelText('Email:'), 'invalid');
        await user.click(screen.getByRole('button', { name: 'SAVE' }));

        const putCall = fetchMock.mock.calls.find(
            (call) => String(call[0]) === '/api/account/profile' && call[1]?.method === 'PUT'
        );
        expect(putCall).toBeUndefined();

        const alertText = screen
            .getAllByRole('alert')
            .map((node) => node.textContent ?? '')
            .join(' ');
        expect(alertText).toMatch(/valid email/i);
        expect(navigateMock).not.toHaveBeenCalledWith('/account');
    });

    it('cancels and returns to account page', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
        expect(navigateMock).toHaveBeenCalledWith('/account');
    });
});
