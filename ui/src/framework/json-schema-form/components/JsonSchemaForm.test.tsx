import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SystemSchemaErrorObject } from '../validation/system-schema-validation';
import { JsonSchemaForm } from './JsonSchemaForm';

const schema: JsonSchema = {
  type: 'object',
  properties: { name: { type: 'string' }, dateBorn: { type: 'string', format: 'date' } },
};
const uiSchema = {
  type: 'VerticalLayout',
  elements: [
    { type: 'Control', scope: '#/properties/name', label: 'Name' },
    { type: 'Control', scope: '#/properties/dateBorn', label: 'Date Born' },
  ],
} as UISchemaElement;

/** Parent like useJsonSchemaEntityForm: owns the data and the error list; can hold onChange back to stage a slow render. */
const parent: {
  data: Record<string, unknown>;
  held: Record<string, unknown> | null;
  holdChanges: boolean;
  apply: () => void;
  setErrors: (errors: SystemSchemaErrorObject[]) => void;
} = { data: {}, held: null, holdChanges: false, apply: () => undefined, setErrors: () => undefined };

function Parent({ initial }: { initial: Record<string, unknown> }) {
  const [data, setData] = useState(initial);
  const [errors, setErrors] = useState<SystemSchemaErrorObject[]>([]);
  parent.data = data;
  parent.setErrors = setErrors;
  parent.apply = () => {
    if (parent.held) setData(parent.held);
  };
  return (
    <JsonSchemaForm
      schema={schema}
      uiSchema={uiSchema}
      data={data}
      onChange={(next) => {
        if (parent.holdChanges) parent.held = next;
        else setData(next);
      }}
      validation={{ additionalErrors: errors }}
    />
  );
}

const input = (tid: string) => screen.getByTestId(tid) as HTMLInputElement;

describe('JsonSchemaForm keeps early input (F-46)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    parent.held = null;
    parent.holdChanges = false;
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('keeps Date Born typed while the parent re-renders with the data from before it', () => {
    render(<Parent initial={{ name: '', dateBorn: '' }} />);
    parent.holdChanges = true;

    fireEvent.change(input('name'), { target: { value: 'Bessie' } });
    act(() => vi.advanceTimersByTime(20)); // debounced onChange reports Name only
    fireEvent.change(input('dateBorn'), { target: { value: '2020-01-01' } });
    act(() => parent.apply()); // the parent's render with the Name-only data lands after Date Born was typed

    expect(input('name').value).toBe('Bessie');
    expect(input('dateBorn').value).toBe('2020-01-01');
    parent.holdChanges = false;
    act(() => vi.advanceTimersByTime(20));
    expect(parent.data).toEqual({ name: 'Bessie', dateBorn: '2020-01-01' });
  });

  it('keeps typed input when the error list changes before the parent has the new data', () => {
    render(<Parent initial={{ name: '', dateBorn: '' }} />);

    fireEvent.change(input('name'), { target: { value: 'Bessie' } });
    act(() => parent.setErrors([])); // new array: JsonForms re-applies the (still empty) parent data

    expect(input('name').value).toBe('Bessie');
    act(() => vi.advanceTimersByTime(20));
    expect(parent.data).toEqual({ name: 'Bessie', dateBorn: '' });
  });

  it('still takes new data from the parent (record load / reset)', () => {
    render(<Parent initial={{ name: 'Bessie', dateBorn: '2020-01-01' }} />);
    parent.held = { name: 'Ziggy', dateBorn: '2019-05-05' };
    act(() => parent.apply());

    expect(input('name').value).toBe('Ziggy');
    expect(input('dateBorn').value).toBe('2019-05-05');
  });
});
