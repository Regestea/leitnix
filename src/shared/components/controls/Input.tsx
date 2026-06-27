import { useState } from "react"

interface InputProps {
  label?: string
  placeholder?: string
  defaultValue?: string
  onChange?: (value: string) => void
  id?: string
  disabled?: boolean
  type?: "text" | "password" | "email" | "number" | "search" | "url" | "tel"
  className?: string
  style?: React.CSSProperties
  containerClassName?: string
  containerStyle?: React.CSSProperties
  labelClassName?: string
  labelStyle?: React.CSSProperties
}

export function Input({
  label,
  placeholder,
  defaultValue = "",
  onChange,
  id,
  disabled = false,
  type = "text",
  className,
  style,
  containerClassName,
  containerStyle,
  labelClassName,
  labelStyle,
}: InputProps) {
  const [value, setValue] = useState(defaultValue)
  const inputId = id ?? (label
    ? `input-${label.toLowerCase().replace(/\s+/g, "-")}`
    : undefined)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className={`settings-field ${containerClassName ?? ""}`} style={containerStyle}>
      {label && (
        <label htmlFor={inputId} className={`settings-label ${labelClassName ?? ""}`} style={labelStyle}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
        className={className}
        style={style}
      />
    </div>
  )
}