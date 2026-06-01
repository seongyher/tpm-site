import { AlertCircle } from "lucide-react";
import type {
  Dispatch,
  KeyboardEvent,
  ReactElement,
  SetStateAction,
} from "react";

import { cn } from "../../lib/cn";
import type {
  DiagnosticFixture,
  FieldDescriptorFixture,
  FieldSectionFixture,
  FieldValueFixture,
  MediaItemFixture,
} from "../../models/studio-fixtures";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

/** Local form draft values keyed by descriptor field ID. */
export type DraftFieldValues = ReadonlyMap<string, FieldValueFixture>;

interface DescriptorFormProps {
  diagnostics: readonly DiagnosticFixture[];
  draftValues: DraftFieldValues;
  mediaItems: readonly MediaItemFixture[];
  sections: readonly FieldSectionFixture[];
  setDraftValues: Dispatch<SetStateAction<DraftFieldValues>>;
}

/**
 * Descriptor-backed form renderer for Studio source/config fields.
 *
 * @returns Accessible form sections rendered from field descriptors.
 */
export function DescriptorForm({
  diagnostics,
  draftValues,
  mediaItems,
  sections,
  setDraftValues,
}: DescriptorFormProps): ReactElement {
  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => event.preventDefault()}
    >
      {sections.map((section) => (
        <section className="flex flex-col gap-4" key={section.id}>
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">
            {section.label}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {section.fields.map((field) => (
              <FieldRenderer
                diagnostics={diagnostics}
                draftValues={draftValues}
                field={field}
                key={field.id}
                mediaItems={mediaItems}
                setDraftValues={setDraftValues}
              />
            ))}
          </div>
        </section>
      ))}
    </form>
  );
}

function FieldRenderer({
  diagnostics,
  draftValues,
  field,
  mediaItems,
  setDraftValues,
}: {
  diagnostics: readonly DiagnosticFixture[];
  draftValues: DraftFieldValues;
  field: FieldDescriptorFixture;
  mediaItems: readonly MediaItemFixture[];
  setDraftValues: DescriptorFormProps["setDraftValues"];
}): ReactElement {
  const value = draftValues.get(field.id) ?? field.draftValue ?? field.value;
  const diagnostic = fieldDiagnostic(field, diagnostics);
  const invalid = field.validation.status === "invalid";
  const message = diagnostic?.message ?? requiredMessage(field, value);
  const controlId = `studio-field-${field.id}`;
  const helpId = field.helpText === undefined ? undefined : `${controlId}-help`;
  const messageId =
    invalid && message !== undefined ? `${controlId}-message` : undefined;
  const describedBy = describedByValue(helpId, messageId);

  if (field.input === "image-reference") {
    return (
      <ImageReferenceField
        describedBy={describedBy}
        diagnostic={diagnostic}
        field={field}
        helpId={helpId}
        invalid={invalid}
        mediaItems={mediaItems}
        message={message}
        messageId={messageId}
        value={value}
      />
    );
  }

  return (
    <label
      className={cn(
        "flex min-w-0 flex-col gap-2",
        field.input === "textarea" && "md:col-span-2",
      )}
      htmlFor={controlId}
    >
      <FieldLabel field={field} />
      <FieldControl
        describedBy={describedBy}
        field={field}
        id={controlId}
        invalid={invalid}
        onValueChange={(nextValue) =>
          setDraftValues((currentValues) =>
            nextDraftValues(currentValues, field.id, nextValue),
          )
        }
        value={value}
      />
      {field.helpText === undefined ? null : (
        <span className="text-muted-foreground text-xs leading-5" id={helpId}>
          {field.helpText}
        </span>
      )}
      <ValidationMessage id={messageId} invalid={invalid} message={message} />
      <FieldEffects field={field} />
    </label>
  );
}

