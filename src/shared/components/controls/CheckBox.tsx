import { useState } from "react"

interface CheckboxProps {
  label: string
  defaultChecked?: boolean
  onChange?: (checked: boolean) => void
  id?: string
  disabled?: boolean
}

export function Checkbox({
  label,
  defaultChecked = false,
  onChange,
  id,
  disabled = false,
}: CheckboxProps) {
  const [checked, setChecked] = useState(defaultChecked)
  const checkboxId = id ?? `checkbox-${label.toLowerCase().replace(/\s+/g, "-")}`

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setChecked(e.target.checked)
    onChange?.(e.target.checked)
  }

  return (
    <div>
      <label htmlFor={checkboxId}>
        {label}
      </label>
      <br/>
      <input
        id={checkboxId}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}