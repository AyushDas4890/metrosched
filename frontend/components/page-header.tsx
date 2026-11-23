export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="display font-condensed text-4xl font-bold md:text-5xl">{title}</h1>
      {children}
    </header>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-lg border border-ibl/50 bg-ibl/10 px-3 py-2 text-sm text-ibl-ink">
      {message}. The planning server is not answering. Ask IT to start it (port 8000), then reload this page.
    </p>
  );
}
