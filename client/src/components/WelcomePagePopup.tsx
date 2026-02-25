import styles from "./WelcomePopup.module.css";

interface WelcomePagePopupProps {
    text: string;
}

export const WelcomePagePopup = ({ text }: WelcomePagePopupProps) => {
    return (
        <div className={`${styles.welcomePopup}`}>
            <p className={styles.welcomeText}>{text}</p>
        </div>
    );
};