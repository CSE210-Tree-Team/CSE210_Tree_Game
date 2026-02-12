import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom'; 
import { useEffect, useState } from 'react';

interface UserInfo {
    success: boolean;
    user: {
        username: string;
        displayName: string;
        email: string;
        roles: string[];
    };
    tree: {
        treeID: string;
        health: string;
        growthStage: number;
        resourceLevels: {
            water: number;
            earth: number;
            sun: number;
        };
    };
}

export const Homepage = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [showResources, setShowResources] = useState(false);
    const navigate = useNavigate();


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
        navigate('/soil');
    };

    const handleWaterGame = () => {
        navigate('/water');
    };

    const handleAddResource = async (resourceType: 'water' | 'earth' | 'sun') => {
        try {
            const response = await fetch('/api/update-stat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    stat_name: resourceType,
                    value: 5
                })
            });

            if (response.ok) {
                // Refresh user info to show updated resource levels
                const userInfoResponse = await fetch('/api/get-user-info');
                if (userInfoResponse.ok) {
                    const data = await userInfoResponse.json();
                    setUserInfo(data);
                }
            } else {
                console.error(`Failed to add ${resourceType}`);
            }
        } catch (error) {
            console.error(`Error adding ${resourceType}:`, error);
        }
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
                        <p>Water: {userInfo.tree.resourceLevels.water}</p>
                        <p>Earth: {userInfo.tree.resourceLevels.earth}</p>
                        <p>Sun: {userInfo.tree.resourceLevels.sun}</p>
                    </div>
                )}
            </div>

            <br></br>

            <div>
                <h3>Add Resources:</h3>
                <button onClick={() => handleAddResource('water')}>
                    Add 5 Water
                </button>
                <button onClick={() => handleAddResource('earth')} style={{ marginLeft: '10px' }}>
                    Add 5 Earth
                </button>
                <button onClick={() => handleAddResource('sun')} style={{ marginLeft: '10px' }}>
                    Add 5 Sun
                </button>
            </div>
        </div>
    );
};