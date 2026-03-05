import styles from './Sidebar.module.css';
import type { Inventory, Quest } from '../../types/Abstract.types';
import { CommandsSection } from './CommandsSection';
import { InventorySection } from './InventorySection';
import { QuestSection } from './QuestSection';

interface SidebarProps {
    quests: Quest[];
    inventory: Inventory;
    inventoryCapacity: number;
}

/**
 * Sidebar: Scrollable panel on the right side of GameScreen.
 * Composed of three sections stacked vertically:
 *   - QuestSection: active quests and their completion status
 *   - InventorySection: current element counts
 *   - CommandsSection: static list of available key commands
 */
export function Sidebar({ quests, inventory, inventoryCapacity }: SidebarProps) {
    return (
        <div className={styles.sidebarContainer}>
            <QuestSection quests={quests} />
            <InventorySection inventory={inventory} inventoryCapacity={inventoryCapacity} />
            <CommandsSection />
        </div>
    );
}
