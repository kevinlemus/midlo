import React from 'react';
import '../styles/theme.css';

type Props = {
  height?: number;
};

export default function MapView({ height = 260 }: Props) {
  return (
    <div
      style={{
        width: '100%',
        height,
        border: '1px solid var(--color-divider)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-muted)',
        fontSize: 'var(--font-size-caption)',
      }}
    >
      Map placeholder
    </div>
  );
}
