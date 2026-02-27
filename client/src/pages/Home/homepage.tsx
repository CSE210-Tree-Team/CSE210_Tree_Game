import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tree } from "../../components/Tree";
import { Earth } from "../../components/Earth";
import { WateringCan } from "../../components/WateringCan";
import { ResourceBoard } from "../../components/ResourceBoard"
import styles from "../../components/homepage.module.css"
import fontStyles from "../../components/Popup.module.css"
import buttonStyles from "../../components/Button.module.css"
import Tutorial from "./Tutorial"
import { type UserInfo } from "./hooks/ServerCalls"
import { useFetchUserInfo } from "./hooks/ServerCalls"


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
    const { logout } = useAuth0();
    const navigate = useNavigate();
    const [showTutorial, setShowTutorial] = useState<boolean>(() => {
        const hasSeenTutorial = sessionStorage.getItem('hasSeenTutorial');
        return !hasSeenTutorial; // Show tutorial if user hasn't seen it before
    });

    const { userInfo } = useFetchUserInfo();

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

                    <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle} ${styles.buttonSetting}`} onClick={() => navigate("/")}>
                    Settings
                    </button>
                </div>

            <br></br>

        </div>
    );

};
