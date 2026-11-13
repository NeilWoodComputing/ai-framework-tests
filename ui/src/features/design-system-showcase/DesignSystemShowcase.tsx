'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Badge,
  Button,
  Callout,
  Checkbox,
  ConfirmModal,
  DropdownMenu,
  H1,
  H2,
  H3,
  Icon,
  Input,
  Modal,
  ModalShell,
  P,
  PageLayout,
  Switch,
} from '@design-system';
import { SiteNav } from '@shell/components/SiteNav';
import styles from './DesignSystemShowcase.module.css';

interface DemoForm {
  name: string;
  email: string;
}

/**
 * Live catalogue for @design-system primitives.
 * Keep sections in sync with src/framework/design-system/README.md when adding controls.
 */
export function DesignSystemShowcase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bladeOpen, setBladeOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [checked, setChecked] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DemoForm>();

  return (
    <PageLayout
      header={
        <>
          <SiteNav />
          <H1>Design system</H1>
          <P>Unity-style primitives for Next.js — buttons, inputs, typography, callouts, and layout.</P>
        </>
      }
    >
      <section className={styles.section}>
        <H3 variant="section">Typography</H3>
        <H2>Heading level 2</H2>
        <P>Body copy using semantic tokens and rem-based sizing (html font-size 62.5%).</P>
      </section>

      <section className={styles.section}>
        <H3 variant="section">Buttons</H3>
        <div className={styles.row}>
          <Button theme="primary-action" tid="btn-primary">
            Primary action
          </Button>
          <Button theme="secondary-action" tid="btn-secondary">
            Secondary
          </Button>
          <Button theme="system-red" tid="btn-red">
            System red
          </Button>
          <Button theme="system-green" tid="btn-green">
            System green
          </Button>
          <Button theme="alternate" tid="btn-alternate">
            Alternate
          </Button>
        </div>
        <div className={styles.row} style={{ marginTop: '1rem' }}>
          <Button theme="primary-action" loading tid="btn-loading">
            Loading
          </Button>
          <Button theme="primary-action" disabled tid="btn-disabled">
            Disabled
          </Button>
          <Button theme="primary-action" buttonSize="small" tid="btn-small">
            Small
          </Button>
          <Button theme="primary-action" circle buttonSize="small" tid="btn-circle">
            +
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <H3 variant="section">Badge</H3>
        <Badge>12</Badge>
      </section>

      <section className={styles.section}>
        <H3 variant="section">Callouts</H3>
        <div className={styles.calloutStack}>
          <Callout type="info">Informational message for the user.</Callout>
          <Callout type="success">Operation completed successfully.</Callout>
          <Callout type="warning">Review before continuing.</Callout>
          <Callout type="error">Something went wrong.</Callout>
        </div>
      </section>

      <section className={styles.section}>
        <H3 variant="section">Modals</H3>
        <P>Reusable overlay primitives mirroring Unity form-modal and confirm dialog patterns.</P>
        <div className={styles.row} style={{ marginTop: '1rem' }}>
          <Button theme="primary-action" tid="open-dialog-modal" onClick={() => setDialogOpen(true)}>
            Dialog modal
          </Button>
          <Button theme="secondary-action" tid="open-blade-modal" onClick={() => setBladeOpen(true)}>
            Blade modal
          </Button>
          <Button theme="system-red" tid="open-confirm-modal" onClick={() => setConfirmOpen(true)}>
            Confirm dialog
          </Button>
        </div>
      </section>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} size="small" tid="demo-dialog-modal">
        <ModalShell
          title="Dialog modal"
          subtitle="Centered presentation"
          onClose={() => setDialogOpen(false)}
          footerLeft={
            <Button theme="secondary-action" onClick={() => setDialogOpen(false)} tid="demo-dialog-cancel">
              Cancel
            </Button>
          }
          footerRight={
            <Button theme="primary-action" onClick={() => setDialogOpen(false)} tid="demo-dialog-confirm">
              Done
            </Button>
          }
        >
          <P>Use Modal for the overlay and ModalShell for header, scrollable body, and footer actions.</P>
        </ModalShell>
      </Modal>

      <Modal
        open={bladeOpen}
        onClose={() => setBladeOpen(false)}
        presentation="blade"
        size="large"
        tid="demo-blade-modal"
      >
        <ModalShell
          title="Blade modal"
          subtitle="Right-hand panel"
          onClose={() => setBladeOpen(false)}
          footerLeft={
            <Button theme="secondary-action" onClick={() => setBladeOpen(false)} tid="demo-blade-cancel">
              Cancel
            </Button>
          }
          footerRight={
            <Button theme="primary-action" onClick={() => setBladeOpen(false)} tid="demo-blade-save">
              Save
            </Button>
          }
        >
          <P>Blade presentation slides in from the right — the default for Unity form modals.</P>
        </ModalShell>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Delete record?"
        message="This action cannot be undone."
        confirmText="Delete"
        refuteText="Cancel"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
        tid="demo-confirm-modal"
      />

      <section className={styles.section}>
        <H3 variant="section">Input</H3>
        <form className={styles.form} onSubmit={handleSubmit(() => undefined)}>
          <Input
            tid="demo-name"
            label="Name"
            requiredField
            placeholder="Enter a name"
            hint="Uses react-hook-form in this demo"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
          <Input
            tid="demo-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email', {
              required: 'Required',
              pattern: { value: /\S+@\S+\.\S+/, message: 'Not a valid email address' },
            })}
          />
          <div>
            <Button theme="primary-action" type="submit" tid="demo-submit">
              Validate form
            </Button>
          </div>
        </form>
      </section>
      <section className={styles.section}>
        <H3 variant="section">Dropdown menu</H3>
        <P>
          Portalled actions menu (Escape / outside click / Tab close; flips above the trigger when
          there is no room below). Used by EntityGrid row Actions.
        </P>
        <div className={styles.row} style={{ marginTop: '1rem' }}>
          <DropdownMenu
            tid="demo-dropdown-menu"
            items={[
              {
                key: 'edit',
                label: 'Edit',
                icon: <Icon name="Edit" size="1.6rem" />,
                tid: 'demo-menu-edit',
                onSelect: () => undefined,
              },
              {
                key: 'delete',
                label: 'Delete',
                tid: 'demo-menu-delete',
                onSelect: () => undefined,
              },
            ]}
            renderTrigger={(triggerProps) => (
              <Button theme="secondary-action" tid="demo-menu-trigger" {...triggerProps}>
                Actions
              </Button>
            )}
          />
        </div>
      </section>

      <section className={styles.section}>
        <H3 variant="section">Checkbox & Switch</H3>
        <P>
          Use these design-system controls for manual forms; schema-driven entity forms go through
          JsonSchemaForm.
        </P>
        <div
          className={styles.row}
          style={{ marginTop: '1rem', flexDirection: 'column', alignItems: 'flex-start', gap: '1.2rem' }}
        >
          <Checkbox
            tid="demo-checkbox"
            label="Accept terms"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <Switch
            tid="demo-switch"
            label="Notifications"
            checked={switchOn}
            onChange={(event) => setSwitchOn(event.target.checked)}
          />
        </div>
      </section>
    </PageLayout>
  );
}
