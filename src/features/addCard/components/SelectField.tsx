import { Select } from "../../../shared/components/controls/Select";

interface SelectFieldProps {
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onChange: (value: string) => void;
  error?: string;
}

export function SelectField({
  label,
  value,
  items,
  onChange,
  error,
}: SelectFieldProps) {
  return (
    <div>
      <Select label={label} value={value} items={items} onChange={onChange} />
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
