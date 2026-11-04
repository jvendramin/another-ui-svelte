---
"shadcn-svelte": patch
---

fix(cli): only map color tokens into `@theme`. A non-color token such as a shadow was written as `--name: var(--name)`, a variable that refers to itself.
