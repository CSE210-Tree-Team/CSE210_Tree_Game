import { useNavigate } from 'react-router-dom';
import styles from "../../css/homepage.module.css"

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.homepageWrapper}>
            <h1 className={styles.gameTitle}>Welcome to Tree Game</h1>
            <p className={styles.gameIntro}>Welcome to Bristlecone, where nature needs your help! Adopt your very own virtual tree and keep it alive by exploring the world of science.
            <br></br>
                Play mini-games to gather water, nutrients, and sunlight -- because the more you learn, the taller your tree grows!
                To be updated</p>
            <div className={styles.buttonContainer}>
                <button className={styles.buttonSingle} onClick={() => navigate("/signup")}>Sign Up</button>
                <button className={styles.buttonSingle} onClick={() => navigate("/login")}>Log In</button>
            </div>
        </div>
    );
};