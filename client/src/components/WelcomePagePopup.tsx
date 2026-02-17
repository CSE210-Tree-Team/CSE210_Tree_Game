import styles from "./WelcomePopup.module.css";

interface WelcomePagePopupProps {
    text: string;
    className?: string;
}

export const WelcomePagePopup = ({ text, className }: WelcomePagePopupProps) => {
    return (
        <div className={`${styles.welcomePopup} ${className ?? ""}`}>
            <p className={styles.welcomeText}>{text}</p>
        </div>
    );
};