'use client';

import { useMemo, useState } from 'react';
import { Switch, H1, H2, P, Button } from '@design-system';
import { JsonSchemaForm } from '@json-schema-form';
import {
  EntityGrid,
  getSearchRequest,
  renderBooleanIconCell,
  renderBooleanSwitchCell,
  type AbstractIdentifiable,
  type EntityGridConfig,
  type EntityGridState,
  type GridColumn,
  type GridRowAction,
  type SearchRequest,
} from '@entity-framework';

/**
 * Dev / test only. The route (`src/app/examples/test-harness/page.tsx`) returns 404 in production
 * builds and is not linked from SiteNav or any other nav.
 *
 * Component scenarios that no product page exercises:
 * T-ANIMAL-006/S1, S2, S4; T-ANIMAL-007/S3–S7; T-ANIMAL-009/S4–S6.
 * Row-action scenarios drive the real `EntityGrid` (menu mode) with static rows; the session
 * permissions come from the buttons below via `EntityGrid`'s `sessionPermissions` prop (no mocked HTTP).
 */

interface HarnessAnimal extends AbstractIdentifiable {
  id: string;
  name: string;
}

const harnessRows: HarnessAnimal[] = [
  { id: 'bessie', name: 'Bessie' },
  { id: 'ziggy', name: 'Ziggy' },
];

const harnessColumns: GridColumn<HarnessAnimal>[] = [{ propertyName: 'name', headerLabel: 'Name' }];

const notBessie = (row: HarnessAnimal) => row.name !== 'Bessie';

const schema = {
  type: 'object',
  properties: {
    isFurry: { type: 'boolean', title: 'Is Furry', default: false },
    attributes: {
      type: 'array',
      title: 'Attributes',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20,
    },
  },
} as const;

const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/isFurry' },
    { type: 'Control', scope: '#/properties/attributes' },
  ],
} as const;

const permissionPresets: Array<{ tid: string; label: string; permissions: string[] }> = [
  { tid: 'harness-perm-animals', label: 'Perm: animals_write', permissions: ['animals_write'] },
  { tid: 'harness-perm-usermgmt', label: 'Perm: user_management_write', permissions: ['user_management_write'] },
  { tid: 'harness-perm-read', label: 'Perm: user_management_read', permissions: ['user_management_read'] },
  { tid: 'harness-perm-reports', label: 'Perm: reports_view', permissions: ['reports_view'] },
  { tid: 'harness-perm-none', label: 'Perm: none', permissions: [] },
];

function staticGridState(
  config: EntityGridConfig<HarnessAnimal>
): EntityGridState<HarnessAnimal, SearchRequest> {
  return {
    config,
    columns: harnessColumns,
    entities: harnessRows,
    totalRows: harnessRows.length,
    inFlight: false,
    error: null,
    searchRequest: getSearchRequest({ pageSize: harnessRows.length }),
    onPageChanged: () => undefined,
    setSort: () => undefined,
    reload: () => undefined,
  };
}

