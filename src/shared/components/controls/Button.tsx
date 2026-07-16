import React from "react"

interface ButtonProps {
  label?: string
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function Button({
  label,
  onClick,
  type = "button",
  disabled = false,
  className,
  style,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
    >
      {children || label}
    </button>
  )
}