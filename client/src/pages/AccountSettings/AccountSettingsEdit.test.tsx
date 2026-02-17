import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettingsEdit } from './AccountSettings';

const navigateMock = vi.fn();
let authUser: Record<string, string> | null = {
    name: 'Ada Lovelace',
    nickname: 'adal',
    email: 'ada@example.com',
};

vi.mock('@auth0/auth0-react', () => ({
    useAuth0: () => ({
        user: authUser,
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
        localStorage.clear();
        authUser = {
            name: 'Ada Lovelace',
            nickname: 'adal',
            email: 'ada@example.com',
        };
    });

    it('renders edit fields', () => {
        renderPage();

        expect(screen.getByText('ACCOUNT SETTINGS')).toBeInTheDocument();
        expect(screen.getByLabelText('Name:')).toHaveValue('Ada Lovelace');
        expect(screen.getByLabelText('Identity:')).toHaveValue('Student');
        expect(screen.getByLabelText('Email:')).toHaveValue('ada@example.com');
        expect(screen.getByLabelText('Education Level:')).toHaveValue('3-6');
    });

    it('saves values and navigates back to account', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.clear(screen.getByLabelText('Name:'));
        await user.type(screen.getByLabelText('Name:'), 'AAA');
        await user.selectOptions(screen.getByLabelText('Identity:'), 'Teacher');
        await user.click(screen.getByRole('button', { name: 'SAVE' }));

        const stored = JSON.parse(localStorage.getItem('treegame.account.profile') ?? '{}');
        expect(stored.name).toBe('AAA');
        expect(stored.identity).toBe('Teacher');
        expect(navigateMock).toHaveBeenCalledWith('/account');
    });

    it('cancels and returns to account page', async () => {
        renderPage();
        await userEvent.click(screen.getByRole('button', { name: 'CANCEL' }));
        expect(navigateMock).toHaveBeenCalledWith('/account');
    });
});
