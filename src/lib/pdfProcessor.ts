import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js to use main thread processing by providing a valid worker source
function configureWorker() {
  console.log('Configuring PDF.js worker...');

  try {
    // Use the worker file we have in public directory
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    console.log('✅ PDF.js worker configured with local worker file');
    return true;
  } catch (error) {
    console.warn('Local worker failed, trying CDN fallback:', error);

    try {
      // Fallback to CDN worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
      console.log('✅ PDF.js worker configured with CDN fallback');
      return true;
    } catch (cdnError) {
      console.error('CDN worker also failed:', cdnError);

      try {
        // Last resort: delete the property
        delete (pdfjsLib.GlobalWorkerOptions as any).workerSrc;
        console.log('✅ PDF.js worker disabled by deleting workerSrc property');
        return true;
      } catch (deleteError) {
        console.error('All worker configuration methods failed:', deleteError);
        return false;
      }
    }
  }
}

// Configure worker immediately and store result
const workerConfigured = configureWorker();

// Function to clean up married couple names for filename
function cleanMarriedCoupleName(name: string): string {
  // Handle married couple names like "Celia & Felipe Ramirez's" -> "CeliaFelipeRamirezs"
  return name
    .replace(/\s*&\s*/g, '') // Remove & and surrounding spaces
    .replace(/\s+/g, '') // Remove all remaining spaces
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[^A-Za-z]/g, ''); // Remove any other non-letter characters
}

interface ExtractedInfo {
  customerName: string;
  accountNumber: string;
  fileName: string;
  pageIndex: number;
}

interface ProcessedFile {
  info: ExtractedInfo;
  blob: Blob;
}

interface ProcessResult {
  files: ProcessedFile[];
  errors: string[];
}

export async function processPDF(
  file: File,
  accountPattern: string,
  namePattern: string,
  monthYear: string,
  onProgress: (progress: number) => void
): Promise<ProcessResult> {
  try {
    console.log('Starting PDF processing...');
    console.log('PDF.js worker configuration:', pdfjsLib.GlobalWorkerOptions.workerSrc);

    const arrayBuffer = await file.arrayBuffer();
    console.log('File loaded, creating PDF document...');
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF loaded with ${pageCount} pages`);
    
    const processedFiles: ProcessedFile[] = [];
    const errors: string[] = [];

    // Load PDF for text extraction
    console.log('Loading PDF for text extraction...');

    // Ensure worker is configured before creating loading task
    const workerConfigSuccess = configureWorker();
    if (!workerConfigSuccess) {
      console.warn('Worker configuration failed, but continuing with processing...');
    }
    console.log('PDF.js GlobalWorkerOptions state:', {
      workerSrc: pdfjsLib.GlobalWorkerOptions.workerSrc,
      hasWorkerSrc: 'workerSrc' in pdfjsLib.GlobalWorkerOptions
    });

    let pdfDocument;
    try {
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer
      });
      pdfDocument = await loadingTask.promise;
      console.log('✅ PDF document loaded for text extraction successfully');
    } catch (workerError) {
      console.error('❌ PDF loading failed with worker error:', workerError);
      throw new Error(`PDF.js loading failed: ${workerError.message}`);
    }

  for (let i = 0; i < pageCount; i++) {
    try {
      onProgress((i / pageCount) * 100);

      // Extract text from page
      const page = await pdfDocument.getPage(i + 1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => item.str)
        .map((item: any) => item.str)
        .join(' ');

      console.log(`Page ${i + 1} extracted text (first 500 chars):`, pageText.substring(0, 500));

      // Extract customer name and account number using multiple patterns
      let accountNumber = '';
      let customerName = '';

      // Try account patterns
      const accountPatterns = accountPattern.split('|');
      for (const pattern of accountPatterns) {
        const match = pageText.match(new RegExp(pattern, 'i'));
        if (match && match[1]) {
          accountNumber = match[1];
          console.log(`✅ Page ${i + 1} - Account found with pattern "${pattern}": ${accountNumber}`);
          break;
        }
      }

      // Try name patterns
      const namePatterns = namePattern.split('|');
      for (const pattern of namePatterns) {
        const match = pageText.match(new RegExp(pattern, 'i'));
        if (match && match[1]) {
          customerName = match[1].trim();
          console.log(`✅ Page ${i + 1} - Name found with pattern "${pattern}": ${customerName}`);
          break;
        }
      }

      // If no name found, try some fallback strategies
      if (!customerName && accountNumber) {
        console.log(`⚠️ Page ${i + 1} - No name found with patterns, trying fallback strategies...`);

        // Look for common name indicators near the account number
        const fallbackPatterns = [
          // Look for names before account numbers
          `([A-Z][a-z]+\\s+[A-Z][a-z]+).*${accountNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          // Look for names after common words
          '(?:dear|to|for|customer|client|account\\s*holder)\\s*:?\\s*([A-Z][a-z]+\\s+[A-Z][a-z]+)',
          // Look for any capitalized name pattern
          '([A-Z][a-z]+\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)',
        ];

        for (const fallbackPattern of fallbackPatterns) {
          const match = pageText.match(new RegExp(fallbackPattern, 'i'));
          if (match && match[1]) {
            customerName = match[1].trim();
            console.log(`✅ Page ${i + 1} - Name found with fallback pattern: ${customerName}`);
            break;
          }
        }
      }

      if (!accountNumber || !customerName) {
        const missingInfo = [];
        if (!accountNumber) missingInfo.push('account number');
        if (!customerName) missingInfo.push('customer name');

        console.log(`❌ Page ${i + 1} - Missing: ${missingInfo.join(' and ')}`);
        console.log(`Page ${i + 1} text sample:`, pageText.substring(0, 200) + '...');

        errors.push(`Page ${i + 1}: Could not extract ${missingInfo.join(' and ')} - check patterns or text format`);
        continue;
      }

      // Format customer name - handle married couples and regular names
      let formattedName: string;
      if (customerName.includes('&')) {
        // Handle married couple names: "Celia & Felipe Ramirez's" -> "CeliaFelipeRamirezs"
        formattedName = cleanMarriedCoupleName(customerName);
        console.log(`✅ Page ${i + 1} - Married couple name processed: "${customerName}" -> "${formattedName}"`);
      } else {
        // Regular name processing: replace spaces with underscores
        formattedName = customerName.replace(/\s+/g, '_');
      }

      // Generate filename - Account number first, then customer name
      const fileName = monthYear
        ? `${accountNumber}_${formattedName}_${monthYear.replace(/\s+/g, '_')}.pdf`
        : `${accountNumber}_${formattedName}.pdf`;

      // Create new PDF with single page
      const newPdfDoc = await PDFDocument.create();
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
      newPdfDoc.addPage(copiedPage);

      // Generate PDF bytes
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      processedFiles.push({
        info: {
          customerName,
          accountNumber,
          fileName,
          pageIndex: i
        },
        blob
      });

    } catch (error) {
      errors.push(`Page ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  onProgress(100);
  return { files: processedFiles, errors };
  } catch (error) {
    console.error('PDF processing error:', error);
    return { 
      files: [], 
      errors: [`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
    };
  }
}

