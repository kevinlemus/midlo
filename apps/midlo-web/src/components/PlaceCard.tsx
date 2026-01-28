import React from 'react';
import '../styles/theme.css';

type Props = {
  title?: string;
  distance?: string;
  onClick?: () => void;
};

export default function PlaceCard({ title = 'Place', distance, onClick }: Props) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      style={{
        padding: '12px',
        border: '1px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          fontSize: 'var(--font-size-body)',
          fontWeight: 500,
          marginBottom: distance ? 4 : 0,
        }}
      >
        {title}
      </div>
      {distance && (
        <div
          style={{
            fontSize: 'var(--font-size-caption)',
            color: 'var(--color-muted)',
          }}
        >
          {distance} from midpoint
        </div>
      )}
    </div>
  );
}
