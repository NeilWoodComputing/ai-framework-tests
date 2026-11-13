# Framework pattern index

Shared code under `src/framework/`. Feature folders in `src/features/` should stay thin.

| Area | Alias | Purpose | Agent rules |
|------|-------|---------|-------------|
| Design system (component library) | `@design-system` | Buttons, forms controls, typography, layout, callouts, icons, modals, theme | `.cursor/rules/style/nextjs-design-system.mdc` |
| Entity framework | `@entity-framework` | Grids, search providers, grid hooks, update services | `.cursor/rules/framework/nextjs-entity-grid.mdc`, `nextjs-state-layer.mdc` |
| JSON schema forms | `@json-schema-form` | Fetch schema, UI schema layout, client schema validation, form hook | `.cursor/rules/framework/nextjs-json-schema-forms.mdc` |
| API | `@/framework/api` | `systemApiFetch` (Bearer JWT) | overview rule |
| Auth | `@auth/*` | Session / sign-in | overview rule |

## Start with the component library

1. Read `design-system/README.md`
2. Browse the live showcase at `/`
3. Import from `@design-system` only (public barrel: `design-system/index.ts`)

## Then feature recipes

1. Grid / list page — copy `features/animals/manage-animals/` or `features/reference-data/reference-data-types-grid/` (list renders on the page, never in a modal)
2. Schema form — copy `features/animals/animal-form-modal/`
3. Routes / modals — copy `app/examples/animals/` parallel `@modal` tree (form modals only)

## Adding framework code

- Reusable visuals → `design-system/` + export from `index.ts` + document in `design-system/README.md` + showcase when useful
- Reusable grid/form behaviour → `entity-framework/` or `json-schema-form/`
- Product-specific wiring → `src/features/{area}/` only
