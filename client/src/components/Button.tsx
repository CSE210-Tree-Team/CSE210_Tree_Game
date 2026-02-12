import styles from "./Button.module.css";

export type ButtonProps = {
  variant: "water" | "soil";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  label: string;
  type?: "button" | "submit" | "reset";
};

export const Button = ({
  variant,
  disabled = false,
  onClick,
  className,
  label,
  type = "button",
}: ButtonProps) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${className ?? ""}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      type={type}
    >
      {label}
    </button>
  );
};
