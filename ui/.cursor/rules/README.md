# UI.NextJs.Framework Cursor Rules

Cursor rules for the Next.js Unity UI mirror. They map Angular Unity.UI.Framework patterns into React / Next.js App Router conventions.

## Directory layout

```
.cursor/rules/
├── README.md
├── framework/                         # Architecture & feature recipes
│   ├── nextjs-framework-overview.mdc  # always applied
│   ├── nextjs-entity-grid.mdc
│   ├── nextjs-json-schema-forms.mdc
│   ├── nextjs-list-pages.mdc          # always applied: list on page, modal only for forms
│   ├── nextjs-modal-routing.mdc
│   └── nextjs-state-layer.mdc
├── style/                             # Component library & formatting
│   ├── nextjs-design-system.mdc       # component catalogue (primary)
│   ├── nextjs-components.mdc          # structure, naming, tid, props
│   ├── nextjs-css.mdc                 # CSS modules + tokens
│   └── nextjs-formatting.mdc          # always applied
└── implementation/
    └── nextjs-implementation.mdc      # always applied
```

## Which rules apply when

| Rule set | Scope |
|----------|-------|
| `framework/nextjs-framework-overview.mdc` | Always — layout, aliases, API env |
| `framework/nextjs-list-pages.mdc` | Always — routed list pages render results on the page; modals only for forms / confirms |
| `style/nextjs-design-system.mdc` | Design-system work and feature UI composition |
| `style/nextjs-components.mdc` | `**/*.{tsx,ts}` under framework/design-system and features |
| `style/nextjs-css.mdc` | `**/*.{css,module.css}` |
| `style/nextjs-formatting.mdc` | Always |
| `implementation/nextjs-implementation.mdc` | Always |
| Other `framework/*` | Activated by globs (grids, forms, modals, state) |

## Canonical references (copy these)

| Pattern | Location |
|---------|----------|
| **Component library** | `src/framework/design-system/` + live demo `/` (`DesignSystemShowcase`) |
| Component catalogue doc | `src/framework/design-system/README.md` |
| Framework pattern index | `src/framework/README.md` |
| Entity / manage grid | `src/features/reference-data/reference-data-types-grid/` and `src/features/animals/manage-animals/` (list inline on the page) |
| JSON schema form modal | `src/features/animals/animal-form-modal/` and `src/features/reference-data/reference-data-item-form-modal/` |
| Modal routing (parallel `@modal`) | `src/app/examples/animals/` and `src/app/examples/reference-data/` |

## Framework source aliases

Defined in `tsconfig.json`:

- `@design-system`, `@design-system/*`
- `@entity-framework`, `@entity-framework/*`
- `@json-schema-form`, `@json-schema-form/*`
- `@auth/*`, `@shell/*`, `@features/*`
- `@/*` → `./src/*`

Import design-system and entity-framework via aliases — never deep relative paths into `src/framework/`.

## Agent entry

See `AGENTS.md` at the repo root. Do not invent a separate Grok (or other agent) folder; Cursor guidance lives in `.cursor/rules` and `AGENTS.md` only.
