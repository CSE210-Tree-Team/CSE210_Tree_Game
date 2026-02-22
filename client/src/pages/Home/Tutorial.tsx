import { Popup } from "../../components/Popup"
import { useState } from "react"
import styles from "./popup.module.css"

interface TutorialProps {
    onClose: () => void;
}

function Tutorial({ onClose }: TutorialProps) {
    const [currentPage, setCurrentPage] = useState<"end" | "tutorial">("tutorial");
    return (
        <>
            {currentPage === "tutorial" && (
                <div className={`${styles.overlay}`}>
                <Popup
                    variant="grass"
                    screen="tutorial"
                        header="Welcome to Bristlecone"
                        buttonText="Next"
                        onClick={() => { setCurrentPage("end") }}
                    textList={[
                        "Care for your own virtual tree and help it thrive",
                        "Your tree experiences time, so you must consistently upkeep it to prevent it from decaying",
                        "Goal: Maintain 2 vital resources -- Water and Soil",
                    ]}
                />
            </div>
            )}

            {currentPage === "end" && (
                <div className={styles.overlay}>
                    <Popup
                        variant="grass"
                        screen="end"
                        header="How To Play:"
                        buttonText="I'm Ready"
                        onClick={() => { onClose() }}
                        textList={[
                            "Click the watering can  to play the Rain Minigame and fill up your water status bar",
                            "Click the soil underneath the tree to play the Soil Minigame and gather nutrients to fertilize your plant",
                            "Keep a close eye on your resource bar -- if they run empty, your tree will wither and die!",
                        ]}
                    />
                </div>
            )}
        </>
    )
}

export default Tutorial;