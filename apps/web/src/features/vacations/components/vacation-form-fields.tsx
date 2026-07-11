"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldWrapper } from "@/components/form/field-wrapper";

interface VacationFormFieldsProps {
  idPrefix: string;
  startDate: string;
  endDate: string;
  reason: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  error?: string | null;
}

export function VacationFormFields({
  idPrefix,
  startDate,
  endDate,
  reason,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  error,
}: VacationFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3">
        <FieldWrapper htmlFor={`${idPrefix}-start`} label="Start date" required>
          <Input
            id={`${idPrefix}-start`}
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
          />
        </FieldWrapper>
        <FieldWrapper htmlFor={`${idPrefix}-end`} label="End date" required>
          <Input id={`${idPrefix}-end`} type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} />
        </FieldWrapper>
      </div>
      <FieldWrapper htmlFor={`${idPrefix}-reason`} label="Reason" required>
        <Textarea
          id={`${idPrefix}-reason`}
          rows={2}
          placeholder="e.g. Diwali"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
      </FieldWrapper>
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
