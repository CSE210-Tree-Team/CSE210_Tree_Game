import { type Resources } from "./Resources";
import styles from "./homepage.module.css"
import fontStyles from "./Popup.module.css"


interface ResourceBoardProps {
    resources: Resources;
}

export const ResourceBoard = ({ resources }: ResourceBoardProps) => {
    return (
        <div className={ styles.resourceBoardContainer}>
            <img
                src="assets/board2.png"
                alt="Resource Board Background"
                className={ styles.resourceBoardBg}
            />
            <div className={styles.resourceBoardContent}>
                <h3 className={` ${fontStyles.text} ${styles.resourceBoardTitle}`}>Growth Progress</h3>

                {/* Water */}
                <div className={styles.resourceItem}>
                    <img
                        src="/assets/water_icon.png"
                        alt="Water Resource Icon"
                        className={ styles.resourceIcon}
                    />
                    <div className={styles.resourceRight}>
                        <span className={` ${fontStyles.text} ${styles.resourceLabel}`}>Water</span>
                        <div className={styles.progressBarWrapper}>
                        <div className={styles.progressBarContainer}>
                            <div
                                className={`${styles.progressBar} ${styles.waterBar}`}
                                style={{ width: `${resources.water}%` }}
                            ></div>
                            </div>
                        </div>
                    </div>
                    <span className={styles.resourceValue}>{resources.water}%</span>
                </div>


                { /* Earth */}
                <div className={styles.resourceItem}>
                    <img
                        src="/assets/earth_icon.png"
                        alt="Earth Resource Icon"
                        className={styles.resourceIcon}
                    />
                    <div className={styles.resourceRight}>
                        <span className={styles.resourceLabel}>Earth</span>
                        <div className={styles.progressBarWrapper}>
                            <div className={styles.progressBarContainer}>
                                <div
                                    className={`${styles.progressBar} ${styles.earthBar}`}
                                    style={{ width: `${resources.earth}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <span className={styles.resourceValue}>{resources.earth}%</span>
                </div>

                { /* Sun */}
                <div className={styles.resourceItem}>
                    <img
                        src="/assets/sun_icon.png"
                        alt="Sun Resource Icon"
                        className={styles.resourceIcon}
                    />
                    <div className={styles.resourceRight}>
                        <span className={styles.resourceLabel}>Sun</span>
                        <div className={styles.progressBarWrapper}>
                            <div className={styles.progressBarContainer}>
                                <div
                                    className={`${styles.progressBar} ${styles.sunBar}`}
                                    style={{ width: `${resources.sun}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                    <span className={styles.resourceValue}>{resources.sun}%</span>
                </div>

            </div>

        </div>
    );
};