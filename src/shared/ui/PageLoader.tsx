type PageLoaderProps = {
  label: string;
};

export function PageLoader({ label }: PageLoaderProps) {
  return (
    <main className="page-loader" aria-busy="true" aria-live="polite">
      <span className="page-loader__mark" aria-hidden="true" />
      <p>{label}</p>
    </main>
  );
}
