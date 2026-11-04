---
"shadcn-svelte": major
---

feat(cli): **breaking.** The default icon library is now `phosphor` (it was `lucide`). A `components.json` without `iconLibrary` gets Phosphor imports and a `phosphor-svelte` dev dependency on the next `add`. Set `"iconLibrary": "lucide"` to keep Lucide. Phosphor icons get `weight="duotone"` for form and field icons and `weight="bold"` for arrows, carets, plus, check, X, minus, dots and text format, from `phosphorWeight(name)`, exported from `shadcn-svelte/icons`. A weight the component sets itself is kept.
