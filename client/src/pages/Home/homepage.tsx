import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree } from "../../components/Tree";
import { Earth } from "../../components/Earth";
import { WateringCan } from "../../components/WateringCan";
import { ResourceBoard } from "../../components/ResourceBoard"
import styles from "../../components/homepage.module.css"
import fontStyles from "../../components/Popup.module.css"
import buttonStyles from "../../components/Button.module.css"
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

const userInfoMock: UserInfo = {
    success: true,
    user: {
        username: "AA",
        displayName: "AA",
        email: "123@example.com",
        roles: ["11", "22"]
    },
    tree: {
        treeID: "test111",
        health: "health01",
        growthStage: 1,
        resourceLevels: {
            water: 70,
            earth: 50,
            sun: 100,
        }
    }

}



export const Homepage = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    //const [showResources, setShowResources] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        // Replace with actual user info fetch
        //setUserInfo(userInfoMock);
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

    const handleAccountSettings = () => {
        navigate('/account');
    };

    

    return (
        <div className={styles.homepageWrapper}>
            <div className={styles.gameConatiner}>
                <div className={fontStyles.grass}>
                    <h1 className={`${fontStyles.title} ${styles.helloTitle}`}>
                        Hello, {userInfo?.user.displayName || 'User'}
                    </h1>
                </div>
                <ResourceBoard resources={userInfo?.tree.resourceLevels || userInfoMock.tree.resourceLevels} />

                <div className={styles.treeEarthContainer}>
                    <Tree water={userInfo?.tree.resourceLevels.water || userInfoMock.tree.resourceLevels.water} />
                    <Earth earth={userInfo?.tree.resourceLevels.earth || userInfoMock.tree.resourceLevels.earth} onClick={handleSoilGame} />
                    <WateringCan onClick={handleWaterGame} />
                </div>


                <div>
                <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle} ${styles.buttonLogout}`} onClick={handleLogout}>
                    Logout
                    </button>

                    <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle} ${styles.buttonSetting}`} onClick={handleAccountSettings}>
                    Settings
                    </button>
                </div>
            </div>

            <br></br>

        </div>
    );

};
