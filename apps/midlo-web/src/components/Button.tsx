import React from 'react';
import '../styles/theme.css';

type Variant = 'primary' | 'secondary';

type Props = {
  title?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: Variant;
};

export default function Button({
  title = 'Button',
  onClick,
  disabled,
  variant = 'primary',
}: Props) {
  const isPrimary = variant === 'primary';

  const backgroundColor = disabled
    ? 'var(--color-muted)'
    : isPrimary
    ? 'var(--color-bright)'
    : 'var(--color-surface)';

  const borderColor = isPrimary ? 'transparent' : 'var(--color-accent)';
  const textColor = isPrimary ? 'var(--color-surface)' : 'var(--color-primary-dark)';
  const boxShadow = isPrimary && !disabled ? 'var(--shadow-card)' : 'none';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        backgroundColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-pill)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 'var(--font-size-body)',
        fontWeight: 500,
        boxShadow,
        transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out, background-color 0.12s ease-out',
      }}
      onMouseDown={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      {title}
    </button>
  );
}
