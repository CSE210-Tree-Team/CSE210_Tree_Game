import {
  pushGameResults,
  AuthenticationError,
  handle401Error,
} from "../../ServerCalls/ServerCalls";

export const submitGameResults = async (score: number, gameType: string) => {
  try {
    await pushGameResults(score, gameType);
    window.location.href = "/";
  } catch (error) {
    if (error instanceof AuthenticationError) {
      handle401Error();
    } else {
      console.error(`Failed to update ${gameType} resource.`);
      window.location.href = "/";
    }
  }
};
