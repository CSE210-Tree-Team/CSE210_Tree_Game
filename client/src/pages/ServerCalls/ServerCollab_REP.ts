
/**
 * Fetches questions list from Server.
 * @returns 
 */
export async function fetchQuestions(): Promise</** TODO: Specify list type*/[]> {
    const response = await fetch('/api/get-questions'); // TODO: Create a separate endpoint for soil game questions
    if (!response.ok) {
        throw new Error('Failed to fetch questions');
    }
    const raw: /** TODO: Specify type */ = /** TODO: Specify response conversion (May be unnecessary) */;

    return /** TODO: */;
}

/**
 * Pushes the game results to server (increments Tree's health).
 * @param progress: Game result, increments the respective health bar on Homepage.
 * @param gameType: String specifiying the health bar to inrement.
 * @returns
 */
export async function pushGameResults(progress: number, gameType: string): Promise<boolean> {
    /** TODO: 
     * Push progress to fill soil or water metric 
     * Note: I've specified the input args, but feel free to alter them
     */
    return /** TODO: */;
}

