import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';

export const Homepage = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();

    useEffect(() => {
        // Establish backend session after Auth0 login
        const establishSession = async () => {
            try {
                const token = await getAccessTokenSilently();
                await fetch('/api/auth/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ user })
                });
            } catch (error) {
                console.error('Failed to establish backend session:', error);
            }
        };
        
        if (user) {
            establishSession();
        }
    }, [user, getAccessTokenSilently]);

    const handleLogout = () =>
        logout({ logoutParams: { returnTo: window.location.origin } });

    const handleSoilGame = () => {
        window.location.href = '/soilGame';
    };

    const handleWaterGame = () => {
        window.location.href = '/rainGame';
    };

    return (
        <div>
            <h1>Homepage</h1>

            <p>User: {user?.email}</p>

            <h2>Profile</h2>
            <pre>
                {JSON.stringify(user, null, 2)}
            </pre>

            <div>
                <button onClick={handleSoilGame}>
                    Play Soil Game
                </button>
                <button onClick={handleWaterGame}>
                    Play Water Game
                </button>
                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
};