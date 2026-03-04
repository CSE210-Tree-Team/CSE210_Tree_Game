import { type Resources } from "./Resources";
import styles from "./ResourceBoard.module.css"
import { RESOURCE_BOARD_BG} from "../../constant";
import { ResourceItem, type ResourceType } from "./Resources";

interface ResourceBoardProps {
    resources: Resources;
}

interface ResourceConfig {
    type: ResourceType;
    label: string;
}

const resourceConfigs: ResourceConfig[] = [
    { type: "water", label: "Water"},
    { type: "earth", label: "Earth"},
];

export const ResourceBoard = ({ resources }: ResourceBoardProps) => {
    return (
        <div className={ styles.resourceBoardContainer}>
            <img
                src={RESOURCE_BOARD_BG}
                alt="Resource Board Background"
                className={ styles.resourceBoardBg}
            />
            <div className={styles.resourceBoardContent}>
                <h3 className={`${styles.resourceBoardTitle}`}>Growth Progress</h3>
                {resourceConfigs.map((config) => (
                    <ResourceItem
                        key={config.type}
                        type={config.type}
                        value={resources[config.type]}
                        label={ config.label}
                    />
                ))}
            </div>
        </div>
    );
};