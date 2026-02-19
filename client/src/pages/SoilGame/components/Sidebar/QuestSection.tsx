import styles from './Sidebar.module.css';
import type { Quest } from '../../types/SoilGame_REP.type';

export function QuestSection({ quests }: { quests: Quest[] }) {
    return (
        <div className={styles.section}>
            <h1 className={styles.heading}>
                <img src="/assets/book.svg" alt="" className={styles.headingIcon} />
                QUESTS
            </h1>
            {quests.map((q) => {
                const progress = Object.entries(q.required)
                    .map(([symbol, req]) => `${q.submitted[symbol] ?? 0}/${req} ${symbol}`)
                    .join(' ');

                return (
                    <div key={q.id} className={styles.questItem}>
                        <div className={styles.text}>
                            <span style={{ marginRight: '8px' }}>{q.completed ? '✅' : '☐'}</span>
                            <strong>{q.moleculeName}</strong> [{q.moleculeFormula}]
                        </div>
                        {!q.completed && <span className={styles.questProgress}>{progress}</span>}
                    </div>
                );
            })}
        </div>
    );
}
