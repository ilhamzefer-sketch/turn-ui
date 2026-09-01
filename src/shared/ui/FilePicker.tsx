import { useId } from "react";

type FilePickerProps = {
  accept?: string;
  disabled?: boolean;
  file: File | null;
  id?: string;
  onChange: (file: File | null) => void;
};

export function FilePicker({ accept, disabled = false, file, id, onChange }: FilePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="file-picker">
      <input
        id={inputId}
        className="file-picker__input"
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <label className="button button--secondary file-picker__button" htmlFor={inputId}>
        Fayl seçin
      </label>
      <span className="file-picker__name" aria-live="polite">
        {file?.name ?? "Fayl seçilməyib"}
      </span>
    </div>
  );
}
