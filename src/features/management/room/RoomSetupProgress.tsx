export type RoomSetupStep = "basics" | "owners" | "schedule" | "qr";

const steps: Array<{ value: RoomSetupStep; label: string; description: string }> = [
  { value: "basics", label: "Əsas məlumatlar", description: "Otağın adı və iş rejimi" },
  { value: "owners", label: "Otaq sahibləri", description: "İdarəetmə icazələri" },
  { value: "schedule", label: "İş qrafiki", description: "Avtomatik açıq və bağlı saatlar" },
  { value: "qr", label: "QR və tamamla", description: "Giriş kodu və yekun yaratma" },
];

export function RoomSetupProgress({ currentStep }: { currentStep: RoomSetupStep }) {
  const currentIndex = steps.findIndex((step) => step.value === currentStep);

  return (
    <section className="room-setup-progress" aria-labelledby="room-setup-progress-title">
      <div className="room-setup-progress__intro">
        <p className="eyebrow">Mərhələli qurulum</p>
        <h2 id="room-setup-progress-title">Otağınızı addım-addım hazırlayın</h2>
        <p>Məlumatlar hər mərhələdə saxlanılır. Qurulumu yarımçıq saxlasanız, qaldığınız yerdən davam edə bilərsiniz.</p>
      </div>
      <ol>
        {steps.map((step, index) => {
          const state = index < currentIndex ? "complete" : index === currentIndex ? "current" : "upcoming";
          return (
            <li className={`room-setup-progress__step room-setup-progress__step--${state}`} key={step.value} aria-current={state === "current" ? "step" : undefined}>
              <span aria-hidden="true">{state === "complete" ? "✓" : index + 1}</span>
              <div><strong>{step.label}</strong><small>{step.description}</small></div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
