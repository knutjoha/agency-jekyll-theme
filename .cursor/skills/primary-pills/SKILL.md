---
name: primary-pills
description: Apply Family Hub convex lighting to primary pills (Lagre, selected I dag, other accent CTAs). Quiet bloom, inset highlight, :active press. Use when styling buttons, pills, Lagre, I dag, or primary actions. Do not apply the full recipe to nav, Handleliste X, or 20×20 checkboxes.
---

# Primary pills

Family Hub primary pills are convex, not flat fills. Ghost pills get inset + press only. Nav, remove X, and 20×20 checkboxes stay flat.

## Primary (Lagre, selected I dag, other accent CTAs)

Quiet bloom — not the 24px sample glow.

```css
.pill-primary {
  color: var(--ink);
  background: linear-gradient(#FFB56A, var(--accent));
  box-shadow:
    inset 0 1px 0 #ffffff59,
    inset 0 -2px 0 #0003,
    0 1px 2px #0006,
    0 4px 12px -4px #FF9F4366;
}
.pill-primary:active {
  translate: 0 1px;
  box-shadow: inset 0 2px 4px #0004;
}
```

At most 3–4 accent hits per view. Do not use `0 8px 24px -6px #FF9F4399`.

## Ghost (I morgen and similar)

```css
.pill-ghost {
  color: var(--text-2);
  background: linear-gradient(#1A1D22, var(--tile-3));
  box-shadow:
    inset 0 1px 0 #ffffff14,
    inset 0 -2px 0 #0006,
    0 1px 2px #0008;
}
.pill-ghost:active {
  translate: 0 1px;
  box-shadow: inset 0 2px 4px #0006;
}
```

No colored bloom on ghost pills.

## Never

- Full recipe on nav, Handleliste X, 20×20 checkboxes
- `transition: all`
- Inventing other cubic-beziers for this press — the press is `translate: 0 1px` plus inset, not a duration show
