import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';

interface UserInfo {
    username: string;
    treeID: string;
    resourceLevels: {
        water: number;
        earth: number;
        sun: number;
    };
    displayName: string;
}

export const Homepage = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [showResources, setShowResources] = useState(false);

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
                
                // Fetch user info including resource levels
                const response = await fetch('/api/get-user-info');
                if (response.ok) {
                    const data = await response.json();
                    setUserInfo(data);
                }
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

            <div>
                <button onClick={() => setShowResources(!showResources)}>
                    {showResources ? 'Hide' : 'Show'} Resource Levels
                </button>
                {showResources && userInfo && (
                    <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc' }}>
                        <h3>Resource Levels:</h3>
                        <p>Water: {userInfo.resourceLevels.water}</p>
                        <p>Earth: {userInfo.resourceLevels.earth}</p>
                        <p>Sun: {userInfo.resourceLevels.sun}</p>
                    </div>
                )}
            </div>
        </div>
    );
};