export function generateSamplePatterns() {
  return {
    accountPatterns: [
      'account\\s*nbr[:\\s]+(FBNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(DNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(WNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(SMNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(SENWSTX\\d+)',
      'account\\s*nbr[:\\s]+(SVNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(PPNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(OHNWSTX\\d+)',
      'account\\s*nbr[:\\s]+(SUNWSTX\\d+)',
      'account\\s*nbr[:\\s]+([A-Z]{2,}\\d+)'
    ],
    namePatterns: [
      // Married couple patterns (priority - check first)
      'customer\\s*name[:\\s]+([A-Za-z]+\\s*&\\s*[A-Za-z]+\\s+[A-Za-z]+\'?s?)', // Celia & Felipe Ramirez's
      'customer\\s*name[:\\s]+([A-Za-z]+\\s*&\\s*[A-Za-z]+\\s+[A-Za-z]+)', // John & Mary Smith
      'customer\\s*name[:\\s]+([A-Za-z]+\\s+&\\s+[A-Za-z]+\\s+[A-Za-z]+\'?s?)', // Maria & Carlos Rodriguez's

      // Original patterns (clean names without "Account")
      'customer\\s*name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*(?:Account)?',
      'customer\\s*name[:\\s]+([A-Z][a-z]+\\s+[A-Z][a-z]+\\s+[A-Z][a-z]+)\\s*(?:Account)?',

      // More flexible patterns
      'customer\\s*name[:\\s]+([A-Z][A-Z\\s]+)',  // ALL CAPS names
      'customer\\s*name[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)', // Mixed case
      'name[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
      'account\\s*holder[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
      'bill\\s*to[:\\s]+([A-Za-z]+\\s+[A-Za-z]+(?:\\s+[A-Za-z]+)?)',
      '([A-Z][a-z]+\\s+[A-Z][a-z]+)(?=\\s|$)' // Generic two-word names
    ]
  };
}