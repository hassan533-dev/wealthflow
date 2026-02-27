import { useMemo, useState } from "react";

type CreateCategorySheetProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; color: string; icon: string; limit: number }) => Promise<void>;
  currency: string;
};

const colorPalette = [
  { hex: "#2ecc71", name: "Emerald" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#f43f5e", name: "Rose" },
  { hex: "#a3e635", name: "Lime" },
  { hex: "#8b5cf6", name: "Purple" },
  { hex: "#ec4899", name: "Pink" },
  { hex: "#38bdf8", name: "Sky" },
  { hex: "#facc15", name: "Yellow" },
  { hex: "#fb923c", name: "Amber" },
  { hex: "#14b8a6", name: "Teal" },
  { hex: "#a78bfa", name: "Violet" },
  { hex: "#f87171", name: "Red" },
  { hex: "#22d3ee", name: "Aqua" },
  { hex: "#4ade80", name: "Green" },
  { hex: "#c084fc", name: "Orchid" },
];

const emojiCategories = [
  {
    label: "Food & Drink",
    emojis: ["🍔", "🍕", "🍜", "☕", "🍺", "🥗", "🍰", "🧃", "🍱", "🥐", "🍩", "🥤"],
  },
  {
    label: "Transport",
    emojis: ["✈️", "🚗", "🚌", "🚕", "⛽", "🚆", "🛵", "🚲", "🛻", "🏍️", "⛵", "🚀"],
  },
  {
    label: "Home & Bills",
    emojis: ["🏠", "📄", "💡", "🔌", "📱", "💻", "🛋️", "🧹", "🔧", "🪴", "🏗️", "📦"],
  },
  {
    label: "Health & Fitness",
    emojis: ["💊", "🏋️", "🧘", "🩺", "❤️", "🦷", "👁️", "🧠", "💪", "🏥", "🩹", "🥦"],
  },
  {
    label: "Shopping",
    emojis: ["🛒", "👗", "👟", "💄", "🎒", "⌚", "💎", "🕶️", "👜", "🧥", "🎁", "🛍️"],
  },
  {
    label: "Entertainment",
    emojis: ["🎬", "🎮", "🎵", "📚", "🎨", "🎪", "🎲", "🎯", "🎤", "📺", "🍿", "🎸"],
  },
  {
    label: "Education",
    emojis: ["📖", "🎓", "✏️", "📝", "🧪", "🔬", "🌐", "💼", "📊", "🗂️", "📐", "🖊️"],
  },
  {
    label: "Other",
    emojis: ["💰", "🎉", "🐾", "🌿", "⭐", "🔥", "💫", "🌈", "🏆", "🧧", "🪙", "❤️‍🔥"],
  },
];

export function CreateCategorySheet({ open, onClose, onCreate, currency }: CreateCategorySheetProps) {
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [color, setColor] = useState(colorPalette[0].hex);
  const [icon, setIcon] = useState("🍔");
  const [isSaving, setIsSaving] = useState(false);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const parsedLimit = useMemo(() => Number.parseFloat(limit || "0"), [limit]);

  if (!open) {
    return null;
  }

  const resetAndClose = () => {
    setName("");
    setLimit("");
    setColor(colorPalette[0].hex);
    setIcon("🍔");
    setStep(1);
    setActiveEmojiTab(0);
    onClose();
  };

  const submit = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    await onCreate({
      name: name.trim(),
      color,
      icon,
      limit: Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 0,
    });
    setIsSaving(false);
    setName("");
    setLimit("");
    setColor(colorPalette[0].hex);
    setIcon("🍔");
    setStep(1);
    setActiveEmojiTab(0);
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="fixed inset-0 z-30 flex items-end bg-black/70 backdrop-blur-sm p-3 sm:p-6" onClick={resetAndClose}>
      <div
        className="mx-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[var(--wf-surface)] shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-white/5 bg-[var(--wf-surface)]/95 backdrop-blur-md px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">✨ Create Category</h3>
              <p className="mt-0.5 text-xs text-[var(--wf-text-muted)]">
                Step {step} of 3 — {step === 1 ? "Name & Icon" : step === 2 ? "Choose Color" : "Set Budget"}
              </p>
            </div>
            <button
              onClick={resetAndClose}
              className="rounded-xl border border-white/10 bg-[var(--wf-surface-elevated)] p-2 text-[var(--wf-text-muted)] transition hover:border-white/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-1 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[var(--wf-emerald)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          {/* Live Preview Card */}
          <div className="mb-5 rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--wf-text-muted)]">
              Live Preview
            </p>
            <div className="flex items-center gap-4">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-all duration-300"
                style={{ backgroundColor: `${color}22`, boxShadow: `0 0 20px ${color}15` }}
              >
                {icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">
                  {name || "Category Name"}
                </p>
                <p className="text-xs text-[var(--wf-text-muted)]">
                  {currency} 0 / {parsedLimit > 0 ? `${currency} ${parsedLimit.toLocaleString()}` : "No limit"}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-full w-0 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: Name & Icon */}
          {step === 1 && (
            <div className="space-y-5 fade-rise">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
                  Category Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g., Groceries, Gym, Netflix..."
                  className="w-full rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] px-4 py-3.5 text-base font-semibold text-white outline-none ring-[var(--wf-emerald)]/60 transition placeholder:text-white/20 focus:ring focus:border-[var(--wf-emerald)]/40"
                  autoFocus
                />
                <p className="mt-1.5 text-[10px] text-[var(--wf-text-muted)]">
                  Give it a short, descriptive name
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
                  Choose an Icon
                </label>
                {/* Emoji category tabs */}
                <div className="mb-3 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                  {emojiCategories.map((cat, i) => (
                    <button
                      key={cat.label}
                      onClick={() => setActiveEmojiTab(i)}
                      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold whitespace-nowrap transition ${
                        activeEmojiTab === i
                          ? "bg-[var(--wf-emerald)] text-black"
                          : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)]"
                      }`}
                    >
                      {cat.emojis[0]} {cat.label}
                    </button>
                  ))}
                </div>
                {/* Emoji grid */}
                <div className="grid grid-cols-6 gap-2">
                  {emojiCategories[activeEmojiTab].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setIcon(emoji)}
                      className={`flex h-12 w-full items-center justify-center rounded-xl text-xl transition-all ${
                        icon === emoji
                          ? "scale-110 border-2 border-[var(--wf-emerald)] bg-[var(--wf-emerald)]/15 shadow-lg shadow-[var(--wf-emerald)]/20"
                          : "border border-white/10 bg-[var(--wf-surface-elevated)] hover:border-white/25 hover:bg-white/5"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full rounded-2xl bg-[var(--wf-emerald)] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next — Choose Color →
              </button>
            </div>
          )}

          {/* Step 2: Color */}
          {step === 2 && (
            <div className="space-y-5 fade-rise">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
                  Pick a Color
                </label>
                <p className="mb-3 text-xs text-[var(--wf-text-muted)]">
                  This color will be used for the progress bar, icon background, and category identity.
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {colorPalette.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setColor(c.hex)}
                      className={`group relative flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                        color === c.hex
                          ? "border-white/40 bg-white/5 scale-105 shadow-lg"
                          : "border-white/5 bg-[var(--wf-surface-elevated)] hover:border-white/15"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-full transition-all ${
                          color === c.hex ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--wf-surface)]" : ""
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[10px] font-medium text-[var(--wf-text-muted)]">{c.name}</span>
                      {color === c.hex && (
                        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--wf-emerald)] text-[10px] text-black">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-medium text-[var(--wf-text-primary)] transition hover:border-white/20"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-2xl bg-[var(--wf-emerald)] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110"
                >
                  Next — Budget →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Final */}
          {step === 3 && (
            <div className="space-y-5 fade-rise">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--wf-text-muted)]">
                  Monthly Budget Limit
                </label>
                <p className="mb-3 text-xs text-[var(--wf-text-muted)]">
                  Set a spending cap for this category. Leave empty for unlimited.
                </p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[var(--wf-text-muted)]">
                    {currency}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={limit}
                    onChange={(event) => setLimit(event.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border border-white/10 bg-[var(--wf-surface-elevated)] py-4 pr-4 pl-14 text-2xl font-bold text-white outline-none ring-[var(--wf-emerald)]/60 transition placeholder:text-white/15 focus:ring focus:border-[var(--wf-emerald)]/40"
                    autoFocus
                  />
                </div>
                {/* Quick limit suggestions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {[100, 250, 500, 1000, 2500, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLimit(String(v))}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        limit === String(v)
                          ? "bg-[var(--wf-emerald)] text-black"
                          : "border border-white/10 bg-[var(--wf-surface-elevated)] text-[var(--wf-text-muted)] hover:border-white/20"
                      }`}
                    >
                      {currency} {v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-2xl border border-[var(--wf-emerald)]/20 bg-[var(--wf-emerald)]/5 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--wf-emerald)]">
                  Summary
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--wf-text-muted)]">Name</span>
                    <span className="font-semibold text-white">{name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--wf-text-muted)]">Icon</span>
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--wf-text-muted)]">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-white">{colorPalette.find((c) => c.hex === color)?.name ?? "Custom"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--wf-text-muted)]">Limit</span>
                    <span className="font-semibold text-white">
                      {parsedLimit > 0 ? `${currency} ${parsedLimit.toLocaleString()}` : "Unlimited"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 rounded-2xl border border-white/10 px-5 py-3.5 text-sm font-medium text-[var(--wf-text-primary)] transition hover:border-white/20"
                >
                  ← Back
                </button>
                <button
                  onClick={submit}
                  disabled={!name.trim() || isSaving}
                  className="flex-1 rounded-2xl bg-[var(--wf-emerald)] px-5 py-3.5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "✓ Create Category"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
