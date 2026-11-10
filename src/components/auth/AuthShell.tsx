import { PHOTOS, photoUrl } from "@/lib/photos";
import { reveal } from "@/components/motion/revealProps";
import { Sticker } from "@/components/motion/Sticker";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl animate-page-in items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden lg:block">
        <div className="relative h-[560px] overflow-hidden rounded-[2.5rem] bg-brand-950 text-white shadow-lift">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(PHOTOS.thali, 1000, 1200)} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/50 to-brand-900/10" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="eyebrow !text-gold-300">IIM Sambalpur · Mess &amp; Canteen</p>
            <h2 className="display mt-3 text-5xl">The mess canteen, on your phone.</h2>
            <p className="mt-4 max-w-md text-white/80">
              Order ahead, get a token, and collect when it&apos;s ready. Mess staff keep the kitchen stocked from the same app.
            </p>
          </div>
        </div>
        <div
          {...reveal("right", 200)}
          className="absolute -right-6 top-10 w-36 rotate-6 overflow-hidden rounded-3xl border-4 border-cream-50 shadow-lift"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(PHOTOS.roti, 300, 300)} alt={PHOTOS.roti.alt} className="aspect-square w-full object-cover" />
        </div>
        <Sticker
          className="absolute -left-6 -top-6"
          center={<span className="font-display text-3xl font-extrabold">Hi!</span>}
        />
      </div>
      <div className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <h1 className="display text-4xl text-ink">{title}</h1>
        <p className="mb-7 mt-2 text-sm text-zinc-500">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
