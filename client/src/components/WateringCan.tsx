import styles from "../css/homepage.module.css"
interface WateringCanProps {
    onClick: () => void;
}

export const WateringCan = ({ onClick }: WateringCanProps) => {
    return (
        <div className={styles.wateringCanContainer}>
            <button
                className={styles.wateringCanButton}
                onClick={onClick}
                aria-label="Water the tree"
            >
                <img
                    src="/assets/water_can.png"
                    alt="Water Can"
                    className={styles.wateringCanImage}
                />
            </button>
        </div>
        
    );
};