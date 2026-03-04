import styles from "./ResourceBoard.module.css"
import { RESOURCE_ICONS } from "../../constant";

export interface Resources {
    water: number;
    earth: number;
    sun: number;
}
export type ResourceType = "water" | "earth" | "sun"; 
export interface ResourceItemProps {
    type: ResourceType;
    value: number;
    label: string;
}

const RESOURCE_CONFIG = {
    water: { icon: RESOURCE_ICONS.WATER, barClass: styles.waterBar },
    earth: { icon: RESOURCE_ICONS.EARTH, barClass: styles.earthBar },
    sun: { icon: RESOURCE_ICONS.SUN, barClass: styles.sunBar },
};

export const ResourceItem = ({ type, value, label }: ResourceItemProps) => {
    const config = RESOURCE_CONFIG[type];
    console.log(type, value);
    
    return (
        <div className={styles.resourceItem}>
            <img
                src={config.icon}
                alt={`${label} Resource Icon`}
                className={styles.resourceIcon}
            />
            <div className={styles.resourceRight}>
                <div className={styles.resourceLabelRow}>
                    <span className={styles.resourceLabel}>{label}</span>
                    <span className={styles.resourceValue}>{Math.min(100, Math.max(0, value))}%</span>
                </div>
                <div className={styles.progressBarContainer}>
                    <div
                        className={`${styles.progressBar} ${config.barClass}`}
                        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}