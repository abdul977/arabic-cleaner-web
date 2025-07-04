import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth');

// Arabic text removal utility
class ArabicTextRemover {
  private arabicRanges: [number, number][] = [
    [0x0600, 0x06FF], // Arabic
    [0x0750, 0x077F], // Arabic Supplement
    [0x08A0, 0x08FF], // Arabic Extended-A
    [0xFB50, 0xFDFF], // Arabic Presentation Forms-A
    [0xFE70, 0xFEFF], // Arabic Presentation Forms-B
    [0x1EE00, 0x1EEFF], // Arabic Mathematical Alphabetic Symbols
  ];

  private arabicPattern: RegExp;
  private diacriticsPattern: RegExp;
  private arabicPunctuation: RegExp;

  constructor() {
    // Create regex pattern for Arabic characters
    const ranges = this.arabicRanges.map(([start, end]) => 
      `\\u{${start.toString(16).toUpperCase().padStart(4, '0')}-${end.toString(16).toUpperCase().padStart(4, '0')}}`
    );
    this.arabicPattern = new RegExp(`[${ranges.join('')}]`, 'gu');
    
    // Pattern for Arabic diacritical marks
    this.diacriticsPattern = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
    
    // Pattern for Arabic punctuation
    this.arabicPunctuation = /[\u060C\u061B\u061F\u0640\u066A-\u066D]/g;
  }

  cleanText(text: string): string {
    if (!text) return text;
    
    // Remove Arabic characters
    text = text.replace(this.arabicPattern, '');
    
    // Remove Arabic diacritical marks
    text = text.replace(this.diacriticsPattern, '');
    
    // Remove Arabic punctuation
    text = text.replace(this.arabicPunctuation, '');
    
    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ');
    text = text.replace(/\n\s*\n/g, '\n\n');
    
    return text.trim();
  }
}

// Document processors
async function processTxtFile(buffer: Buffer): Promise<string> {
  const content = buffer.toString('utf-8');
  const remover = new ArabicTextRemover();
  return remover.cleanText(content);
}

async function processPdfFile(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    const remover = new ArabicTextRemover();
    return remover.cleanText(data.text);
  } catch {
    throw new Error('Failed to process PDF file');
  }
}

async function processDocxFile(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const remover = new ArabicTextRemover();
    return remover.cleanText(result.value);
  } catch {
    throw new Error('Failed to process DOCX file');
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const results = [];

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    // Process each file
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file-') && value instanceof File) {
        try {
          const file = value as File;
          const buffer = Buffer.from(await file.arrayBuffer());
          
          let cleanedContent: string;
          const fileExtension = path.extname(file.name).toLowerCase();
          
          // Process based on file type
          switch (fileExtension) {
            case '.txt':
              cleanedContent = await processTxtFile(buffer);
              break;
            case '.pdf':
              cleanedContent = await processPdfFile(buffer);
              break;
            case '.docx':
              cleanedContent = await processDocxFile(buffer);
              break;
            default:
              throw new Error(`Unsupported file type: ${fileExtension}`);
          }

          // Save cleaned file
          const cleanedFileName = `${path.parse(file.name).name}_cleaned_${uuidv4()}.txt`;
          const cleanedFilePath = path.join(uploadsDir, cleanedFileName);
          await fs.writeFile(cleanedFilePath, cleanedContent, 'utf-8');

          results.push({
            originalName: file.name,
            cleanedUrl: `/uploads/${cleanedFileName}`,
            status: 'success' as const
          });

        } catch (error) {
          console.error(`Error processing file ${(value as File).name}:`, error);
          results.push({
            originalName: (value as File).name,
            cleanedUrl: '',
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          });
        }
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process documents' },
      { status: 500 }
    );
  }
}
