import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchQuestions, pushGameResults } from "../ServerCalls";

describe("fetchQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockQuestions = [
    {
      questionID: "q1",
      difficulty: 1,
      resourceType: "Sun",
      text: "What is the powerhouse of the cell?",
      type: "MCQ",
      choices: [
        { text: "The mitochondria", isCorrect: true },
        { text: "The nucleus", isCorrect: false },
        { text: "The ribosome", isCorrect: false },
        { text: "The endoplasmic reticulum", isCorrect: false },
      ],
    },
    {
      questionID: "q2",
      difficulty: 1,
      resourceType: "Water",
      text: "What is H2O?",
      type: "MCQ",
      choices: [
        { text: "Hydrogen Peroxide", isCorrect: false },
        { text: "Water", isCorrect: true },
        { text: "Hydrochloric Acid", isCorrect: false },
        { text: "Heavy Water", isCorrect: false },
      ],
    },
  ];

  it("fetches questions successfully", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        count: 1,
        questions: mockQuestions,
      }),
    } as any);

    const result = await fetchQuestions();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/get-questions",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(result).toEqual(mockQuestions);
    expect(result[0].resourceType).toBe("Sun");
    expect(result[0]).toHaveProperty("choices");
  });

  it("throws if response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    await expect(fetchQuestions(undefined, "water")).rejects.toThrow(
      "Failed to fetch questions"
    );
  });

  it("throws if server returns unsuccessful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        count: 0,
        questions: [],
      }),
    } as any);

    await expect(fetchQuestions(undefined, "water")).rejects.toThrow(
      "Server returned unsuccessful response"
    );
  });

  it("sends optional parameters correctly", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        count: 0,
        questions: [],
      }),
    } as any);

    await fetchQuestions(5, "Water", "MCQ", 2);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/get-questions",
      expect.objectContaining({
        body: JSON.stringify({
          numQuestions: 5,
          resourceType: "Water",
          questionType: "MCQ",
          difficulty: 2,
        }),
      })
    );
  });
});

describe("pushGameResults", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully updates stat", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Updated",
      }),
    } as any);

    const result = await pushGameResults(10, "Water");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/update-stat",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(result).toBe(true);
  });

  it("throws if invalid gameType is provided", async () => {
    await expect(
      pushGameResults(10, "invalid" as any)
    ).rejects.toThrow("Invalid gameType");
  });

  it("throws if response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      statusText: "Server Error",
    } as any);

    await expect(pushGameResults(10, "Water")).rejects.toThrow(
      "Failed to update stat"
    );
  });

  it("returns false if server reports failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        message: "Failed",
      }),
    } as any);

    const result = await pushGameResults(5, "Earth");
    expect(result).toBe(false);
  });
});
