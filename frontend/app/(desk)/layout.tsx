import { Sidebar } from "@/components/sidebar";

export default function DeskLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main id="main" className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-8">
        <p
          role="note"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-standby/40 bg-standby/10 px-3 py-1 text-sm text-standby-ink"
        >
          <span aria-hidden="true">●</span>
          All train data shown here is synthetic. It does not reflect real KMRL operations.
        </p>
        {children}
      </main>
    </div>
  );
}
