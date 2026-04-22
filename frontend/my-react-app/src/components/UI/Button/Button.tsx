import React from "react";
import { Link } from "react-router-dom";
import styles from "./Button.module.css";

type Variant = "primary" | "secondary" | "danger";
type Size = "small" | "medium" | "large";

type BaseProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<
    HTMLButtonElement | HTMLAnchorElement
  >;
  variant?: Variant;
  size?: Size;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
};

type ButtonAsButton = BaseProps & {
  to?: undefined;
  href?: undefined;
  type?: "button" | "submit" | "reset";
};

type ButtonAsLink = BaseProps & {
  to: string;
  href?: undefined;
};

type ButtonAsAnchor = BaseProps & {
  href: string;
  to?: undefined;
  target?: string;
  rel?: string;
};

type Props = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const Button: React.FC<Props> = (props) => {
  const {
    children,
    onClick,
    variant = "primary",
    size = "medium",
    className = "",
    style,
    disabled,
  } = props;

  const classes = `${styles.button} ${styles[variant]} ${styles[size]} ${className}`;

  if ("to" in props && props.to) {
    return (
      <Link
        to={props.to}
        className={classes}
        onClick={onClick}
        style={style}
      >
        {children}
      </Link>
    );
  }

  // external link
  if ("href" in props && props.href) {
    return (
      <a
        href={props.href}
        className={classes}
        onClick={onClick}
        style={style}
        target={props.target}
        rel={props.rel}
      >
        {children}
      </a>
    );
  }

  // button
  const type = "type" in props ? props.type : "button";

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      style={style}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
