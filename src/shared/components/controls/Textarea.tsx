import { useState, forwardRef } from "react";

interface TextareaProps {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  id?: string;
  disabled?: boolean;
  rows?: number;
  cols?: number;
  className?: string;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    placeholder,
    defaultValue = "",
    value: controlledValue,
    onChange,
    onKeyDown,
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
  }: TextareaProps,
  ref,
) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;
  const textareaId =
    id ??
    (label
      ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
      : undefined);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (!isControlled) setInternalValue(e.target.value);
    onChange?.(e.target.value);
  }

  return (
    <div
      className={`settings-field ${containerClassName ?? ""}`}
      style={{ width: '100%', ...containerStyle }}
    >
      {label && (
        <>
          {" "}
          <label
            htmlFor={textareaId}
            className={`settings-label ${labelClassName ?? ""}`}
            style={labelStyle}
          >
            {label}
          </label>
          <br />
        </>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        disabled={disabled}
        rows={rows}
        cols={cols}
        className={`glass-textarea ${className ?? ""}`}
        style={style}
      />
    </div>
  );
});
