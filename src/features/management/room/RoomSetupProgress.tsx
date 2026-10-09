export type RoomSetupStep = "basics" | "owners" | "schedule" | "qr";

const steps: Array<{ value: RoomSetupStep; label: string; description: string }> = [
  { value: "basics", label: "Əsas məlumatlar", description: "Otağın adı və iş rejimi" },
  { value: "owners", label: "Otaq sahibləri", description: "İdarəetmə icazələri" },
  { value: "schedule", label: "İş qrafiki", description: "Avtomatik açıq və bağlı saatlar" },
  { value: "qr", label: "QR və tamamla", description: "Giriş kodu və yekun yaratma" },
];

export function RoomSetupProgress({ currentStep, completed = [], onStepChange, disabled = false }: {
  currentStep: RoomSetupStep;
  completed?: RoomSetupStep[];
  onStepChange?: (step: RoomSetupStep) => void;
  disabled?: boolean;
}) {

  return (
    <section className="room-setup-progress" aria-labelledby="room-setup-progress-title">
      <div className="room-setup-progress__intro">
        <p className="eyebrow">Mərhələli qurulum</p>
        <h2 id="room-setup-progress-title">Otağınızı addım-addım hazırlayın</h2>
        <p>Hər mərhələdə “Saxla və davam et” ilə dəyişiklikləri təsdiqləyin. Saxlanmış məlumatlara istənilən vaxt qayıda bilərsiniz.</p>
      </div>
      <ol>
        {steps.map((step, index) => {
          const state = step.value === currentStep ? "current" : completed.includes(step.value) ? "complete" : "upcoming";
          return (
            <li className={`room-setup-progress__step room-setup-progress__step--${state}`} key={step.value} aria-current={state === "current" ? "step" : undefined}>
              <button type="button" disabled={disabled || !onStepChange} onClick={() => onStepChange?.(step.value)} aria-current={state === "current" ? "step" : undefined}>
                <span aria-hidden="true">{completed.includes(step.value) && state !== "current" ? "✓" : index + 1}</span>
                <div><strong>{step.label}</strong><small>{step.description}</small></div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
