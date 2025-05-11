console.log('DealReel backend running with LOCAL OCR ONLY');

// Local OCR fallback using tesseract.js
async function performOCR(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(data);
    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      const imageBuffer = canvas.toBuffer('image/png');
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(imageBuffer);
      await worker.terminate();
      fullText += text + '\n';
    }
    if (!fullText) {
      throw new Error('Local OCR did not return any text.');
    }
    return fullText;
  } catch (err) {
    console.error('Local OCR error:', err);
    throw new Error('OCR fallback failed: ' + err.message);
  }
} 