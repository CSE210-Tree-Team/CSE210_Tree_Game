import styles from "./Bucket.module.css";

export type BucketProps = {
  x: number;
} & React.ImgHTMLAttributes<HTMLImageElement>;

export default function Bucket({ x, ...props }: BucketProps) {
  return (
    <img
      src="/bucket.svg"
      alt="Bucket"
      className={styles.bucket}
      style={{ left: x }}
      {...props}
    />
  );
}
