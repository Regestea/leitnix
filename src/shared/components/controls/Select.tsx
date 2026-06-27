
interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface SelectGroup<T extends string = string> {
  group: string
  options: SelectOption<T>[]
}

type SelectItems<T extends string = string> =
  | SelectOption<T>[]
  | SelectGroup<T>[]

interface SelectProps<T extends string = string> {
  label: string
  value: T
  items: SelectItems<T>
  onChange: (value: T) => void
  id?: string
}

function isGrouped<T extends string>(
  items: SelectItems<T>
): items is SelectGroup<T>[] {
  return items.length > 0 && "group" in items[0]
}

export function Select<T extends string = string>({
  label,
  value,
  items,
  onChange,
  id,
}: SelectProps<T>) {
  const selectId = id ?? `select-${label.toLowerCase().replace(/\s+/g, "-")}`

  return (
    <div className="settings-field">
      <label htmlFor={selectId} className="settings-label">
        {label}
      </label>
      <select
        id={selectId}
        className="custom-select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {isGrouped(items)
          ? items.map(({ group, options }) => (
              <optgroup key={group} label={group}>
                {options.map(({ value: v, label: l }) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </optgroup>
            ))
          : items.map(({ value: v, label: l }) => (
              <option key={v} value={v}>{l}</option>
            ))}
      </select>
    </div>
  )
}