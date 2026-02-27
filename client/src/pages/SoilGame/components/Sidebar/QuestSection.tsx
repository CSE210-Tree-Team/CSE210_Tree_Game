import styles from './Sidebar.module.css';
import type { Quest } from '../../types/Abstract.types';

export function QuestSection({ quests }: { quests: Quest[] }) {
    return (
        <div className={styles.section}>
            <h1 className={styles.heading}>
                <img src="/assets/book.svg" alt="" className={styles.headingIcon} />
                QUESTS
            </h1>
            {quests.map((q) => {
                return (
                    <div key={q.moleculeFormula} className={styles.questItem}>
                        <div className={styles.text}>
                            <img
                                src={q.completed ? '/assets/soilChecked.svg' : '/assets/soilUnchecked.svg'}
                                alt={q.completed ? 'completed' : 'incomplete'}
                                style={{ marginRight: '8px' }}
                            />
                            {q.moleculeName}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
