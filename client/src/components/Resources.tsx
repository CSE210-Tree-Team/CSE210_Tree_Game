import styles from "./homepage.module.css"
import { RESOURCE_ICONS } from "./constant";

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

export const ResourceItem = ({ type, value, label }: ResourceItemProps) => {
    const getIcon = () => {
        switch (type) {
            case "water":
                return RESOURCE_ICONS.WATER;
            case "earth":
                return RESOURCE_ICONS.EARTH;
            case "sun":
                return RESOURCE_ICONS.SUN;
        }
    };
    const getBarClass = () => {
        switch (type) {
            case "water":
                return styles.waterBar;
            case "earth":
                return styles.earthBar;
            case "sun":
                return styles.sunBar;
        }
    };

    return (
        <div className={styles.resourceItem}>
            <img
                src={getIcon()}
                alt={`${label} Resource Icon`}
                className={styles.resourceIcon}
            />
            <div className={styles.resourceRight}>
                <div className={styles.resourceLabelRow}>
                    <span className={styles.resourceLabel}>{label}</span>
                    <span className={styles.resourceValue}>{value}%</span>
                </div>
                <div className={styles.progressBarContainer}>
                    <div
                        className={`${styles.progressBar} ${getBarClass()}`}
                        style={{ width: `${value}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
}