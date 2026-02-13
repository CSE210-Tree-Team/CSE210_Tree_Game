import { useNavigate } from 'react-router-dom';
import styles from "../../components/homepage.module.css"
import buttonStyles from "../../components/Button.module.css"
import fontStyles from "../../components/Popup.module.css"
export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.homepageWrapper}>
            <div className={fontStyles.grass}>
                <h1 className={`${fontStyles.title} ${styles.gameTitle}`}>
                    Welcome to Bristlecone
                </h1>
            </div>
            <p className={`${fontStyles.text} ${styles.gameIntro} `}>This is Bristlecone, where nature needs your help! Adopt your very own virtual tree and keep it alive by exploring the world of science.
            <br></br>
                Play mini-games to gather water, nutrients, and sunlight -- because the more you learn, the taller your tree grows!
                    To be updated</p>
            <div className={styles.buttonContainer}>
                <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle}`} onClick={() => navigate("/signup")}>Sign Up</button>
                <button className={`${buttonStyles.button} ${buttonStyles.grass} ${styles.buttonSingle}`} onClick={() => navigate("/login")}>Log In</button>
            </div>
        </div>
    );
};