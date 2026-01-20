import { type ReactNode } from 'react';

type ActionButtonProps = {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
};

export default function ActionButton({
  children,
  disabled,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid #ddd',
        background: disabled ? '#f5f5f5' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
