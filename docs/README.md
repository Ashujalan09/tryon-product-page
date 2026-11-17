# Docs

| File | What it is |
| ---- | ---------- |
| [`figma/pdp-design-spec.md`](figma/pdp-design-spec.md) | Measured spec for the desktop (`2044:2602`) and mobile (`16:6217`) PDP frames from *Lorem Ipsum Design I (Copy)*: sections, geometry, every text node, colours, assets, state deltas. |
| [`figma/pdp-frames.json`](figma/pdp-frames.json) | Trimmed machine-readable frame trees + state deltas + imageRef index. |
| [`research/pdp-contract.md`](research/pdp-contract.md) | Wireframe/design contract, state matrix, header/footer, component map, export-plugin explanation. |
| [`research/template-inventory.md`](research/template-inventory.md) | What was ported from the Shopify template and what was left behind. |

Figma access note: the frames above were exported with the template’s plugin
(`docs/reference/figma/export-plugin` in the template repo) after the REST quota was exhausted. The
export includes geometry, type and `imageRef`s, **not** image bytes — gallery photos therefore come
from the UniPlus product shoot.
