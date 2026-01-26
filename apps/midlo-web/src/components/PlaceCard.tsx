import React from 'react';
import '../styles/theme.css';

type Props = {
  title?: string;
  distance?: string;
};

export default function PlaceCard({ title = 'Place', distance }: Props) {
  return (
    <div
      style={{
        padding: '12px',
        border: '1px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
        boxShadow: 'var(--shadow-card)',
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
