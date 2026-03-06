import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree } from "./components/Tree/Tree";
import { Earth } from "./components/Earth/Earth";
import { WateringCan } from "./components/WateringCan/WateringCan";
import { ResourceBoard } from "./components/ResourceBoard/ResourceBoard"

import styles from "./homepage.module.css"
import fontStyles from "../../components/Popup.module.css"

import Tutorial from "./components/Tutorial/Tutorial"
import { type UserInfoResponse } from "../ServerCalls/types"
import { establishAuthSession, fetchUserInfo } from "../ServerCalls/ServerCalls"
import { Button } from "../../components/Button";

const userInfoMock = {
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
                const authSuccess = await establishAuthSession(token, user);
                if (!authSuccess) {
                    throw new Error("Failed to verify the authentication");
                }
                const data = await fetchUserInfo();
                setUserInfo(data);
            } catch {
                throw new Error("Failed to establish backend session");
            }
        }
        establishSession();
    },[user, getAccessTokenSilently]);


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
                        Hello, {userInfo?.user.displayName ?? 'User'}
                    </h1>
                <ResourceBoard resources={userInfo?.tree?.resourceLevels ?? userInfoMock.tree.resourceLevels} />

                <div className={styles.treeEarthContainer}>
                <Tree water={userInfo?.tree?.resourceLevels.water ?? userInfoMock.tree.resourceLevels.water} />
                    <Earth earth={userInfo?.tree?.resourceLevels.earth ?? userInfoMock.tree.resourceLevels.earth} onClick={handleSoilGame} />
                    <WateringCan onClick={handleWaterGame} />
                </div>


            <div>
                <Button variant="grass" label="Logout" onClick={handleLogout} className={`${styles.buttonSingle} ${styles.buttonLogout}`} />
                <Button variant="grass" label="Settings" onClick={handleSettings} className={`${styles.buttonSingle} ${styles.buttonSetting}`} />
                </div>

        </div>
    );

};
