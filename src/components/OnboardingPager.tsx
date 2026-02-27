import { useMemo, useRef, useState } from "react";

type OnboardingPagerProps = {
  onComplete: (totalBalance: number, currency: string, monthlyIncome: number) => Promise<void>;
};

export function OnboardingPager({ onComplete }: OnboardingPagerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [balanceInput, setBalanceInput] = useState("");
  const [currencyInput, setCurrencyInput] = useState("USD");
  const [incomeInput, setIncomeInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const balanceRef = useRef<HTMLInputElement>(null);
  const currencyRef = useRef<HTMLInputElement>(null);
  const incomeRef = useRef<HTMLInputElement>(null);

  const slides = useMemo(
    () => [
      {
        title: "Welcome to WealthFlow.",
        subtitle: "Build healthy spending habits with a local-first finance tracker.",
      },
      {
        title: "Initialize Your Wealth.",
        subtitle: "Set your current total balance to calibrate your dashboard.",
      },
      {
        title: "Select Your Currency.",
        subtitle: "Type PKR, INR, USD or any local currency code you want to use.",
      },
      {
        title: "Set Monthly Income.",
        subtitle: "We'll calculate your daily allowance — how much you can safely spend each day.",
      },
    ],
    []
  );

  const toNumber = (value: string) => Number.parseFloat(value || "0");

  const goNext = () => {
    if (currentSlide === 0) {
      setTimeout(() => balanceRef.current?.focus(), 400);
    }
    if (currentSlide === 1) {
      setTimeout(() => currencyRef.current?.focus(), 400);
    }
    if (currentSlide === 2) {
      setTimeout(() => incomeRef.current?.focus(), 400);
    }
    setCurrentSlide((value) => Math.min(value + 1, slides.length - 1));
  };

  const goBack = () => {
    setCurrentSlide((value) => Math.max(value - 1, 0));
  };

  const completeOnboarding = async () => {
    setIsSaving(true);
    await onComplete(toNumber(balanceInput), currencyInput, toNumber(incomeInput));
    setIsSaving(false);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-6">
      <div className="fade-rise w-full overflow-hidden rounded-3xl border border-white/10 bg-[var(--wf-surface)] shadow-2xl shadow-black/40">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 1: Welcome */}
          <section className="flex min-h-[560px] min-w-full flex-col justify-between p-6">
            <div className="space-y-5">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--wf-emerald)]/20 text-[var(--wf-emerald)]">
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 21v-6" strokeLinecap="round" />
                  <path d="M8 13c0-3 2-5 4-5s4 2 4 5" strokeLinecap="round" />
                  <path d="M12 8c0-3 2.5-5 5-5 0 3-1 6-5 7" strokeLinecap="round" />
                  <path d="M12 10C9 9 7 6 7 3c2.5 0 5 2 5 7" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="text-3xl font-semibold text-white">{slides[0].title}</h1>
              <p className="text-sm leading-relaxed text-[var(--wf-text-muted)]">{slides[0].subtitle}</p>
            </div>
            <button
              onClick={goNext}
              className="rounded-2xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-semibold text-black transition hover:brightness-110"
            >
              Start setup
            </button>
          </section>

          {/* Slide 2: Balance */}
          <section className="flex min-h-[560px] min-w-full flex-col justify-between p-6">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--wf-text-muted)]">Step 2 of 4</p>
              <h2 className="text-3xl font-semibold text-white">{slides[1].title}</h2>
              <p className="text-sm text-[var(--wf-text-muted)]">{slides[1].subtitle}</p>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">Current Total Balance</span>
                <input
                  ref={balanceRef}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={balanceInput}
                  onChange={(event) => setBalanceInput(event.target.value)}
                  placeholder="25000"
                  className="w-full rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-4 text-3xl font-semibold text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-[var(--wf-text-primary)]"
              >
                Back
              </button>
              <button
                onClick={goNext}
                disabled={toNumber(balanceInput) <= 0}
                className="flex-1 rounded-2xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>

          {/* Slide 3: Currency */}
          <section className="flex min-h-[560px] min-w-full flex-col justify-between p-6">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--wf-text-muted)]">Step 3 of 4</p>
              <h2 className="text-3xl font-semibold text-white">{slides[2].title}</h2>
              <p className="text-sm text-[var(--wf-text-muted)]">{slides[2].subtitle}</p>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">Currency</span>
                <input
                  ref={currencyRef}
                  type="text"
                  value={currencyInput}
                  onChange={(event) => setCurrencyInput(event.target.value.toUpperCase())}
                  placeholder="PKR"
                  className="w-full rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-4 text-3xl font-semibold uppercase text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {["USD", "PKR", "INR", "EUR", "GBP", "SAR", "AED"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrencyInput(c)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      currencyInput === c
                        ? "bg-[var(--wf-emerald)] text-black"
                        : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-[var(--wf-text-primary)]"
              >
                Back
              </button>
              <button
                onClick={goNext}
                disabled={!currencyInput.trim()}
                className="flex-1 rounded-2xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </section>

          {/* Slide 4: Monthly Income */}
          <section className="flex min-h-[560px] min-w-full flex-col justify-between p-6">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--wf-text-muted)]">Step 4 of 4</p>
              <h2 className="text-3xl font-semibold text-white">{slides[3].title}</h2>
              <p className="text-sm text-[var(--wf-text-muted)]">{slides[3].subtitle}</p>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-wide text-[var(--wf-text-muted)]">Monthly Income</span>
                <input
                  ref={incomeRef}
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={incomeInput}
                  onChange={(event) => setIncomeInput(event.target.value)}
                  placeholder="50000"
                  className="w-full rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-4 text-3xl font-semibold text-white outline-none ring-[var(--wf-emerald)]/60 transition focus:ring"
                />
              </label>
              <p className="rounded-xl border border-white/5 bg-[var(--wf-surface-elevated)] p-3 text-xs text-[var(--wf-text-muted)]">
                💡 This helps us calculate your <strong className="text-[var(--wf-emerald)]">Daily Allowance</strong> — a simple number telling you how much you can spend today.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={goBack}
                className="flex-1 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-[var(--wf-text-primary)]"
              >
                Back
              </button>
              <button
                onClick={completeOnboarding}
                disabled={toNumber(incomeInput) <= 0 || isSaving}
                className="flex-1 rounded-2xl bg-[var(--wf-emerald)] px-5 py-3 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSaving ? "Saving..." : "Launch dashboard"}
              </button>
            </div>
          </section>
        </div>

        <div className="flex justify-center gap-2 pb-5">
          {slides.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentSlide ? "w-6 bg-[var(--wf-emerald)]" : "w-2 bg-white/25"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
