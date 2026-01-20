type LogPanelProps = {
  log: string[];
};

export default function LogPanel({ log }: LogPanelProps) {
  return (
    <section
      style={{
        border: '1px solid #eee',
        borderRadius: 16,
        padding: 14,
        background: 'white',
      }}
    >
      <h2 style={{ margin: '0 0 10px 0' }}>Log</h2>
      <div
        style={{
          maxHeight: 220,
          overflow: 'auto',
          border: '1px solid #f0f0f0',
          borderRadius: 12,
          padding: 10,
          background: '#fafafa',
          whiteSpace: 'pre-wrap',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
        }}
      >
        {log.slice(-50).join('\n')}
      </div>
    </section>
  );
}
