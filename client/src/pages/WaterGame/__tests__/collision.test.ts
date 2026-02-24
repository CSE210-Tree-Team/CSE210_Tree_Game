/*
Unit Tests for the checkCollision Function

This module contains unit tests for the checkCollision function, which determines
whether a falling raindrop has collided with the bucket. Tests cover full overlap,
partial overlaps from both sides, misses to the left and right, vertical boundary
conditions, and exact edge cases at the bucket's boundaries.
*/

import { describe, it, expect } from "vitest";
import { checkCollision } from "../collision";
import { BUCKET_WIDTH } from "../constants";

describe("checkCollision", () => {
  // dropX=100, bucketX=100: raindropRight=196, bucketRight=240 → full overlap
  it("detects collision when raindrop fully overlaps with bucket", () => {
    expect(checkCollision(100, 800, 100, 750)).toBe(true);
  });

  // dropX=50, bucketX=100: raindropRight=146, bucketRight=240 → partial left overlap
  it("detects collision when raindrop partially overlaps bucket from the left", () => {
    expect(checkCollision(50, 800, 100, 750)).toBe(true);
  });

  // dropX=200, bucketX=100: raindropRight=296, bucketRight=240 → partial right overlap
  it("detects collision when raindrop partially overlaps bucket from the right", () => {
    expect(checkCollision(200, 800, 100, 750)).toBe(true);
  });

  // dropX=0, bucketX=200: raindropRight=96, bucketRight=340 → raindrop entirely left of bucket
  it("no collision when raindrop is entirely to the left of bucket", () => {
    expect(checkCollision(0, 800, 200, 750)).toBe(false);
  });

  // dropX=400, bucketX=100: raindropRight=496, bucketRight=240 → raindrop entirely right of bucket
  it("no collision when raindrop is entirely to the right of bucket", () => {
    expect(checkCollision(400, 800, 100, 750)).toBe(false);
  });

  // dropX=100, dropY=100: dropY + RAINDROP_HEIGHT=228, bucketTop=750 → raindrop too high
  it("no collision when raindrop has not reached bucket height", () => {
    expect(checkCollision(100, 100, 100, 750)).toBe(false);
  });

  // dropX=0, dropY=800, bucketX=200: no horizontal overlap despite vertical overlap
  it("no collision when raindrop is at bucket height but has no horizontal overlap", () => {
    expect(checkCollision(0, 800, 200, 750)).toBe(false);
  });

  // dropX=100, dropY=622: dropY + RAINDROP_HEIGHT=750 → exactly at bucketTop boundary
  it("detects collision when raindrop bottom is exactly at bucket top boundary", () => {
    expect(checkCollision(100, 622, 100, 750)).toBe(true);
  });

  // dropX=bucketX + BUCKET_WIDTH: raindropRight=236, bucketRight=240 → just inside right edge
  it("detects collision when raindrop is just inside the right edge of bucket", () => {
    expect(checkCollision(BUCKET_WIDTH - 1, 800, 0, 750)).toBe(true);
  });

  // dropX=BUCKET_WIDTH: raindropRight=236, bucketRight=140 → just outside right edge
  it("no collision when raindrop is just outside the right edge of bucket", () => {
    expect(checkCollision(BUCKET_WIDTH, 800, 0, 750)).toBe(false);
  });
});
