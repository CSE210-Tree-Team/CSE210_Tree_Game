/*
Unit Tests for the checkCollision function

This module contains unit tests for the checkCollision function, which
determines whether a raindrop has collided with the bucket based on their
horizontal and vertical positions.
*/

import { describe, it, expect } from "vitest";
import { checkCollision } from "../collision";
import { RAINDROP_HEIGHT, RAINDROP_WIDTH, BUCKET_WIDTH } from "../../constants";

// Bucket positioned at x=200, bucketTop=600
const BUCKET_X = 200;
const BUCKET_TOP = 600;

describe("checkCollision", () => {
  it("returns true when raindrop is directly above the bucket", () => {
    // Raindrop centered over bucket, bottom edge touching bucketTop
    const dropX = BUCKET_X + BUCKET_WIDTH / 2 - RAINDROP_WIDTH / 2;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(true);
  });

  it("returns true when raindrop overlaps the left edge of the bucket", () => {
    // Raindrop partially overlapping the left side of the bucket
    const dropX = BUCKET_X - RAINDROP_WIDTH + 1;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(true);
  });

  it("returns true when raindrop overlaps the right edge of the bucket", () => {
    // Raindrop partially overlapping the right side of the bucket
    const dropX = BUCKET_X + BUCKET_WIDTH - 1;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(true);
  });

  it("returns false when raindrop is completely to the left of the bucket", () => {
    const dropX = BUCKET_X - RAINDROP_WIDTH - 1;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(false);
  });

  it("returns false when raindrop is completely to the right of the bucket", () => {
    const dropX = BUCKET_X + BUCKET_WIDTH + 1;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(false);
  });

  it("returns false when raindrop has not reached the bucket vertically", () => {
    // Raindrop centered over bucket but above bucketTop
    const dropX = BUCKET_X + BUCKET_WIDTH / 2 - RAINDROP_WIDTH / 2;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT - 1;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(false);
  });

  it("returns true when raindrop bottom edge exactly meets bucketTop", () => {
    // dropY + RAINDROP_HEIGHT === bucketTop
    const dropX = BUCKET_X + BUCKET_WIDTH / 2 - RAINDROP_WIDTH / 2;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(true);
  });

  it("returns false when raindrop is horizontally aligned but above bucket", () => {
    const dropX = BUCKET_X;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT - 10;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(false);
  });

  it("returns false when raindrop is vertically aligned but beside bucket", () => {
    const dropX = BUCKET_X - RAINDROP_WIDTH - 10;
    const dropY = BUCKET_TOP - RAINDROP_HEIGHT;

    expect(checkCollision(dropX, dropY, BUCKET_X, BUCKET_TOP)).toBe(false);
  });
});
