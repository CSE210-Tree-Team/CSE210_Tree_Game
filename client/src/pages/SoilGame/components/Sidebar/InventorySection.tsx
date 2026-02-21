import styles from './Sidebar.module.css';
import type { Inventory, ElementType } from '../../types/SoilGame_REP.type';

const ELEMENT_ORDER: ElementType[] = ['Nitrogen', 'Hydrogen', 'Carbon', 'Oxygen'];

export function InventorySection({ inventory }: { inventory: Inventory }) {
    return (
        <div className={styles.section}>
            <h2 className={styles.heading}>
                <img src="/assets/inventory.svg" alt="" className={styles.headingIcon} />
                INVENTORY
            </h2>
            <div className={styles.scrollableList}>
                {ELEMENT_ORDER.map((element) => (
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
