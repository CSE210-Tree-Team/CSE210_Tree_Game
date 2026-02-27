import styles from './Sidebar.module.css';

const COMMANDS = [
    { key: 'W', label: 'go up' },
    { key: 'A', label: 'go left' },
    { key: 'S', label: 'go down' },
    { key: 'D', label: 'go right' },
    { key: 'C', label: 'collect/put in inventory' },
    { key: '1 / 2 / 3', label: 'submit the quest you are working on' },
    { key: 'I', label: 'print map and get current location' },
];

export function CommandsSection() {
    return (
        <div className={styles.section}>
            <h2 className={styles.heading}>
                <img src="/assets/commands.svg" alt="" className={styles.headingIcon} />
                COMMANDS
            </h2>
            <div className={`${styles.text} ${styles.commandsList}`}>
                {COMMANDS.map(({ key, label }) => (
                    <div key={key} className={styles.commandRow}>
                        <span className={styles.commandKey}>{key}</span> - {label}
                    </div>
                ))}
            </div>
        </div>
    );
}
