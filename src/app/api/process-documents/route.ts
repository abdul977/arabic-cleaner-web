import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pythonServiceClient, ChunkingResponse } from '@/lib/python-service-client';

// File size and content analysis utilities
class FileAnalyzer {
  static readonly LARGE_FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
  static readonly LARGE_FILE_WORD_THRESHOLD = 50000; // 50,000 words
  static readonly CHUNK_SIZE_WORDS = 10000; // 10,000 words per chunk

  static isLargeFile(fileSize: number): boolean {
    return fileSize > this.LARGE_FILE_SIZE_THRESHOLD;
  }

  static countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    // Split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }

  static isLargeContent(text: string): boolean {
    const wordCount = this.countWords(text);
    return wordCount > this.LARGE_FILE_WORD_THRESHOLD;
  }

  static shouldProcessAsLargeFile(fileSize: number, text?: string): boolean {
    const isLargeBySize = this.isLargeFile(fileSize);
    const isLargeByContent = text ? this.isLargeContent(text) : false;
    return isLargeBySize || isLargeByContent;
  }

  static getProcessingInfo(fileSize: number, text: string): {
    isLarge: boolean;
    wordCount: number;
    estimatedChunks: number;
    fileSizeMB: number;
  } {
    const wordCount = this.countWords(text);
    const isLarge = this.shouldProcessAsLargeFile(fileSize, text);
    const estimatedChunks = isLarge ? Math.ceil(wordCount / this.CHUNK_SIZE_WORDS) : 1;
    const fileSizeMB = Math.round((fileSize / (1024 * 1024)) * 100) / 100;

    return {
      isLarge,
      wordCount,
      estimatedChunks,
      fileSizeMB
    };
  }
}

// Text chunking utility
class TextChunker {
  static splitIntoChunks(text: string, chunkSizeWords: number = FileAnalyzer.CHUNK_SIZE_WORDS): string[] {
    if (!text || text.trim().length === 0) return [];

    const words = text.trim().split(/\s+/);
    const chunks: string[] = [];

    for (let i = 0; i < words.length; i += chunkSizeWords) {
      const chunkWords = words.slice(i, i + chunkSizeWords);
      const chunk = chunkWords.join(' ');
      chunks.push(chunk);
    }

    return chunks;
  }

  static splitWithStructurePreservation(text: string, chunkSizeWords: number = FileAnalyzer.CHUNK_SIZE_WORDS): string[] {
    if (!text || text.trim().length === 0) return [];

    // Split text into paragraphs first to preserve structure
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentWordCount = 0;

    for (const paragraph of paragraphs) {
      const paragraphWords = paragraph.trim().split(/\s+/).filter(word => word.length > 0);
      const paragraphWordCount = paragraphWords.length;

      // If adding this paragraph would exceed chunk size, finalize current chunk
      if (currentWordCount > 0 && currentWordCount + paragraphWordCount > chunkSizeWords) {
        chunks.push(currentChunk.trim());
        currentChunk = paragraph;
        currentWordCount = paragraphWordCount;
      } else {
        // Add paragraph to current chunk
        if (currentChunk) {
          currentChunk += '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
        }
        currentWordCount += paragraphWordCount;
      }

      // If current chunk is now at or over the limit, finalize it
      if (currentWordCount >= chunkSizeWords) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentWordCount = 0;
      }
    }

    // Add any remaining content as the final chunk
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

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
    // Dynamic import to avoid build-time issues
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const remover = new ArabicTextRemover();
    return remover.cleanText(data.text);
  } catch {
    throw new Error('Failed to process PDF file');
  }
}

async function processDocxFile(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid build-time issues
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    const remover = new ArabicTextRemover();
    return remover.cleanText(result.value);
  } catch {
    throw new Error('Failed to process DOCX file');
  }
}

// Batch processing result interface
interface ProcessingResult {
  originalName: string;
  cleanedUrl?: string;
  zipUrl?: string;
  status: 'success' | 'error';
  error?: string;
  isLargeFile?: boolean;
  chunks?: number;
  wordCount?: number;
  fileSizeMB?: number;
}

