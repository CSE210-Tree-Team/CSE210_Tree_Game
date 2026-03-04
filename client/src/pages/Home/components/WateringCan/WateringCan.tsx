import styles from "./WateringCan.module.css"
import { WATER_CAN_IMAGE } from "../../constant"
interface WateringCanProps {
    onClick: () => void;
}

export const WateringCan = ({ onClick }: WateringCanProps) => {
    return (
        <div className={styles.wateringCanContainer}>
            <img onClick={onClick}
                src={WATER_CAN_IMAGE}
                alt="Water Can"
                className={styles.wateringCanImage}
                loading="eager"
                decoding="async"
            />
        </div>
        
    );
};