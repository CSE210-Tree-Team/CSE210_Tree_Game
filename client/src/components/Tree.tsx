import styles from "./homepage.module.css";

interface TreeProps {
    water: number;
}

export const Tree = ({ water }: TreeProps) => {
    const getTreeImage = () => {
        if (water >= 70) {
            return "/assets/tree_health.png";
        } else if (water >= 40) {
            return "/assets/tree_typical.png";
        } else {
            return "/assets/tree_dry.png";
        }
    };

    return (
        <div className={styles.treeContainer}>
            <img
                src={getTreeImage()}
                alt="Tree"
                className={styles.treeImage}
            />
        </div>
    );
};