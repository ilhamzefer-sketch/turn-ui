import { defaultFieldInfo } from "./fieldInfo";

type FieldLabelProps = {
  htmlFor: string;
  label: string;
  info?: string;
  infoId: string;
};

export function FieldLabel({ htmlFor, label, info, infoId }: FieldLabelProps) {
  const message = info?.trim() || defaultFieldInfo(label);

  return (
    <div className="field__label-row">
      <label className="field__label" htmlFor={htmlFor}>{label}</label>
      <span className="field__info">
        <button
          className="field__info-trigger"
          type="button"
          aria-label={`${label} haqqında məlumat`}
          aria-describedby={infoId}
        >
          i
        </button>
        <span className="field__info-tooltip" id={infoId} role="tooltip">{message}</span>
      </span>
    </div>
  );
}