function FieldControl({
  describedBy,
  field,
  id,
  invalid,
  onValueChange,
  value,
}: {
  describedBy: string | undefined;
  field: FieldDescriptorFixture;
  id: string;
  invalid: boolean;
  onValueChange: (value: FieldValueFixture) => void;
  value: FieldValueFixture;
}): ReactElement {
  const className = cn(
    "border-border bg-panel text-foreground focus-visible:outline-accent min-h-10 rounded-[var(--radius-control)] border px-3 py-2 text-sm focus-visible:outline-2",
    invalid && "border-danger focus-visible:outline-danger",
  );

  switch (field.input) {
    case "date":
      return (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={className}
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          type="date"
          value={stringValue(value)}
        />
      );
    case "image-reference":
      return (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={className}
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          type="text"
          value={stringValue(value)}
        />
      );
    case "multi-select":
      return (
        <TagInput
          describedBy={describedBy}
          id={id}
          invalid={invalid}
          onValueChange={onValueChange}
          value={value}
        />
      );
    case "select":
      return (
        <select
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={className}
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          value={stringValue(value)}
        >
          <option value={stringValue(value)}>{stringValue(value)}</option>
        </select>
      );
    case "text":
    case "url":
      return (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={className}
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          type={field.input === "url" ? "url" : "text"}
          value={stringValue(value)}
        />
      );
    case "textarea":
      return (
        <textarea
          aria-describedby={describedBy}
          aria-invalid={invalid}
          className={cn(className, "min-h-24 resize-y leading-6")}
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.value)}
          value={stringValue(value)}
        />
      );
    case "toggle":
      return (
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid}
          checked={Boolean(value)}
          className="accent-accent size-5"
          id={id}
          onChange={(event) => onValueChange(event.currentTarget.checked)}
          type="checkbox"
        />
      );
  }
}

function FieldEffects({
  field,
}: {
  field: FieldDescriptorFixture;
}): null | ReactElement {
  if (field.generatedEffects.length === 0) {
    return null;
  }

  return (
    <span className="flex flex-wrap gap-1">
      {field.generatedEffects.slice(0, 3).map((effect) => (
        <Badge key={effect} tone="neutral">
          {effect.replace("-", " ")}
        </Badge>
      ))}
    </span>
  );
}

function FieldLabel({
  field,
}: {
  field: FieldDescriptorFixture;
}): ReactElement {
  return (
    <span className="text-foreground flex items-center gap-1 text-sm font-medium">
      {field.label}
      {field.required ? (
        <span className="text-danger" title="Required">
          *
        </span>
      ) : null}
    </span>
  );
}

