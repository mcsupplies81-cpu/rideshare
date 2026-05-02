import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen bg-[#0F0F1A] text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-6">
        <div className="w-10 h-10 rounded-full bg-[#7B5EA7] flex items-center justify-center font-bold text-lg">
          R
        </div>
        <span className="text-2xl font-bold">Moove</span>
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#7B5EA7] flex items-center justify-center mb-4">
          <span className="text-4xl font-bold">R</span>
        </div>

        <h1 className="text-4xl font-bold leading-tight">
          Better rides.<br />More earnings.
        </h1>

        <p className="text-gray-400 max-w-sm text-base leading-relaxed">
          Moove connects riders with trusted drivers in San Diego
          and gives drivers more of what they earn.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
          <Link
            href="/signup"
            className="w-full py-4 rounded-xl bg-[#7B5EA7] text-white font-semibold text-center text-lg hover:bg-[#5A3E8A] transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full py-4 rounded-xl border border-[#2A2A3E] text-white font-semibold text-center text-lg hover:border-[#7B5EA7] transition-colors"
          >
            Log In
          </Link>
        </div>

        <div className="flex gap-8 mt-4">
          <Link href="/signup?role=rider" className="text-[#7B5EA7] text-sm hover:underline">
            I&apos;m a rider
          </Link>
          <Link href="/signup?role=driver" className="text-[#7B5EA7] text-sm hover:underline">
            I&apos;m a driver
          </Link>
        </div>

        {/* Founding Driver Offer */}
        <div className="mt-8 w-full max-w-xs rounded-xl border border-[#7B5EA7] bg-[#1A1A2E] p-4">
          <p className="text-xs text-[#7B5EA7] font-semibold uppercase tracking-wide">
            Founding Driver Offer
          </p>
          <p className="text-sm text-gray-400 mt-1">First 100 drivers get</p>
          <p className="text-2xl font-bold text-white mt-1">1 MONTH FREE</p>
          <p className="text-xs text-gray-500 mt-1">Limited to first 100 drivers who sign up.</p>
        </div>
      </div>

      {/* Value Props */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 pb-8">
        <div className="bg-[#1A1A2E] rounded-xl p-4 text-center">
          <p className="text-[#7B5EA7] font-semibold text-sm uppercase tracking-wide mb-2">
            Simple for Riders
          </p>
          <p className="text-gray-400 text-sm">Fast booking. Transparent pricing. No hidden fees.</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-4 text-center">
          <p className="text-[#7B5EA7] font-semibold text-sm uppercase tracking-wide mb-2">
            Better for Drivers
          </p>
          <p className="text-gray-400 text-sm">Keep more of what you earn with flexible pricing options.</p>
        </div>
        <div className="bg-[#1A1A2E] rounded-xl p-4 text-center">
          <p className="text-[#7B5EA7] font-semibold text-sm uppercase tracking-wide mb-2">
            Built for Communities
          </p>
          <p className="text-gray-400 text-sm">Local, safe, and reliable rides in the places you love.</p>
        </div>
      </div>

      {/* Driver Pricing */}
      <div className="bg-[#1A1A2E] mx-6 mb-8 rounded-xl p-6">
        <p className="text-[#7B5EA7] font-semibold text-sm uppercase tracking-wide mb-4 text-center">
          Driver Pricing
        </p>
        <div className="flex gap-4 justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold">$2.99</p>
            <p className="text-gray-400 text-sm">Per Ride</p>
          </div>
          <div className="w-px bg-[#2A2A3E]" />
          <div className="text-center relative">
            <span className="absolute -top-3 -right-3 bg-[#7B5EA7] text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              BEST VALUE
            </span>
            <p className="text-3xl font-bold">$69</p>
            <p className="text-gray-400 text-sm">/month</p>
            <p className="text-gray-500 text-xs">Unlimited Rides</p>
          </div>
        </div>
      </div>
    </main>
  );
}
