import type { GameState } from '../../types/Abstract.types';
import { Terminal } from '../Terminal/Terminal';
import { Sidebar } from '../Sidebar/Sidebar';
import styles from './GameScreen.module.css';

interface GameScreenProps {
    state: GameState;
    onCommand: (rawInput: string) => void;
}

/**
 * GameScreen: Top-level layout for the active game.
 * Splits the screen into two panels:
 *   - Left (75%): Terminal for player input and game output
 *   - Right: Sidebar showing quests, inventory, and commands
 */
export function GameScreen({ state, onCommand }: GameScreenProps) {
    return (
        <div className={styles.gameBoard}>
            <div className={styles.terminalContainer}>
                <Terminal logs={state.terminalLog} onCommand={onCommand} />
            </div>
            <div className={styles.sidebarContainer}>
                <Sidebar quests={state.quests} inventory={state.inventory} inventoryCapacity={state.inventoryCapacity} />
            </div>
        </div>
    );
}