import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AbstractEntityDataProvider } from '@entity-framework/providers/abstract-entity.data-provider';
import type { SystemJsonSchema } from '../models/system-json-schema.model';
import { useJsonSchemaEntityForm } from './use-json-schema-entity-form';

const schema: SystemJsonSchema = {
  title: 'Animal',
  type: 'object',
  properties: {
    name: { title: 'Name', modelPropertyName: 'name', type: 'string' },
    dateBorn: { title: 'Date Born', modelPropertyName: 'dateBorn', type: 'string', format: 'date' },
  },
};

vi.mock('../services/json-schema-data.service', () => ({
  fetchSystemJsonSchema: vi.fn(() => Promise.resolve(schema)),
}));

interface Animal {
  id: string;
  name: string;
  dateBorn: string;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function setup(reads: Promise<Animal>[]) {
  const read = vi.fn(() => reads.shift() ?? Promise.reject(new Error('no read queued')));
  const provider = { setParentPath: vi.fn(), read } as unknown as AbstractEntityDataProvider<Animal>;
  return renderHook(() =>
    useJsonSchemaEntityForm<Animal>({
      provider,
      createSchemaUrl: 'schemas/create-animal',
      updateSchemaUrl: 'schemas/create-animal',
      buildUiSchema: () => ({ type: 'VerticalLayout', elements: [] }) as never,
      schemaDrivenValidation: true,
    })
  );
}

describe('useJsonSchemaEntityForm ignores a superseded load (F-46)', () => {
  afterEach(() => vi.clearAllMocks());

  it('a slower earlier load (Strict Mode mount / unmount / mount) does not re-bind and wipe typed input', async () => {
    const first = deferred<Animal>();
    const second = deferred<Animal>();
    const { result } = setup([first.promise, second.promise]);

    let firstLoad!: Promise<unknown>;
    let secondLoad!: Promise<unknown>;
    act(() => {
      firstLoad = result.current.initializeEdit('a1');
      result.current.reset();
      secondLoad = result.current.initializeEdit('a1');
    });
    await act(async () => {
      second.resolve({ id: 'a1', name: 'Bessie', dateBorn: '2020-01-01' });
      await secondLoad;
    });
    expect(result.current.schemaLoading).toBe(false);
    expect(result.current.formData).toMatchObject({ name: 'Bessie', dateBorn: '2020-01-01' });

    act(() => result.current.setFormData({ ...result.current.formData, dateBorn: '2019-03-04' }));
    await act(async () => {
      first.resolve({ id: 'a1', name: 'Stale', dateBorn: '2000-01-01' });
      await firstLoad;
    });

    expect(result.current.formData).toMatchObject({ name: 'Bessie', dateBorn: '2019-03-04' });
    expect(result.current.schemaLoading).toBe(false);
  });

  it('stays loading until the newest load finishes', async () => {
    const first = deferred<Animal>();
    const second = deferred<Animal>();
    const { result } = setup([first.promise, second.promise]);

    let firstLoad!: Promise<unknown>;
    act(() => {
      firstLoad = result.current.initializeEdit('a1');
      void result.current.initializeEdit('a2');
    });
    await act(async () => {
      first.resolve({ id: 'a1', name: 'Old', dateBorn: '2000-01-01' });
      await firstLoad;
    });

    expect(result.current.schemaLoading).toBe(true);
    expect(result.current.formVm).toBeNull();
    await act(async () => second.resolve({ id: 'a2', name: 'Ziggy', dateBorn: '2021-02-02' }));
    expect(result.current.formData).toMatchObject({ name: 'Ziggy' });
    expect(result.current.editingId).toBe('a2');
  });
});