// Process large file with Python service chunking
async function processLargeFileWithPythonService(
  file: File,
  uploadsDir: string
): Promise<ProcessingResult> {
  try {
    // Check if Python service is available
    const isServiceAvailable = await pythonServiceClient.isServiceAvailable();

    if (!isServiceAvailable) {
      throw new Error('Python chunking service is not available. Please ensure the service is running.');
    }

    // Use Python service to chunk the file
    const chunkingResult: ChunkingResponse = await pythonServiceClient.chunkFile(file);

    if (!chunkingResult.success) {
      throw new Error(chunkingResult.error || 'Python service failed to process file');
    }

    const chunks = chunkingResult.chunks || [];
    const remover = new ArabicTextRemover();
    const cleanedChunks: string[] = [];
    const chunkFiles: string[] = [];

    // Process each chunk with Arabic text removal
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const cleanedChunk = remover.cleanText(chunk.content);
      cleanedChunks.push(cleanedChunk);

      // Save individual chunk file
      const chunkFileName = `${path.parse(file.name).name}_chunk_${chunk.chunk_number}_${uuidv4()}.txt`;
      const chunkFilePath = path.join(uploadsDir, chunkFileName);
      await fs.writeFile(chunkFilePath, cleanedChunk, 'utf-8');
      chunkFiles.push(chunkFileName);
    }

    // Create merged file
    const mergedContent = cleanedChunks.join('\n\n--- CHUNK SEPARATOR ---\n\n');
    const mergedFileName = `${path.parse(file.name).name}_cleaned_merged_${uuidv4()}.txt`;
    const mergedFilePath = path.join(uploadsDir, mergedFileName);
    await fs.writeFile(mergedFilePath, mergedContent, 'utf-8');

    // Create ZIP file with all chunks
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add individual chunk files to ZIP
    for (let i = 0; i < chunkFiles.length; i++) {
      const chunkContent = cleanedChunks[i];
      const chunkName = `${path.parse(file.name).name}_chunk_${i + 1}.txt`;
      zip.file(chunkName, chunkContent);
    }

    // Add merged file to ZIP
    zip.file(`${path.parse(file.name).name}_merged.txt`, mergedContent);

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `${path.parse(file.name).name}_cleaned_chunks_${uuidv4()}.zip`;
    const zipFilePath = path.join(uploadsDir, zipFileName);
    await fs.writeFile(zipFilePath, zipBuffer);

    return {
      originalName: file.name,
      cleanedUrl: `/uploads/${mergedFileName}`,
      zipUrl: `/uploads/${zipFileName}`,
      status: 'success',
      isLargeFile: true,
      chunks: chunkingResult.chunk_count,
      wordCount: chunkingResult.total_word_count,
      fileSizeMB: chunkingResult.file_size_mb
    };

  } catch (error) {
    console.error(`Error processing large file ${file.name} with Python service:`, error);
    return {
      originalName: file.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isLargeFile: true
    };
  }
}

