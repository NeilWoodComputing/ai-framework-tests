# Design system — component library

React/Next mapping of the Unity Angular design system. Import from `@design-system`.

Live demo: **`/`** → `src/features/design-system-showcase/DesignSystemShowcase.tsx`.

## Public exports

See `index.ts` for the barrel. Summary:

### Actions & feedback

| Export | Notes |
|--------|------|
| `Button` | `theme`: primary-action, secondary-action, system-red, system-green, alternate; `loading`, `circle`, `buttonSize`, `fullWidth`, `tid` |
| `Callout` | `type`: info, success, warning, error |
| `Icon` | `name`: Edit, Delete, Check, Close (extend `ICON_PATHS` when specs need more); `knockout="circle"` draws a filled circle with the glyph cut out (one evenodd path, currentColor) |
| `Badge` | Compact count/chip |

### Forms

| Export | Notes |
|--------|------|
| `Input` | Label, required marker, hint, error, `inputSize`, `tid` → `data-tid` + `{tid}-field` |
| `PasswordInput` | Password field with show/hide |
| `Checkbox` | Labelled checkbox |
| `Switch` | `role="switch"` toggle |
| `FormField`, `FormFieldLabel`, `FormFieldError` | Compose custom controls with shared chrome |

Entity create/edit with a server schema should use `@json-schema-form`, not a hand-built stack of `Input`s that duplicates the schema.

### Typography & page shell

| Export | Notes |
|--------|------|
| `H1`, `H2`, `H3`, `P` | Prefer these over raw headings; `H3 variant="section"` for showcase/section labels |
| `PageLayout` | `header`, `children` (body), `footer` |

### Overlays

| Export | Notes |
|--------|------|
| `Modal` | Portal dialog/blade; `size`, `presentation`, `level`, `allowKeyboardClose` |
| `ModalShell` | Title, body scroll, footer actions, loading, formErrors |
| `RoutedModal` | Feature modals with `dismissHref` + footer defaults |
| `ConfirmModal` | Confirm / cancel |
| `useModalDismiss`, `useModalNavigate` | Close / open routed modals |
| `useModalPreload` | Warm a routed modal from the page that opens it (route prefetch + one-off `preload`, e.g. form module + schema) so the first open is instant |
| `DropdownMenu` | Actions / overflow menu. Portals to `<body>` (`position: fixed`, `--z-index-popover`) so it is never clipped by a table, grid card, or modal body; flips above when no room below; Esc / Tab / outside click close; arrow keys move. Used by the grid row actions menu |

### Theme

| Export | Notes |
|--------|------|
| `ThemeProvider`, `useTheme` | Sets `html[data-theme]`; persists `system-theme` in localStorage |
| `theme/tokens.css` | Semantic CSS variables (light + dark) |

## Folder layout (mirror Angular groups)

```
design-system/
  buttons/button/
  forms/{input,password-input,checkbox,switch,form-field}/
  layout/{page-layout,badge}/
  components/{callout,icon,menu,modal}/
  typography/
  theme/
  index.ts
  README.md          ← this file
```

## Composition example

```tsx
'use client';

import { Button, Callout, H1, P, PageLayout } from '@design-system';

export function ExamplePage({ error, onSave }: { error?: string; onSave: () => void }) {
  return (
    <PageLayout header={<><H1>Title</H1><P>Description</P></>}>
      {error ? <Callout type="error">{error}</Callout> : null}
      <Button theme="primary-action" tid="example-save" onClick={onSave}>
        Save
      </Button>
    </PageLayout>
  );
}
```

## Styling contract

- Co-locate `*.module.css` with the component
- Use tokens from `theme/tokens.css` (`--primary-action`, `--app-*`, `--ink-*`)
- Rem units (`html` font-size 62.5%)
- Interactive components accept `tid?: string` and render `data-tid`
- Floating UI (menus, popovers) portals to `<body>` and uses `--z-index-popover` (above every modal level). Never fix clipping by removing `overflow` from grids/modals or raising a local `z-index`

## Angular parity gaps (intentional / backlog)

Charts, loaders, tabs, view-card, dataset-select, and some typography sizes exist in Angular but are not all ported yet. When a feature needs one, add it under this library (export + README + showcase) rather than embedding a one-off in the feature folder.
