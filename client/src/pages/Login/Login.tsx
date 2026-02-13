import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

interface LoginProps {
    isSignup?: boolean;
}

export const Login = ({ isSignup = false }: LoginProps) => {
    const {
        isLoading,
        loginWithRedirect,
    } = useAuth0();

    useEffect(() => {
        if (isSignup) {
            loginWithRedirect({
                authorizationParams: { screen_hint: 'signup' }
            });
        } else {
            loginWithRedirect();
        }
    }, [isSignup, loginWithRedirect]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return <div>Redirecting to {isSignup ? 'Sign Up' : 'Log In'}...</div>;
};