// Fallback: Process large file with original chunking (if Python service unavailable)
async function processLargeFile(
  file: File,
  content: string,
  uploadsDir: string,
  processingInfo: ReturnType<typeof FileAnalyzer.getProcessingInfo>
): Promise<ProcessingResult> {
  try {
    const remover = new ArabicTextRemover();
    const chunks = TextChunker.splitWithStructurePreservation(content);
    const cleanedChunks: string[] = [];
    const chunkFiles: string[] = [];

    // Process each chunk
    for (let i = 0; i < chunks.length; i++) {
      const cleanedChunk = remover.cleanText(chunks[i]);
      cleanedChunks.push(cleanedChunk);

      // Save individual chunk file
      const chunkFileName = `${path.parse(file.name).name}_chunk_${i + 1}_${uuidv4()}.txt`;
      const chunkFilePath = path.join(uploadsDir, chunkFileName);
      await fs.writeFile(chunkFilePath, cleanedChunk, 'utf-8');
      chunkFiles.push(chunkFileName);
    }

    // Create merged file
    const mergedContent = cleanedChunks.join('\n\n--- CHUNK SEPARATOR ---\n\n');
    const mergedFileName = `${path.parse(file.name).name}_cleaned_merged_${uuidv4()}.txt`;
    const mergedFilePath = path.join(uploadsDir, mergedFileName);
    await fs.writeFile(mergedFilePath, mergedContent, 'utf-8');

    // Create ZIP file with all chunks
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Add individual chunk files to ZIP
    for (let i = 0; i < chunkFiles.length; i++) {
      const chunkContent = cleanedChunks[i];
      const chunkName = `${path.parse(file.name).name}_chunk_${i + 1}.txt`;
      zip.file(chunkName, chunkContent);
    }

    // Add merged file to ZIP
    zip.file(`${path.parse(file.name).name}_merged.txt`, mergedContent);

    // Generate ZIP buffer and save
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `${path.parse(file.name).name}_cleaned_batch_${uuidv4()}.zip`;
    const zipFilePath = path.join(uploadsDir, zipFileName);
    await fs.writeFile(zipFilePath, zipBuffer);

    return {
      originalName: file.name,
      cleanedUrl: `/uploads/${mergedFileName}`,
      zipUrl: `/uploads/${zipFileName}`,
      status: 'success',
      isLargeFile: true,
      chunks: chunks.length,
      wordCount: processingInfo.wordCount,
      fileSizeMB: processingInfo.fileSizeMB
    };

  } catch (error) {
    console.error(`Error processing large file ${file.name}:`, error);
    return {
      originalName: file.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      isLargeFile: true
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check content length - significantly increased limit for Python service processing
    const contentLength = request.headers.get('content-length');
    const maxSize = 500 * 1024 * 1024; // 500MB limit when using Python service
    const fallbackMaxSize = 100 * 1024 * 1024; // 100MB limit for fallback processing

    // Check if Python service is available
    const isPythonServiceAvailable = await pythonServiceClient.isServiceAvailable();
    const effectiveMaxSize = isPythonServiceAvailable ? maxSize : fallbackMaxSize;

    if (contentLength && parseInt(contentLength) > effectiveMaxSize) {
      const maxSizeMB = Math.round(effectiveMaxSize / (1024 * 1024));
      const serviceStatus = isPythonServiceAvailable ? 'with Python service' : 'without Python service';

      return NextResponse.json(
        {
          error: `Request too large. Maximum size is ${maxSizeMB}MB ${serviceStatus}.`,
          pythonServiceAvailable: isPythonServiceAvailable
        },
        { status: 413 }
      );
    }

    const formData = await request.formData();
    const results: ProcessingResult[] = [];

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

          // Check if we should use Python service for this file
          const shouldUsePythonService = isPythonServiceAvailable &&
            FileAnalyzer.shouldProcessAsLargeFile(file.size);

          if (shouldUsePythonService) {
            // Use Python service for large file processing
            console.log(`Processing large file ${file.name} with Python service`);
            const result = await processLargeFileWithPythonService(file, uploadsDir);
            results.push(result);
          } else {
            // Use original processing for smaller files or when Python service unavailable
            const buffer = Buffer.from(await file.arrayBuffer());
            let extractedContent: string;

            // Extract content based on file type
            const fileExtension = path.extname(file.name).toLowerCase();

            switch (fileExtension) {
              case '.txt':
                extractedContent = await processTxtFile(buffer);
                break;
              case '.pdf':
                extractedContent = await processPdfFile(buffer);
                break;
              case '.docx':
                extractedContent = await processDocxFile(buffer);
                break;
              default:
                throw new Error(`Unsupported file type: ${fileExtension}`);
            }

            // Analyze file for large file processing
            const processingInfo = FileAnalyzer.getProcessingInfo(file.size, extractedContent);

            if (processingInfo.isLarge && !isPythonServiceAvailable) {
              // Fallback to original chunking if Python service unavailable
              console.log(`Processing large file ${file.name} with fallback chunking`);
              const result = await processLargeFile(file, extractedContent, uploadsDir, processingInfo);
              results.push(result);
            } else {
              // Process as regular file
              const remover = new ArabicTextRemover();
              const cleanedContent = remover.cleanText(extractedContent);

              // Save cleaned file
              const cleanedFileName = `${path.parse(file.name).name}_cleaned_${uuidv4()}.txt`;
              const cleanedFilePath = path.join(uploadsDir, cleanedFileName);
              await fs.writeFile(cleanedFilePath, cleanedContent, 'utf-8');

              results.push({
                originalName: file.name,
                cleanedUrl: `/uploads/${cleanedFileName}`,
                status: 'success',
                isLargeFile: false,
                wordCount: processingInfo.wordCount,
                fileSizeMB: processingInfo.fileSizeMB
              });
            }
          }

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
