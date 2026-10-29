export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2">
      <div className="hidden lg:block">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-700 via-brand-600 to-orange-500 p-10 text-white shadow-card">
          <p className="text-6xl">🍜☕🥪</p>
          <h2 className="mt-6 text-3xl font-extrabold leading-tight">The IIM Sambalpur mess canteen, on your phone.</h2>
          <p className="mt-3 text-white/85">
            Order ahead, get a token, and collect when it&apos;s ready. Mess staff keep the kitchen stocked from the same app.
          </p>
        </div>
      </div>
      <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
