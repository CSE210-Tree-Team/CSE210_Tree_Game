import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { handle401Error } from '../ServerCalls/ServerCalls';
import { useNavigate } from 'react-router-dom';
import { Tree } from "../../components/Tree";
import { Earth } from "../../components/Earth";
import { WateringCan } from "../../components/WateringCan";
import { ResourceBoard } from "../../components/ResourceBoard"
import styles from "../../components/homepage.module.css"
import fontStyles from "../../components/Popup.module.css"
import buttonStyles from "../../components/Button.module.css"
import Tutorial from "./Tutorial"
import { type UserInfoResponse } from "../ServerCalls/ServerCalls"
import { establishAuthSession, fetchUserInfo } from "../ServerCalls/ServerCalls"

import { audioSystem } from '../../AudioSystem';
import audioFile from './audio/SoilMinigameOST.mp3'

const userInfoMock: UserInfoResponse = {
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
            earth: 40,
            sun: 100,
        }
    }

}

export const Homepage = () => {
    const { user, logout, getAccessTokenSilently } = useAuth0();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
    const [showTutorial, setShowTutorial] = useState<boolean>(() => {
        const hasSeenTutorial = sessionStorage.getItem('hasSeenTutorial');
        return !hasSeenTutorial; // Show tutorial if user hasn't seen it before
    });
    useEffect(() => {
        const establishSession = async () => {
            if (!user) {
                return;
            }
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
                } else if (response.status === 401) {
                    handle401Error();
                    return;
                }
            } catch (error) {
                console.error('Failed to establish backend session:', error);
            }
        }
        establishSession();
    },[user, getAccessTokenSilently]);

    useEffect(() => {
        audioSystem.playAmbient(audioFile);
        
        return () => {
            audioSystem.fadeOut(1500); // smoother than hard stop
        };
    }, []);


    const handleLogout = () => {
        sessionStorage.removeItem('hasSeenTutorial');
        logout({ logoutParams: { returnTo: window.location.origin } });
    }

    const handleSoilGame = () => {
        navigate('/soil');
    };

    const handleWaterGame = () => {
        navigate('/water');
    };

    const handleCloseTutorial = () => {
        // audioSystem.playAmbient(audioFile);
        setShowTutorial(false);
        sessionStorage.setItem('hasSeenTutorial', 'true');
    }

    const handleSettings = () => {
        navigate('/account');
    };

    return (
        <div className={styles.homepageWrapper}>
            {showTutorial && (<Tutorial onClose={handleCloseTutorial} />)}
                    <h1 className={`${fontStyles.title} ${styles.helloTitle}`}>
                        Hello, {userInfo?.user.displayName || 'User'}
                    </h1>
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

                    <button
                        className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle} ${styles.buttonSetting}`}
                        onClick={handleSettings}
                    >
                    Settings
                    </button>
                </div>

            <br></br>

        </div>
    );

};
