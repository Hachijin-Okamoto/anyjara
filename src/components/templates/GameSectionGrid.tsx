import { type ReactNode } from 'react';

type GameSectionGridProps = {
  children: ReactNode;
};

export default function GameSectionGrid({ children }: GameSectionGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: 16,
        alignItems: 'start',
      }}
    >
      {children}
    </div>
  );
}
