/*
Popup component

This module contains the Popup component, which is a reusable component used in the 
start, tutorial, and end screens of the minigames. It renders a styled popup 
element that displays a header, optional title, instructions, and a button.

Props:
- variant: Determines the styling of the popup according to the minigame (e.g., "water" or "soil").
- screen: Determines the content to display based on the current screen ("start", "tutorial", "end").
- header: The main header text to display in the popup.
- buttonText: The text to display on the button (optional).
- onClick: A callback function that is called when the button is clicked (optional).
- className: Additional CSS classes to apply to the popup (optional).
- title: A title to display on the start screen. (optional)
- textList: A list of instructions to display on the tutorial and end screens. (optional)
*/

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
