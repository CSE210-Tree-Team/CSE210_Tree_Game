/*
Button component

This module contains the Button component, which is a reusable component used throughout 
the client-side application. It renders a styled button element that can be used in 
various screens of the application.

The Button component accepts the following props:
- variant: Determines the styling of the button according to the minigame(e.g., "water" or "soil").
- disabled: If true, the button is disabled and cannot be interacted with.
- onClick: A callback function that is called when the button is clicked.
- className: Additional CSS classes to apply to the button.
- label: The text to display on the button.
- type: The HTML button type attribute (e.g., "button", "submit", "reset").
*/

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
