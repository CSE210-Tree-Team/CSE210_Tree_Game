import { useNavigate } from 'react-router-dom';
import styles from "../../components/homepage.module.css"
import buttonStyles from "../../components/Button.module.css"
import fontStyles from "../../components/Popup.module.css"
import { WelcomePagePopup } from "../../components/WelcomePagePopup"
import test from "../../components/WelcomePopup.module.css"
export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className={`${styles.homepageWrapper} ${test.welcomeContainer}`}>
                <h1 className={`${fontStyles.title} ${styles.gameTitle}`}>
                    Welcome to Bristlecone
                </h1>

                <WelcomePagePopup
                    text={`This is Bristlecone, where nature needs your help! Adopt your very own virtual tree and keep it alive by exploring the world of science.\n\nPlay mini-games to gather water, nutrients, and sunlight -- because the more you learn, the taller your tree grows!`}
                />

            <div className={styles.buttonContainer}>
                <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle}`} onClick={() => navigate("/signup")}>Sign Up</button>
                <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle}`} onClick={() => navigate("/login")}>Log In</button>
            </div>
        </div>
    );
};