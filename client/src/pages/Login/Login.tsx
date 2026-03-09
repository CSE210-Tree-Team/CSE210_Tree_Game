/**
 * Login component that redirects users to the Auth0 login or signup page
 * It uses the useAuth0 hook to handle authentication and redirects users based on the isSignup prop.
 * If isSignup is true, it redirects to the signup page
 * otherwise, it redirects to the login page
 * While the authentication process is loading, it displays a loading message to the user
 */
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