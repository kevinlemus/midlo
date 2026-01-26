import React from 'react';
import '../styles/theme.css';

type Props = {
  placeholder?: string;
  value?: string;
  onChange?: (v: string) => void;
};

export default function SearchBar({ placeholder = 'Search', value, onChange }: Props) {
  return (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        padding: '10px 12px',
        border: '1px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        fontSize: 'var(--font-size-body)',
        width: '100%',
      }}
    />
  );
}