export function ComponentTestHarness() {
  const [switchOn, setSwitchOn] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({
    isFurry: false,
    attributes: [],
  });
  const [formReadOnly, setFormReadOnly] = useState(false);
  const [sessionPermissions, setSessionPermissions] = useState<string[]>(['animals_write']);
  const [lastAction, setLastAction] = useState('(none)');

  const grids = useMemo(() => {
    const run = (label: string) => (row: HarnessAnimal) => setLastAction(`${label}:${row.name}`);
    const edit: GridRowAction<HarnessAnimal> = {
      label: 'Edit Animal',
      tid: 'harness-edit',
      requiredPermissions: ['animals_write'],
      execute: run('Edit Animal'),
    };
    const del: GridRowAction<HarnessAnimal> = {
      label: 'Delete Animal',
      tid: 'harness-delete',
      requiredPermissions: ['animals_write'],
      execute: run('Delete Animal'),
    };
    const open: GridRowAction<HarnessAnimal> = {
      label: 'Open',
      tid: 'harness-open',
      execute: run('Open'),
    };
    const anyOf: GridRowAction<HarnessAnimal> = {
      label: 'View report',
      tid: 'harness-any',
      requiredPermissions: ['reports_view', 'animals_write'],
      execute: run('View report'),
    };
    const deleteNotBessie: GridRowAction<HarnessAnimal> = { ...del, isVisible: notBessie };

    const menu = (tid: string, rowActions: GridRowAction<HarnessAnimal>[]) =>
      staticGridState({ tid, hasPaging: false, rowActionsDisplay: 'menu', rowActions });

    return [
      {
        tid: 'harness-grid-permissions',
        title: 'S3 / S4: Edit + Delete need animals_write; Open needs nothing; View report needs reports_view OR animals_write',
        state: menu('harness-grid-permissions', [edit, del, open, anyOf]),
      },
      {
        tid: 'harness-grid-all-require',
        title: 'S5: every action needs animals_write (no Actions column without it)',
        state: menu('harness-grid-all-require', [edit, del]),
      },
      {
        tid: 'harness-grid-per-row',
        title: 'S6: Edit Animal on every row; Delete Animal hidden for Bessie (isVisible)',
        state: menu('harness-grid-per-row', [edit, deleteNotBessie]),
      },
      {
        tid: 'harness-grid-zero-visible',
        title: 'S7: single action Delete Animal, hidden for Bessie (Bessie has no trigger)',
        state: menu('harness-grid-zero-visible', [deleteNotBessie]),
      },
    ];
  }, []);

  return (
    <div data-tid="component-test-harness" style={{ padding: '1.5rem', display: 'grid', gap: '1.5rem' }}>
      <H1>Component test harness</H1>
      <P>
        Dev / test only: not available in production builds and not linked from any nav. Route:{' '}
        <code>/examples/test-harness</code>
      </P>

      <section data-tid="harness-switch-section">
        <H2>Switch (T-ANIMAL-006/S1, S4)</H2>
        <Switch
          tid="harness-switch"
          label="Demo switch"
          checked={switchOn}
          onChange={(e) => setSwitchOn(e.target.checked)}
        />
        <P>
          Value: <code data-tid="harness-switch-value">{JSON.stringify(switchOn)}</code>
        </P>
        <div style={{ marginTop: '0.75rem' }}>
          <Switch tid="harness-switch-readonly" label="Read-only switch" checked={true} readOnly />
        </div>
      </section>

      <section data-tid="harness-tag-section">
        <H2>Switch + Tag Input via JsonSchemaForm (T-ANIMAL-006/S1, S2, S4)</H2>
        <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input
            type="checkbox"
            data-tid="harness-form-readonly-toggle"
            checked={formReadOnly}
            onChange={(e) => setFormReadOnly(e.target.checked)}
          />
          Read-only form
        </label>
        <JsonSchemaForm
          tid="harness-json-form"
          schema={schema as never}
          uiSchema={uiSchema as never}
          data={formData}
          onChange={setFormData}
          readOnly={formReadOnly}
        />
        <P>Form data (JSON):</P>
        <pre data-tid="harness-json-form-value">{JSON.stringify(formData)}</pre>
        <P>
          isFurry: <code data-tid="harness-json-form-value-isFurry">{JSON.stringify(formData.isFurry ?? null)}</code>
          {' · '}attributes:{' '}
          <code data-tid="harness-json-form-value-attributes">{JSON.stringify(formData.attributes ?? null)}</code>
        </P>
      </section>

      <section data-tid="harness-boolean-icons-section">
        <H2>Boolean icon / switch cells (T-ANIMAL-009/S4–S6)</H2>
        <P>Default labels (Yes / No / Not set)</P>
        <div data-tid="harness-bool-true">{renderBooleanIconCell(true)}</div>
        <div data-tid="harness-bool-false">{renderBooleanIconCell(false)}</div>
        <div data-tid="harness-bool-null">{renderBooleanIconCell(null)}</div>
        <div data-tid="harness-bool-undefined">{renderBooleanIconCell(undefined)}</div>
        <P>Custom labels (trueLabel &quot;Furry&quot;, falseLabel &quot;Not furry&quot;)</P>
        <div data-tid="harness-bool-custom-true">
          {renderBooleanIconCell(true, { trueLabel: 'Furry', falseLabel: 'Not furry' })}
        </div>
        <div data-tid="harness-bool-custom-false">
          {renderBooleanIconCell(false, { trueLabel: 'Furry', falseLabel: 'Not furry' })}
        </div>
        <P>Read-only switch cell (renderBooleanSwitchCell still exported)</P>
        <div data-tid="harness-bool-switch-cell">{renderBooleanSwitchCell(true, 'Still available')}</div>
      </section>

      <section data-tid="harness-actions-section">
        <H2>Row actions menu permissions on the real EntityGrid (T-ANIMAL-007/S3–S7)</H2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
          {permissionPresets.map((preset) => (
            <Button
              key={preset.tid}
              tid={preset.tid}
              theme="secondary-action"
              buttonSize="small"
              onClick={() => setSessionPermissions(preset.permissions)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <P>
          Session permissions:{' '}
          <code data-tid="harness-session-permissions">{sessionPermissions.join(',') || '(none)'}</code>
          {' · '}Last action: <code data-tid="harness-last-action">{lastAction}</code>
        </P>
        {grids.map((grid) => (
          <div key={grid.tid} data-tid={`${grid.tid}-section`} style={{ marginTop: '1rem' }}>
            <P>{grid.title}</P>
            <EntityGrid gridState={grid.state} sessionPermissions={sessionPermissions} />
          </div>
        ))}
      </section>
    </div>
  );
}
