import { PHOTOS, photoUrl } from "@/lib/photos";
import { reveal } from "@/components/motion/revealProps";
import { Sticker } from "@/components/motion/Sticker";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl animate-page-in items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden lg:block">
        <div className="relative h-[580px] overflow-hidden rounded-[2.5rem] border-2 border-ink bg-brand-600 text-white shadow-hard-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl(PHOTOS.thali, 1000, 1200)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-700 via-brand-600/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-10">
            <p className="scribble text-3xl text-gold-300">late night cravings, sorted</p>
            <h2 className="display mt-2 text-7xl">Good food. Good mood.</h2>
            <p className="mt-4 max-w-md font-medium text-white/85">
              Order ahead, get a token, and collect when it&apos;s ready, or get it sent to your hostel room.
            </p>
          </div>
        </div>
        {[
          { photo: PHOTOS.samosa, emoji: "🍜", className: "-right-8 top-12 h-36 w-36", r: 8 },
          { photo: PHOTOS.chai, emoji: "🌯", className: "-right-4 top-56 h-24 w-24", r: -10 },
        ].map((f, i) => (
          <div
            key={i}
            {...reveal("drop", 250 + i * 150, { "--r": `${f.r}deg` })}
            className={`absolute flex items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-gold-300 shadow-hard ${f.className}`}
          >
            <span className="text-5xl">{f.emoji}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl(f.photo, 300, 300)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ))}
        <Sticker className="absolute -left-8 -top-8" center={<span className="font-display text-4xl uppercase">Hi!</span>} />
      </div>
      <div className="card mx-auto w-full max-w-md !rounded-[2rem] p-7 !shadow-hard-lg sm:p-9">
        <h1 className="display text-6xl text-ink">{title}</h1>
        <p className="mb-7 mt-3 text-sm font-medium text-zinc-500">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
