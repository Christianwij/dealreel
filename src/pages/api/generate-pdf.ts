import { NextApiRequest, NextApiResponse } from 'next';
import PDFDocument from 'pdfkit';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=deal-summary.pdf'
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add content to the PDF
    doc
      .fontSize(20)
      .text('Deal Summary Report', { align: 'center' })
      .moveDown();

    if (data.rating) {
      doc
        .fontSize(14)
        .text('Rating', { underline: true })
        .fontSize(12)
        .text(`${data.rating}/10`)
        .moveDown();
    }

    if (data.comments) {
      doc
        .fontSize(14)
        .text('Comments', { underline: true })
        .fontSize(12)
        .text(data.comments)
        .moveDown();
    }

    if (data.summary) {
      doc
        .fontSize(14)
        .text('Summary', { underline: true })
        .fontSize(12)
        .text(data.summary)
        .moveDown();
    }

    doc
      .fontSize(10)
      .text(`Generated on: ${new Date(data.exportedAt).toLocaleString()}`, {
        align: 'right'
      });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
} 