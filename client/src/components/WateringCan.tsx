import styles from "../css/homepage.module.css"
interface WateringCanProps {
    onClick: () => void;
}

export const WateringCan = ({ onClick }: WateringCanProps) => {
    return (
        <div className={styles.wateringCanContainer}>
            <img onClick={onClick}
                src="/assets/water_can.png"
                alt="Water Can"
                className={styles.wateringCanImage}
            />
        </div>
        
    );
};