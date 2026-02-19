import styles from './Sidebar.module.css';
import type { Inventory, Quest } from '../../types/SoilGame_REP.type';
import { CommandsSection } from './CommandsSection';
import { InventorySection } from './InventorySection';
import { QuestSection } from './QuestSection';

interface SidebarProps {
    quests: Quest[];
    inventory: Inventory;
}

export function Sidebar({ quests, inventory }: SidebarProps) {
    return (
        <div className={styles.sidebarContainer}>
            <QuestSection quests={quests} />
            <InventorySection inventory={inventory} />
            <CommandsSection />
        </div>
    );
}
