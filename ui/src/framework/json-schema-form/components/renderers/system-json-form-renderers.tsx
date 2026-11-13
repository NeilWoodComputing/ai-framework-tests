'use client';

import {
  and,
  ControlElement,
  GroupLayout,
  isBooleanControl,
  isStringControl,
  JsonFormsRendererRegistryEntry,
  Layout,
  rankWith,
  schemaMatches,
  uiTypeIs,
} from '@jsonforms/core';
import { JsonFormsDispatch, withJsonFormsControlProps, withJsonFormsLayoutProps } from '@jsonforms/react';
import type { ControlProps, LayoutProps } from '@jsonforms/core';

import { useState } from 'react';

import { FormField, FormFieldError, FormFieldLabel, Input, Switch } from '@design-system';

import inputStyles from '@design-system/forms/input/Input.module.css';
import styles from '../JsonSchemaForm.module.css';

/** JsonForms joins a control's error messages with new lines. */
function errorMessages(errors: string | undefined): string[] {
  return errors ? errors.split('\n').filter(Boolean) : [];
}

function firstError(errors: string | undefined): string | undefined {
  return errorMessages(errors)[0];
}

function SystemTextControl({ data, handleChange, path, label, required, enabled, visible, schema, uischema, errors }: ControlProps) {
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const placeholder = typeof control.options?.placeholder === 'string' ? control.options.placeholder : undefined;
  const inputType =
    schema.format === 'email'
      ? 'email'
      : schema.format === 'date' || control.options?.format === 'date'
        ? 'date'
        : 'text';
  const errorMessage = firstError(errors);

  return (
    <Input
      tid={path.replace(/\./g, '-')}
      label={typeof label === 'string' ? label : undefined}
      requiredField={required}
      value={data ?? ''}
      onChange={(event) => handleChange(path, event.target.value)}
      disabled={readonly}
      readOnly={readonly}
      placeholder={placeholder}
      type={inputType}
      maxLength={control.options?.restrict === true && schema.maxLength != null ? schema.maxLength : undefined}
      error={errorMessage}
    />
  );
}

function SystemTextAreaControl({ data, handleChange, path, label, required, enabled, visible, uischema, errors }: ControlProps) {
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const errorMessage = firstError(errors);

  const tid = path.replace(/\./g, '-');

  return (
    <FormField tid={tid}>
      {typeof label === 'string' && label ? (
        <FormFieldLabel htmlFor={tid} requiredField={required}>
          {label}
        </FormFieldLabel>
      ) : null}
      <textarea
        id={tid}
        className={[inputStyles.input, styles.textarea].join(' ')}
        value={data ?? ''}
        onChange={(event) => handleChange(path, event.target.value)}
        disabled={readonly}
        readOnly={readonly}
        rows={4}
        aria-invalid={!!errorMessage}
        data-tid={tid}
      />
      <FormFieldError error={errorMessage} />
    </FormField>
  );
}

function SystemIconPickerControl({ data, handleChange, path, label, required, enabled, visible, uischema, errors }: ControlProps) {
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const placeholder =
    typeof control.options?.searchPlaceholder === 'string'
      ? control.options.searchPlaceholder
      : 'Icon name';
  const errorMessage = firstError(errors);

  return (
    <Input
      tid={`${path.replace(/\./g, '-')}-icon`}
      label={typeof label === 'string' ? label : 'Icon'}
      requiredField={required}
      value={data ?? ''}
      onChange={(event) => handleChange(path, event.target.value)}
      disabled={readonly}
      readOnly={readonly}
      placeholder={placeholder}
      error={errorMessage}
    />
  );
}

