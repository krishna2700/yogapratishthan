"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthPickerPopoverProps {
  /** "YYYY-MM" */
  value: string;
  label: string;
  onChange: (monthKey: string) => void;
}

export function MonthPickerPopover({ value, label, onChange }: MonthPickerPopoverProps) {
  const [selectedYear, selectedMonthIndex] = value.split("-").map(Number) as [number, number];
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(selectedYear);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setPickerYear(selectedYear);
        setOpen(next);
      }}
    >
      <PopoverTrigger
        render={
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          />
        }
      >
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-56">
        <div className="flex items-center justify-between px-1">
          <Button variant="ghost" size="icon-sm" aria-label="Previous year" onClick={() => setPickerYear((y) => y - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold text-foreground">{pickerYear}</p>
          <Button variant="ghost" size="icon-sm" aria-label="Next year" onClick={() => setPickerYear((y) => y + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-1 pb-1">
          {MONTH_ABBREVIATIONS.map((monthLabel, i) => {
            const monthNumber = i + 1;
            const isSelected = pickerYear === selectedYear && monthNumber === selectedMonthIndex;
            return (
              <button
                key={monthLabel}
                type="button"
                onClick={() => {
                  onChange(`${pickerYear}-${String(monthNumber).padStart(2, "0")}`);
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg py-1.5 text-xs font-medium transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {monthLabel}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
