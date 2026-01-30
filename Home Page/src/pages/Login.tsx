import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

export const Login = () => {
    const {
        isLoading,
        error,
        loginWithRedirect,
    } = useAuth0();

    const login = () => loginWithRedirect();

    const signup = () =>
        loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } });

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autoLogin') === 'true') {
            loginWithRedirect();
        }
    }, [loginWithRedirect]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Welcome to Tree Game</h1>
            {error && <p>Error: {error.message}</p>}
            <div>
                <button onClick={signup}>
                    Sign Up
                </button>
                <button onClick={login}>
                    Log In
                </button>
            </div>
        </div>
    );
};