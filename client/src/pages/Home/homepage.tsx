import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree } from "../../components/Tree";
import { Earth } from "../../components/Earth";
import { WateringCan } from "../../components/WateringCan";
import { ResourceBoard } from "../../components/ResourceBoard"
import { type Resources } from "../../components/Resources";
import styles from "../../css/homepage.module.css"
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
    const navigate = useNavigate();

    const resources: Resources = {
        water: 100,
        earth: 60,
        sun: 20,
    };
    const userInfoMock: UserInfo = { username: "AAA", treeID: "id", resourceLevels: resources, displayName: "AAA" };

    useEffect(() => {
        // Replace with actual user info fetch
        setUserInfo(userInfoMock);
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


    return (
        <div className={styles.homepageWrapper}>
            <div className={styles.gameConatiner}>
                <h1>Hello, {userInfo?.displayName || 'User'}</h1>
                <ResourceBoard resources={userInfo?.resourceLevels || userInfoMock.resourceLevels} />

                <div className={styles.treeEarthContainer}>
                    <Tree water={userInfo?.resourceLevels.water || userInfoMock.resourceLevels.water} />
                    <Earth earth={userInfo?.resourceLevels.earth || userInfoMock.resourceLevels.earth} onClick={handleSoilGame} />
                    <WateringCan onClick={handleWaterGame} />
                </div>



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

                {/*<p>User: {user?.email}</p>
            <h2>Profile</h2>
            <pre>
                {JSON.stringify(user, null, 2)}
            </pre>*/}

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
        </div>
    );

};