function SystemInlineListFormControl({ data, handleChange, path, label, required, enabled, visible, uischema }: ControlProps) {
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const items = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  const emptyText =
    typeof control.options?.emptyText === 'string' ? control.options.emptyText : 'No items yet.';
  const addLabel =
    typeof control.options?.addButtonLabel === 'string' ? control.options.addButtonLabel : 'Add item';

  const updateItem = (index: number, key: 'key' | 'value', value: string) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    handleChange(path, next);
  };

  const addItem = () => {
    handleChange(path, [...items, { key: '', value: '' }]);
  };

  const removeItem = (index: number) => {
    handleChange(
      path,
      items.filter((_, i) => i !== index)
    );
  };

  return (
    <FormField tid={path.replace(/\./g, '-')}>
      {typeof label === 'string' && label ? <FormFieldLabel requiredField={required}>{label}</FormFieldLabel> : null}
      <div className={styles.inlineList}>
      {items.length === 0 ? <p className={styles.inlineListEmpty}>{emptyText}</p> : null}
      {items.map((item, index) => (
        <div key={index} className={styles.inlineListRow}>
          <Input
            tid={`${path}-key-${index}`}
            hideLabel
            placeholder="Key"
            value={String(item.key ?? '')}
            onChange={(event) => updateItem(index, 'key', event.target.value)}
            disabled={readonly}
            readOnly={readonly}
          />
          <Input
            tid={`${path}-value-${index}`}
            hideLabel
            placeholder="Value"
            value={String(item.value ?? '')}
            onChange={(event) => updateItem(index, 'value', event.target.value)}
            disabled={readonly}
            readOnly={readonly}
          />
          {!readonly ? (
            <button type="button" className={styles.inlineListRemove} onClick={() => removeItem(index)}>
              Remove
            </button>
          ) : null}
        </div>
      ))}
      {!readonly ? (
        <button type="button" className={styles.inlineListAdd} onClick={addItem}>
          {addLabel}
        </button>
      ) : null}
      </div>
    </FormField>
  );
}

