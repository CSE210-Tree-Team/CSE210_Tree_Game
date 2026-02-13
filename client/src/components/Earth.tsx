import styles from "./homepage.module.css"
import {
    EARTH_HEALTH_THRESHOLD,
    EARTH_UNHEALTHY_THRESHOLD,
    EARTH_IMAGES,
    HEALTH_HEALTHY,
    HEALTH_UNHEALTHY,
    HEALTH_WITHERED
} from "./constant";
interface EarthProps {
    earth: number;
    onClick: () => void;
}

export const Earth = ({ earth, onClick }: EarthProps) => {
    const getEarthImage = () => {
        let avgEarth = "";
        if (earth >= EARTH_HEALTH_THRESHOLD) {
            avgEarth = EARTH_IMAGES.HEALTHY;
        } else if (earth >= EARTH_UNHEALTHY_THRESHOLD) {
            avgEarth = EARTH_IMAGES.UNHEALTHY;
        } else {
            avgEarth = EARTH_IMAGES.WITHERED;
        }
        return avgEarth;
    };

    const getEarthHealthStatus = () => {
        if (earth >= EARTH_HEALTH_THRESHOLD) {
            return HEALTH_HEALTHY;
        } else if (earth >= EARTH_UNHEALTHY_THRESHOLD) {
            return HEALTH_UNHEALTHY;
        } else {
            return HEALTH_WITHERED;
        }
    }

    return (
        <div className={styles.earthContainer}>
            <img
                src={getEarthImage()}
                alt={`Earth-${getEarthHealthStatus()}`}
                className={styles.earthImage}
                onClick={onClick}
            ></img>
        </div>
    );
};