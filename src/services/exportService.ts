interface ExportOptions {
  briefingId: string;
  format: string;
  includeRating: boolean;
  includeFeedback: boolean;
  includeHistory: boolean;
}

export async function exportSummary(options: ExportOptions): Promise<void> {
  const response = await fetch('/api/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  if (!response.ok) {
    throw new Error('Failed to export summary');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deal-summary.${options.format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
} 