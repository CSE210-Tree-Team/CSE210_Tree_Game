import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchQuestions, pushGameResults } from "../ServerCalls";

describe("fetchQuestions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockWaterQuestions = [
    {
      questionID: "1",
      difficulty: 1,
      resourceType: "water",
      text: "What is H2O?",
      type: "mcq",
      choices: [
        { text: "Water", isCorrect: true },
        { text: "Oxygen", isCorrect: false },
      ],
    },
  ];

  const mockEarthQuestions = [
    {
      questionID: "2",
      difficulty: 2,
      resourceType: "earth",
      moleculeName: "Water",
      moleculeFormula: "H2O",
      required: { H: 2, O: 1 },
    },
  ];

  it("fetches water questions successfully", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        count: 1,
        questions: mockWaterQuestions,
      }),
    } as any);

    const result = await fetchQuestions("water");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/get-questions",
      expect.objectContaining({
        method: "POST",
      })
    );

    expect(result).toEqual(mockWaterQuestions);
    expect(result[0].resourceType).toBe("water");
    expect(result[0]).toHaveProperty("choices");
  });

  it("fetches earth questions successfully", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        count: 1,
        questions: mockEarthQuestions,
      }),
    } as any);

    const result = await fetchQuestions("earth");

    expect(result).toEqual(mockEarthQuestions);
    expect(result[0].resourceType).toBe("earth");
    expect(result[0]).toHaveProperty("moleculeFormula");
  });

  it("throws if response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as any);

    await expect(fetchQuestions("water")).rejects.toThrow(
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

    await expect(fetchQuestions("water")).rejects.toThrow(
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

    await fetchQuestions("water", 5, "mcq", 2);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/get-questions",
      expect.objectContaining({
        body: JSON.stringify({
          numQuestions: 5,
          resourceType: "water",
          questionType: "mcq",
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

    const result = await pushGameResults(10, "water");

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

    await expect(pushGameResults(10, "water")).rejects.toThrow(
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

    const result = await pushGameResults(5, "earth");
    expect(result).toBe(false);
  });
});