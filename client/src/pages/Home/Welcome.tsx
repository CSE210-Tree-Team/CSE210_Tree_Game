/**
 * Welcome page
 * This page serves as the entry point for users visiting the website
 * It provides a welcome message and an introduction to the game, encouraging users to sign up or log in 
 * The page guides users towards creating an account or accessing their existing account to begin playing
 */

import { useNavigate } from 'react-router-dom';
import styles from "./homepage.module.css"
import fontStyles from "../../components/Popup.module.css"
import welcomeStyles from "./WelcomePopup.module.css"
import { Button } from "../../components/Button";

interface WelcomePagePopupProps {
    text: string;
}

const WelcomePagePopup = ({ text }: WelcomePagePopupProps) => {
    return (
        <div className={`${welcomeStyles.welcomePopup}`}>
            <p className={welcomeStyles.welcomeText}>{text}</p>
        </div>
    );
};

export const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className={`${styles.homepageWrapper} ${welcomeStyles.welcomeContainer}`}>
                <h1 className={`${fontStyles.title} ${styles.gameTitle}`}>
                    Welcome to Bristlecone
                </h1>

                <WelcomePagePopup
                    text={`This is Bristlecone, where nature needs your help! Adopt your very own virtual tree and keep it alive by exploring the world of science.\n\nPlay mini-games to gather water, nutrients, and sunlight -- because the more you learn, the taller your tree grows!`}
                />

            <div className={styles.buttonContainer}>
                <Button variant="grass" label="Sign Up" onClick={() => navigate("/signup")} />
                <Button variant="grass" label="Log In" onClick={() => navigate("/login")} />
            </div>
        </div>
    );
};