import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  FileText,
  ShieldCheck,
  X,
} from "lucide-react";
import type { ReactElement } from "react";

import type { StudioCommandId } from "../../commands/studio-commands";
import type {
  DiagnosticFixture,
  PublishViewModel,
} from "../../models/studio-fixtures";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { IconButton } from "../ui/IconButton";

interface PublishConfirmDialogProps {
  onCommand: (commandId: StudioCommandId) => void;
  publish: PublishViewModel;
}

/**
 * Focus-trapped publish approval dialog over a prepared fixture plan.
 *
 * @returns Modal confirmation before the fixture apply state can start.
 */
export function PublishConfirmDialog({
  onCommand,
  publish,
}: PublishConfirmDialogProps): ReactElement {
  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          onCommand("publish.closeConfirm");
          restorePublishConfirmFocus();
        }
      }}
      open
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content
          aria-describedby="publish-confirm-description"
          className="border-border bg-panel shadow-panel fixed top-1/2 left-1/2 z-50 flex max-h-[min(42rem,calc(100vh-2rem))] w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-[var(--radius-panel)] border"
        >
          <div className="border-border flex items-start justify-between gap-4 border-b p-6">
            <div className="min-w-0">
              <Dialog.Title className="text-foreground text-xl font-semibold">
                Confirm publish
              </Dialog.Title>
              <Dialog.Description
                className="text-muted-foreground mt-2 text-sm leading-6"
                id="publish-confirm-description"
              >
                We will publish this site to Cloudflare and save a checkpoint
                first.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close publish confirmation">
                <X aria-hidden="true" />
              </IconButton>
            </Dialog.Close>
          </div>
          <div
            aria-label="Publish confirmation details"
            className="min-h-0 flex-1 overflow-auto p-6"
            tabIndex={0}
          >
            <div className="space-y-5">
              <PublishDialogRow
                icon={<Cloud aria-hidden="true" />}
                label="Destination"
                title={publish.targetProvider.label}
              >
                {publish.plan?.destinationUrl ?? "No destination planned"}
              </PublishDialogRow>
              <PublishDialogRow
                icon={<CheckCircle2 aria-hidden="true" />}
                label="Checkpoint"
                title={
                  publish.plan?.checkpointRequired === true
                    ? "A checkpoint will be saved"
                    : "No checkpoint available"
                }
              >
                You can roll back to this version if needed.
              </PublishDialogRow>
              <PublishDialogRow
                icon={<FileText aria-hidden="true" />}
                label="Summary"
                title="Latest changes will become public"
              >
                This update will be visible to readers after the provider apply
                step succeeds.
              </PublishDialogRow>
              <PublishDialogRow
                icon={<ShieldCheck aria-hidden="true" />}
                label="Credential"
                title={publish.credentialStateLabel}
              >
                Studio is using a redacted credential reference. No secret value
                is stored in this fixture.
              </PublishDialogRow>
              <PublishDialogWarnings diagnostics={publish.diagnostics} />
            </div>
          </div>
          <div className="border-border flex justify-end gap-3 border-t p-6">
            <Dialog.Close asChild>
              <Button>Cancel</Button>
            </Dialog.Close>
            <Button
              onClick={() => onCommand("publish.confirm")}
              variant="primary"
            >
              Publish
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function restorePublishConfirmFocus(): void {
  globalThis.setTimeout(() => {
    const trigger = document.querySelector<HTMLElement>(
      "[data-publish-confirm-trigger]",
    );

    trigger?.focus();
  }, 0);
}

function PublishDialogRow({
  children,
  icon,
  label,
  title,
}: {
  children: string;
  icon: ReactElement;
  label: string;
  title: string;
}): ReactElement {
  return (
    <section className="flex gap-4">
      <div className="bg-panel-muted text-muted-foreground flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          {label}
        </p>
        <h3 className="text-foreground mt-1 text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-5">
          {children}
        </p>
      </div>
    </section>
  );
}

function PublishDialogWarnings({
  diagnostics,
}: {
  diagnostics: readonly DiagnosticFixture[];
}): ReactElement {
  if (diagnostics.length === 0) {
    return (
      <section className="border-border flex items-center justify-between gap-4 border-t pt-5">
        <div>
          <p className="text-muted-foreground text-xs font-semibold uppercase">
            Warnings
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            No blocking diagnostics were found for this fixture plan.
          </p>
        </div>
        <Badge tone="success">Ready</Badge>
      </section>
    );
  }

  return (
    <section className="border-border border-t pt-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-xs font-semibold uppercase">
          Warnings
        </p>
        <Badge tone="warning">{diagnostics.length} warning</Badge>
      </div>
      <ul className="mt-3 space-y-2">
        {diagnostics.map((diagnostic) => (
          <li
            className="border-warning/40 bg-warning-muted rounded-[var(--radius-control)] border p-3"
            key={diagnostic.code}
          >
            <div className="flex gap-2">
              <AlertTriangle
                aria-hidden="true"
                className="text-warning mt-0.5 shrink-0"
                size={16}
              />
              <p className="text-foreground text-sm leading-5">
                {diagnostic.message}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
