import { RAINDROP_HEIGHT, RAINDROP_WIDTH, BUCKET_WIDTH } from "../constants";

export const checkCollision = (
  dropX: number,
  dropY: number,
  bucketX: number,
  bucketTop: number,
): boolean => {
  const raindropRight = dropX + RAINDROP_WIDTH;
  const bucketRight = bucketX + BUCKET_WIDTH;

  const horizontalOverlap = dropX < bucketRight && raindropRight > bucketX;
  const verticalOverlap = dropY + RAINDROP_HEIGHT >= bucketTop;

  return horizontalOverlap && verticalOverlap;
};
