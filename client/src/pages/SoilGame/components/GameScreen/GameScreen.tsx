import type { GameState } from '../../types/SoilGame_REP.type';
import { Terminal } from '../Terminal/Terminal';
import { Sidebar } from '../Sidebar/Sidebar';
import styles from './GameScreen.module.css';

interface GameScreenProps {
    state: GameState;
    onCommand: (rawInput: string) => void;
}

export function GameScreen({ state, onCommand }: GameScreenProps) {
    return (
        <div className={styles.gameBoard}>
            <div className={styles.terminalContainer}>
                <Terminal logs={state.terminalLog} onCommand={onCommand} />
            </div>
            <div className={styles.sidebarContainer}>
                <Sidebar quests={state.quests} inventory={state.inventory} />
            </div>
        </div>
    );
}