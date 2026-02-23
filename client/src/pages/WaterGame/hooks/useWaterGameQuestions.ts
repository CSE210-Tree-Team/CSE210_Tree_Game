import { useState, useEffect } from "react";
import { fetchQuestions } from "../../ServerCalls/ServerCalls";
import type { WaterQuestion } from "../../ServerCalls/ServerCalls";
import { NUM_QUESTIONS } from "../constants";

interface UseWaterGameQuestionsResult {
  questions: WaterQuestion[];
  isLoading: boolean;
  error: string | null;
}

export const useWaterGameQuestions = (): UseWaterGameQuestionsResult => {
  const [questions, setQuestions] = useState<WaterQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetched = await fetchQuestions("Water", NUM_QUESTIONS, "MCQ");
        console.log("fetched questions:", fetched);
        setQuestions(fetched);
      } catch {
        setError("Failed to load questions. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  return { questions, isLoading, error };
};
