'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormSelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps {
  label: string;
  options: FormSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
}

export function FormSelect({
  label,
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  helperText,
  error,
  className,
}: FormSelectProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </Label>
      )}
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={label}
          className={cn(
            error && 'border-error focus:ring-error',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white border border-[#d9defd] rounded-[12px] shadow-[2px_4px_6px_rgba(0,0,0,0.12)] p-0">
          <div className="px-3 py-2 space-y-[6px]">
            {options.map((option) => {
              const isSelected = value === option.value;

              return (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={cn(
                    // Slightly more compact than the trigger while keeping consistent look
                    'flex h-9 items-center gap-2 w-full rounded-[8px] px-3 py-1 text-left border border-[#9333ea] data-[state=checked]:bg-[#eff0fc] data-[state=checked]:shadow-[2px_4px_6px_rgba(0,0,0,0.12)]'
                  )}
                >
                  {!isSelected && (
                    <span className="relative inline-flex h-5 w-5 items-center justify-center">
                      <span className="absolute inset-[16.67%] rounded-full border border-[#9333ea]" />
                      <span className="absolute inset-[33.33%] rounded-full bg-[#9333ea] opacity-0 transition-opacity" />
                    </span>
                  )}
                  <span className="text-sm leading-none text-[#4a4b50]">
                    {option.label}
                  </span>
                </SelectItem>
              );
            })}
          </div>
        </SelectContent>
      </Select>
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
