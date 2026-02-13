import styles from "./Bucket.module.css";

export type BucketProps = {
  x: number;
};

export default function Bucket({ x }: BucketProps) {
  return (
    <img
      src="/bucket.svg"
      alt="Bucket"
      className={styles.bucket}
      style={{ left: x }}
    />
  );
}
