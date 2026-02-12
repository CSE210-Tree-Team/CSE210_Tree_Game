import styles from "./homepage.module.css"
interface EarthProps {
    earth: number;
    onClick: () => void;
}

export const Earth = ({ earth, onClick }: EarthProps) => {
    const getEarthImage = () => {
        let avgEarth = "";
        if (earth >= 75) {
            avgEarth = "/assets/soil_health.png";
        } else if (earth >= 45) {
            avgEarth = "/assets/soil_typical.png";
        } else {
            avgEarth = "/assets/soil_dry.png";
        }
        return avgEarth;
    };

    return (
        <div className={styles.earthContainer}>
            <img
                src={getEarthImage()}
                alt="Earth"
                className={styles.earthImage}
                onClick={onClick}
            ></img>
        </div>
    );
};