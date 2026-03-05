/**
 * Tree Compinent
 * Displays the health status of the tree based on the provided value
 * healthy, unhealthy, withered
 */
import styles from "./Tree.module.css";
import {
    TREE_HEALTH_THRESHOLD,
    TREE_UNHEALTHY_THRESHOLD,
    TREE_IMAGES,
    HEALTH_HEALTHY,
    HEALTH_UNHEALTHY,
    HEALTH_WITHERED
} from "../../constant";

interface TreeProps {
    water: number;
    health?: string; // 'Healthy' | 'Unhealthy' | 'Withered' | 'Dead'

}


export const Tree = ({ water }: TreeProps) => {
    const getTreeImage = () => {
        if (water >= TREE_HEALTH_THRESHOLD) {
            return TREE_IMAGES.HEALTHY;
        } else if (water >= TREE_UNHEALTHY_THRESHOLD) {
            return TREE_IMAGES.UNHEALTHY;
        } else {
            return TREE_IMAGES.WITHERED;
        }
    };

    const getTreeHealthStatus = () => {
        if (water >= TREE_HEALTH_THRESHOLD) {
            return HEALTH_HEALTHY;
        } else if (water >= TREE_UNHEALTHY_THRESHOLD) {
            return HEALTH_UNHEALTHY;
        } else {
            return HEALTH_WITHERED;
        }
    }

    return (
        <div className={styles.treeContainer}>
            <img
                src={getTreeImage()}
                alt={`Tree-${getTreeHealthStatus()}`}
                className={styles.treeImage}
                loading="eager"
                decoding="async"
            />
        </div>
    );
};