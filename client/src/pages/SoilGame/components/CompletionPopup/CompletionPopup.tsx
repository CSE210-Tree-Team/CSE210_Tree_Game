import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/Button';
import styles from './CompletionPopup.module.css';

interface CompletionPopupProps {
    onRestart: () => void;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({ onRestart }) => {
    const navigate = useNavigate();

    return (
        <div className={styles.overlay} id="completion-popup-overlay">
            <div className={styles.popup} id="completion-popup-content">
                <h1 className={styles.title}>All Quests Done!</h1>
                <p className={styles.message}>
                    You finished all the quests, check your progress on homepage and if its not at 100% play again.
                </p>
                <div className={styles.buttonContainer}>
                    <Button
                        variant="soil"
                        label="Homepage"
                        onClick={() => navigate('/')}
                        className={styles.pobutton}
                    />
                </div>
            </div>
        </div>
    );
};
