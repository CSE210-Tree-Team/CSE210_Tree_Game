/*
useWaterGameQuestions Hook

A custom React hook that fetches water game questions from the server
and manages the loading and error states during the fetch lifecycle.
Returns the fetched questions, a loading flag, and an error message if the fetch fails.
*/

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
