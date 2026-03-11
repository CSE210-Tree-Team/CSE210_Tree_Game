/*
useWaterGameQuestions Hook

A custom React hook that fetches water game questions from the server
and manages the loading and error states during the fetch lifecycle.
Returns the fetched questions, a loading flag, and an error message if the fetch fails.
*/

import { useState, useEffect } from "react";
import { fetchQuestions, AuthenticationError, handle401Error } from "../../ServerCalls/ServerCalls";
import type { Question } from "../../ServerCalls/ServerCalls";
import { NUM_QUESTIONS } from "../constants";


interface UseWaterGameQuestionsResult {
  questions: Question[];
  isLoading: boolean;
  error: string | null;
}

export const useWaterGameQuestions = (): UseWaterGameQuestionsResult => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const fetched = await fetchQuestions(NUM_QUESTIONS, "Water", "MCQ");
        setQuestions(fetched);
      } catch (error) {
        if (error instanceof AuthenticationError) {
          handle401Error();
        } else {
          setError("Failed to load questions. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestions();
  }, []);

  return { questions, isLoading, error };
};
