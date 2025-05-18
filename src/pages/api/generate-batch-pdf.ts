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
    const { briefings, exportedAt } = req.body;
    const doc = new PDFDocument();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=deal-summaries.pdf'
    );

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add title
    doc
      .fontSize(24)
      .text('Deal Summaries Report', { align: 'center' })
      .moveDown(2);

    // Add each briefing to the PDF
    briefings.forEach((briefing: any, index: number) => {
      // Add page break after first briefing
      if (index > 0) {
        doc.addPage();
      }

      doc
        .fontSize(18)
        .text(`Deal ${index + 1}: ${briefing.briefingId}`, { underline: true })
        .moveDown();

      if (briefing.rating) {
        doc
          .fontSize(14)
          .text('Rating', { underline: true })
          .fontSize(12)
          .text(`${briefing.rating}/10`)
          .moveDown();
      }

      if (briefing.comments) {
        doc
          .fontSize(14)
          .text('Comments', { underline: true })
          .fontSize(12)
          .text(briefing.comments)
          .moveDown();
      }

      if (briefing.summary) {
        doc
          .fontSize(14)
          .text('Summary', { underline: true })
          .fontSize(12)
          .text(briefing.summary)
          .moveDown();
      }
    });

    // Add generation timestamp
    doc
      .fontSize(10)
      .text(`Generated on: ${new Date(exportedAt).toLocaleString()}`, {
        align: 'right'
      });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating batch PDF:', error);
    res.status(500).json({ error: 'Failed to generate batch PDF' });
  }
} 