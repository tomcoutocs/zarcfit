'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
};

/**
 * Multi-select chip input used for dietary restrictions / allergies.
 * Click a suggestion to toggle it, or type a custom tag and press Add/Enter.
 */
export function TagChipInput({ value, onChange, suggestions = [], placeholder, disabled }: Props) {
  const [draft, setDraft] = useState('');

  const normalized = value.map((v) => v.toLowerCase());

  const toggleSuggestion = (tag: string) => {
    if (disabled) return;
    if (normalized.includes(tag.toLowerCase())) {
      onChange(value.filter((v) => v.toLowerCase() !== tag.toLowerCase()));
    } else {
      onChange([...value, tag]);
    }
  };

  const addCustom = () => {
    const tag = draft.trim();
    if (!tag || normalized.includes(tag.toLowerCase())) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  const customTags = value.filter((v) => !suggestions.some((s) => s.toLowerCase() === v.toLowerCase()));

  return (
    <div className="space-y-2">
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((tag) => {
            const active = normalized.includes(tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() => toggleSuggestion(tag)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-input bg-muted px-3 py-1 text-xs font-medium"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder || 'Add custom tag...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" variant="outline" size="icon" onClick={addCustom} disabled={!draft.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
