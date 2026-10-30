export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="font-condensed text-3xl font-bold">{title}</h1>
      {children}
    </header>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-ibl/50 bg-ibl/10 px-3 py-2 text-sm">
      {message}. Check that the backend is running on port 8000, then load the seed data.
    </p>
  );
}
