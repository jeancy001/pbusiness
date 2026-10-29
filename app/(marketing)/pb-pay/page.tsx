import { PBPayLogo } from "@/components/ui/pb-pay-logo"

export default function PbPay() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4 py-16">
      <div className="w-full overflow-hidden rounded-3xl bg-[#064E3B] p-8 text-center text-white shadow-xl md:p-12">

        {/* PB-pay Logo */}
        <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-white shadow-lg">
          <PBPayLogo className="size-14" />
        </div>

        {/* Status */}
        <span className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-50 ring-1 ring-white/20">
          Coming Soon
        </span>

        {/* Title */}
        <h1 className="mt-5 font-heading text-3xl font-bold tracking-tight md:text-5xl">
          PB-pay Web is Coming Soon
        </h1>

        {/* Description */}
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-relaxed text-emerald-50/80 md:text-lg">
          We are preparing the PB-pay web application to give you a simple,
          secure and convenient way to manage your payments and financial
          services online.
        </p>

        {/* Mobile app notice */}
        <p className="mt-6 text-sm font-medium text-white/90">
          The PB-pay mobile application will also be available soon.
        </p>

      </div>
    </section>
  )
}