type ArrowIconProps = {
  direction?: "right" | "left";
};

export function ArrowIcon({ direction = "right" }: ArrowIconProps) {
  return (
    <svg
      className={`icon icon--${direction}`}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      aria-hidden="true"
    >
      <path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}
