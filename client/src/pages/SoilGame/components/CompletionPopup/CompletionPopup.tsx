import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/Button';
import styles from './CompletionPopup.module.css';

interface CompletionPopupProps {
    questsCompleted: number;
    totalQuests: number;
    score: number;
}

export const CompletionPopup: React.FC<CompletionPopupProps> = ({ questsCompleted, totalQuests, score }) => {
    const navigate = useNavigate();
    const isAllQuestsCompleted = questsCompleted === totalQuests;
    const scoreEarned = score;

    return (
        <div className={styles.overlay} id="completion-popup-overlay">
            <div className={styles.popup} id="completion-popup-content">
                <h1 className={styles.title}>{isAllQuestsCompleted ? 'All Quests Done!' : 'Game Exited'}</h1>
                <p className={styles.message}>
                    {isAllQuestsCompleted
                        ? 'You finished all the quests, check your progress on homepage and if its not at 100% play again.'
                        : `You completed ${questsCompleted} out of ${totalQuests} quest${totalQuests === 1 ? '' : 's'}. Check your progress on the homepage and play again to complete more quests.`}
                </p>
                <p className={styles.score}>
                    <strong>Score Earned:</strong> +{scoreEarned} points from {questsCompleted} quest{questsCompleted === 1 ? '' : 's'}
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
