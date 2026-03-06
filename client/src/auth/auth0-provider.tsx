import { Auth0Provider } from '@auth0/auth0-react';
import { type ReactNode } from 'react';

interface Auth0ProviderWithConfigProps {
    children: ReactNode;
}

export const Auth0ProviderWithConfig = ({ children }: Auth0ProviderWithConfigProps) => {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

    if (!domain || !clientId) {
        return (
            <div style={{ padding: '1.5rem', fontFamily: 'sans-serif' }}>
                App configuration error: missing Auth0 environment variables.
            </div>
        );
    }

    return (
        <Auth0Provider
            domain={domain}
            clientId={clientId}
            authorizationParams={{
                redirect_uri: window.location.origin,
                audience: `https://${domain}/api/v2/`
            }}
            useRefreshTokens={true}
            cacheLocation="localstorage"
        >
            {children}
        </Auth0Provider>
    );
};