function SystemFieldGridLayout({ uischema, schema, path, enabled, visible, renderers, cells }: LayoutProps) {
  if (!visible) return null;

  const layout = uischema as Layout & { options?: { columnClass?: string } };
  const columnClass = layout.options?.columnClass ?? 'col-md-6';

  return (
    <div className={[styles.fieldGrid, columnClass === 'col-12' ? styles.fieldGridFull : ''].filter(Boolean).join(' ')}>
      {layout.elements?.map((child, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={child}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </div>
  );
}

function SystemVerticalLayout({ uischema, schema, path, enabled, visible, renderers, cells }: LayoutProps) {
  if (!visible) return null;

  const layout = uischema as Layout;

  return (
    <div className={styles.verticalLayout}>
      {layout.elements?.map((child, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={child}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </div>
  );
}

function SystemHorizontalLayout({ uischema, schema, path, enabled, visible, renderers, cells }: LayoutProps) {
  if (!visible) return null;

  const layout = uischema as Layout;

  return (
    <div className={styles.horizontalLayout}>
      {layout.elements?.map((child, index) => (
        <JsonFormsDispatch
          key={`${path}-${index}`}
          uischema={child}
          schema={schema}
          path={path}
          enabled={enabled}
          renderers={renderers}
          cells={cells}
        />
      ))}
    </div>
  );
}

function SystemSwitchControl({ data, handleChange, path, label, enabled, visible, uischema, errors }: ControlProps) {
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const tid = path.replace(/\./g, '-');
  const errorMessage = firstError(errors);

  return (
    <FormField tid={`${tid}-field`}>
      <Switch
        tid={tid}
        label={typeof label === 'string' ? label : undefined}
        checked={data === true}
        readOnly={readonly}
        onChange={(event) => handleChange(path, event.target.checked)}
        aria-invalid={!!errorMessage}
      />
      <FormFieldError error={errorMessage} />
    </FormField>
  );
}

function SystemTagInputControl({ data, handleChange, path, label, required, enabled, visible, uischema, errors }: ControlProps) {
  const [draft, setDraft] = useState('');
  if (!visible) return null;

  const control = uischema as ControlElement;
  const readonly = control.options?.readonly === true || !enabled;
  const tags = Array.isArray(data) ? (data as unknown[]).map((tag) => String(tag ?? '')) : [];
  const tid = path.replace(/\./g, '-');
  const placeholder = typeof control.options?.placeholder === 'string' ? control.options.placeholder : undefined;
  const messages = errorMessages(errors);

  const addTag = () => {
    if (!draft.trim()) return;
    handleChange(path, [...tags, draft]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    handleChange(
      path,
      tags.filter((_, i) => i !== index)
    );
  };

  return (
    <FormField tid={`${tid}-field`}>
      {typeof label === 'string' && label ? (
        <FormFieldLabel htmlFor={tid} requiredField={required}>
          {label}
        </FormFieldLabel>
      ) : null}
      <div className={styles.tagInput} data-tid={`${tid}-tags`}>
        {tags.map((tag, index) => (
          <span key={`${tag}-${index}`} className={styles.tagChip} data-tid={`${tid}-tag-${index}`}>
            <span className={styles.tagChipText}>{tag}</span>
            {!readonly ? (
              <button
                type="button"
                className={styles.tagChipRemove}
                aria-label={`Remove ${tag}`}
                data-tid={`${tid}-tag-${index}-remove`}
                onClick={() => removeTag(index)}
              >
                ×
              </button>
            ) : null}
          </span>
        ))}
        {!readonly ? (
          <input
            id={tid}
            data-tid={tid}
            className={[inputStyles.input, styles.tagInputField].join(' ')}
            value={draft}
            placeholder={placeholder}
            aria-invalid={messages.length > 0}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTag();
              }
            }}
          />
        ) : null}
      </div>
      {messages.map((message) => (
        <FormFieldError key={message} error={message} />
      ))}
    </FormField>
  );
}

function SystemGroupLayout({ uischema, schema, path, enabled, visible, renderers, cells }: LayoutProps) {
  if (!visible) return null;

  const group = uischema as GroupLayout;

  return (
    <fieldset className={styles.group}>
      {group.label ? <legend className={styles.groupLegend}>{group.label}</legend> : null}
      <div className={styles.verticalLayout}>
        {group.elements?.map((child, index) => (
          <JsonFormsDispatch
            key={`${path}-${index}`}
            uischema={child}
            schema={schema}
            path={path}
            enabled={enabled}
            renderers={renderers}
            cells={cells}
          />
        ))}
      </div>
    </fieldset>
  );
}

const textControlTester = rankWith(2, isStringControl);
const textAreaTester = rankWith(3, uiTypeIs('TextArea'));
const iconPickerTester = rankWith(3, uiTypeIs('IconPicker'));
const inlineListTester = rankWith(3, uiTypeIs('InlineListForm'));
const fieldGridTester = rankWith(2, uiTypeIs('FieldGridLayout'));
const verticalLayoutTester = rankWith(1, uiTypeIs('VerticalLayout'));
const horizontalLayoutTester = rankWith(1, uiTypeIs('HorizontalLayout'));
const groupLayoutTester = rankWith(2, uiTypeIs('Group'));
const switchTester = rankWith(3, isBooleanControl);
const tagInputTester = rankWith(
  3,
  and(
    uiTypeIs('Control'),
    schemaMatches((schema) => {
      if (schema.type !== 'array' || !schema.items || Array.isArray(schema.items)) return false;
      return (schema.items as { type?: unknown }).type === 'string';
    })
  )
);

/** Custom renderers for System UI schemas (reference data and future schema forms). */
export const systemJsonFormRenderers: JsonFormsRendererRegistryEntry[] = [
  { tester: textAreaTester, renderer: withJsonFormsControlProps(SystemTextAreaControl) },
  { tester: iconPickerTester, renderer: withJsonFormsControlProps(SystemIconPickerControl) },
  { tester: inlineListTester, renderer: withJsonFormsControlProps(SystemInlineListFormControl) },
  { tester: switchTester, renderer: withJsonFormsControlProps(SystemSwitchControl) },
  { tester: tagInputTester, renderer: withJsonFormsControlProps(SystemTagInputControl) },
  { tester: textControlTester, renderer: withJsonFormsControlProps(SystemTextControl) },
  { tester: fieldGridTester, renderer: withJsonFormsLayoutProps(SystemFieldGridLayout) },
  { tester: groupLayoutTester, renderer: withJsonFormsLayoutProps(SystemGroupLayout) },
  { tester: verticalLayoutTester, renderer: withJsonFormsLayoutProps(SystemVerticalLayout) },
  { tester: horizontalLayoutTester, renderer: withJsonFormsLayoutProps(SystemHorizontalLayout) },
];
