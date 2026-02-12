import styles from "./Popup.module.css";
import { Button } from "./Button";

export type PopupProps = {
  variant: "soil" | "water";
  screen: "start" | "tutorial" | "end";
  header: string;
  buttonText?: string;
  onClick?: () => void;
  className?: string;
  title?: string;
  textList?: string[];
};

export const Popup = ({
  variant,
  screen,
  header,
  buttonText,
  className,
  onClick,
  title,
  textList,
}: PopupProps) => {
  return (
    <div className={`${styles.popup} ${styles[variant]} ${className ?? ""}`}>
      <h2>{header}</h2>
      {screen === "start" ? (
        variant === "water" ? (
          <h1 className={styles.title}>{title}</h1>
        ) : variant === "soil" ? (
          <h1 className={styles.title}>{title}</h1>
        ) : null
      ) : screen === "tutorial" || screen === "end" ? (
        <ul className={styles.text}>
          {textList?.map((listItem, index) => (
            <li key={index}>{listItem}</li>
          ))}
        </ul>
      ) : null}
      {buttonText ? (
        <Button variant={variant} label={buttonText} onClick={onClick} />
      ) : null}
    </div>
  );
};
