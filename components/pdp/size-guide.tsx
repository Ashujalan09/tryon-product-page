"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

const ROWS = [
  { size: "XXS", bust: "76–80", waist: "58–62", hip: "84–88" },
  { size: "XS", bust: "80–84", waist: "62–66", hip: "88–92" },
  { size: "S", bust: "84–88", waist: "66–70", hip: "92–96" },
  { size: "M", bust: "88–92", waist: "70–74", hip: "96–100" },
  { size: "L", bust: "92–98", waist: "74–80", hip: "100–106" },
  { size: "XL", bust: "98–104", waist: "80–86", hip: "106–112" },
  { size: "XXL", bust: "104–110", waist: "86–92", hip: "112–118" },
];

export function SizeGuide({ onClose, open }: { onClose: () => void; open: boolean }) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-(--z-overlay) flex items-end justify-center desktop:items-center">
      <button
        aria-label="Close size guide"
        className="absolute inset-0 cursor-default bg-black/25"
        onClick={onClose}
        type="button"
      />
      <div
        aria-label="Size guide"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full overflow-y-auto bg-paper p-6 desktop:max-w-[720px] desktop:p-10"
        role="dialog"
      >
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="grid gap-2">
            <p className="type-h3">Size Guide</p>
            <p className="type-body-sm max-w-[46ch] text-ink-muted">
              Measurements are body measurements in centimetres. This dress sits close to the body
              with an A-line skirt — take your usual size, or size up for a looser drop.
            </p>
          </div>
          <button
            aria-label="Close size guide"
            className="focus-ring flex size-9 shrink-0 items-center justify-center"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" strokeWidth={1.25} />
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-ink">
              {["Size", "Bust", "Waist", "Hip"].map((head) => (
                <th className="type-label py-3 font-normal" key={head} scope="col">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr className="border-b border-rule" key={row.size}>
                <th className="type-body py-3 font-normal" scope="row">
                  {row.size}
                </th>
                <td className="type-body-sm py-3 text-ink-muted">{row.bust}</td>
                <td className="type-body-sm py-3 text-ink-muted">{row.waist}</td>
                <td className="type-body-sm py-3 text-ink-muted">{row.hip}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="type-body-sm mt-6 max-w-[60ch] text-ink-muted">
          Between sizes? Choose the larger — the racerback is cut to sit flat against the shoulder
          blade. Still unsure? Write to{" "}
          <a className="underline underline-offset-4" href="mailto:hello@loremipsum.example">
            hello@loremipsum.example
          </a>
          .
        </p>
      </div>
    </div>
  );
}
