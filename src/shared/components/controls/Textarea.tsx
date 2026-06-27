import { useState } from "react"

interface TextareaProps {
  label?: string
  placeholder?: string
  defaultValue?: string
  onChange?: (value: string) => void
  id?: string
  disabled?: boolean
  rows?: number
  cols?: number
  className?: string
  style?: React.CSSProperties
  containerClassName?: string
  containerStyle?: React.CSSProperties
  labelClassName?: string
  labelStyle?: React.CSSProperties
}

export function Textarea({
  label,
  placeholder,
  defaultValue = "",
  onChange,
  id,
  disabled = false,
  rows = 4,
  cols,
  className,
  style,
  containerClassName,
  containerStyle,
  labelClassName,
  labelStyle,
}: TextareaProps) {
  const [value, setValue] = useState(defaultValue)
  const textareaId = id ?? (label
    ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
    : undefined)

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    onChange?.(e.target.value)
  }

  return (
    <div className={`settings-field ${containerClassName ?? ""}`} style={containerStyle}>
      {label && (
        <label htmlFor={textareaId} className={`settings-label ${labelClassName ?? ""}`} style={labelStyle}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
        rows={rows}
        cols={cols}
        className={className}
        style={style}
      />
    </div>
  )
}