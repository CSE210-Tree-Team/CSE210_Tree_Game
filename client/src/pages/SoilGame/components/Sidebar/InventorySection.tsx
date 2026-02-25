import styles from './Sidebar.module.css';
import type { Inventory } from '../../types/Abstract.types';

export function InventorySection({ inventory }: { inventory: Inventory }) {
    const sortedElements = Object.keys(inventory).sort();

    return (
        <div className={styles.section}>
            <h2 className={styles.heading}>
                <img src="/assets/inventory.svg" alt="" className={styles.headingIcon} />
                INVENTORY
            </h2>
            <div className={styles.scrollableList}>
                {sortedElements.map((element) => (
                    <div key={element} className={`${styles.text} ${styles.inventoryRow}`}>
                        <span>{element}</span>
                        <span style={{
                            color: inventory[element] > 0 ? 'var(--color-success)' : 'var(--color-grey1)',
                            fontWeight: inventory[element] > 0 ? 'bold' : 'normal',
                        }}>
                            {inventory[element]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