function ImageReferenceField({
  describedBy,
  diagnostic,
  field,
  helpId,
  invalid,
  mediaItems,
  message,
  messageId,
  value,
}: {
  describedBy: string | undefined;
  diagnostic: DiagnosticFixture | undefined;
  field: FieldDescriptorFixture;
  helpId: string | undefined;
  invalid: boolean;
  mediaItems: readonly MediaItemFixture[];
  message: string | undefined;
  messageId: string | undefined;
  value: FieldValueFixture;
}): ReactElement {
  const media =
    typeof value === "string"
      ? mediaItems.find((candidate) => candidate.id === value)
      : undefined;

  return (
    <div className="md:col-span-2">
      <div className="mb-2">
        <FieldLabel field={field} />
      </div>
      <div
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={cn(
          "border-border bg-panel flex min-w-0 items-center justify-between gap-4 rounded-[var(--radius-panel)] border p-3",
          invalid && "border-danger",
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          {media === undefined ? (
            <div className="bg-panel-muted size-16 rounded-[var(--radius-control)]" />
          ) : (
            <img
              alt={media.altText}
              className="size-16 rounded-[var(--radius-control)] object-cover"
              src={media.thumbnailUrl}
            />
          )}
          <div className="min-w-0">
            <p className="text-foreground truncate text-sm font-medium">
              {media?.displayName ?? "No image selected"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              {media?.dimensions === undefined
                ? "Choose an image for social previews and article cards."
                : `${media.dimensions.width} x ${media.dimensions.height}`}
            </p>
          </div>
        </div>
        <Button size="sm">Replace</Button>
      </div>
      {field.helpText === undefined ? null : (
        <p className="text-muted-foreground mt-2 text-xs leading-5" id={helpId}>
          {field.helpText}
        </p>
      )}
      {diagnostic === undefined ? null : (
        <p className="text-warning mt-2 flex items-center gap-2 text-sm">
          <AlertCircle aria-hidden="true" />
          {diagnostic.message}
        </p>
      )}
      <ValidationMessage id={messageId} invalid={invalid} message={message} />
      <FieldEffects field={field} />
    </div>
  );
}

function TagInput({
  describedBy,
  id,
  invalid,
  onValueChange,
  value,
}: {
  describedBy: string | undefined;
  id: string;
  invalid: boolean;
  onValueChange: (value: FieldValueFixture) => void;
  value: FieldValueFixture;
}): ReactElement {
  const tags = isStringList(value) ? value : [];

  return (
    <div
      className={cn(
        "border-border bg-panel flex min-h-10 flex-wrap items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2",
        invalid && "border-danger",
      )}
    >
      {tags.map((tag) => (
        <Badge key={tag} tone="neutral">
          {tag}
        </Badge>
      ))}
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className="text-foreground placeholder:text-muted-foreground min-w-28 flex-1 bg-transparent text-sm outline-none"
        id={id}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) =>
          updateTagsFromKeyboard(event, tags, onValueChange)
        }
        placeholder="Add tag"
        type="text"
      />
    </div>
  );
}

function ValidationMessage({
  id,
  invalid,
  message,
}: {
  id: string | undefined;
  invalid: boolean;
  message: string | undefined;
}): null | ReactElement {
  if (!invalid || message === undefined) {
    return null;
  }

  return (
    <span className="text-danger flex items-center gap-2 text-sm" id={id}>
      <AlertCircle aria-hidden="true" />
      {message}
    </span>
  );
}

function fieldDiagnostic(
  field: FieldDescriptorFixture,
  diagnostics: readonly DiagnosticFixture[],
): DiagnosticFixture | undefined {
  return field.validation.diagnosticCode === undefined
    ? undefined
    : diagnostics.find(
        (diagnostic) => diagnostic.code === field.validation.diagnosticCode,
      );
}

function nextDraftValues(
  currentValues: DraftFieldValues,
  fieldId: string,
  value: FieldValueFixture,
): DraftFieldValues {
  const nextValues = new Map(currentValues);

  nextValues.set(fieldId, value);

  return nextValues;
}

function requiredMessage(
  field: FieldDescriptorFixture,
  value: FieldValueFixture,
): string | undefined {
  return field.required && stringValue(value).trim().length === 0
    ? `${field.label} is required.`
    : undefined;
}

function stringValue(value: FieldValueFixture): string {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value === null) {
    return "";
  }

  return String(value);
}

function tagValues(
  currentTags: readonly string[],
  draftTag: string,
): readonly string[] {
  const nextTag = draftTag.trim();

  return nextTag.length === 0 || currentTags.includes(nextTag)
    ? currentTags
    : [...currentTags, nextTag];
}

function updateTagsFromKeyboard(
  event: KeyboardEvent<HTMLInputElement>,
  currentTags: readonly string[],
  onValueChange: (value: FieldValueFixture) => void,
): void {
  if (event.key !== "Enter" && event.key !== ",") {
    return;
  }

  event.preventDefault();
  onValueChange(tagValues(currentTags, event.currentTarget.value));
}

function isStringList(value: FieldValueFixture): value is readonly string[] {
  return Array.isArray(value);
}

function describedByValue(
  ...ids: ReadonlyArray<string | undefined>
): string | undefined {
  const presentIds = ids.filter((id): id is string => id !== undefined);

  return presentIds.length === 0 ? undefined : presentIds.join(" ");
}
