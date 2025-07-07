/**
 * Client for communicating with the Python Document Chunking Service
 */

interface ChunkData {
  chunk_number: number;
  content: string;
  word_count: number;
  start_words: string[];
  end_words: string[];
}

interface ChunkingResponse {
  success: boolean;
  file_name: string;
  file_size_mb?: number;
  total_word_count?: number;
  chunk_count?: number;
  chunks?: ChunkData[];
  processing_info?: {
    chunk_size_words: number;
    overlap_words: number;
    format: string;
  };
  error?: string;
  error_type?: string;
  processing_time_seconds?: number;
}

interface PythonServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export class PythonServiceClient {
  private config: PythonServiceConfig;

  constructor(config: Partial<PythonServiceConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000',
      timeout: config.timeout || 300000, // 5 minutes
      retries: config.retries || 3
    };
  }

  /**
   * Check if the Python service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout for health check
      });
      return response.ok;
    } catch (error) {
      console.warn('Python service health check failed:', error);
      return false;
    }
  }

  /**
   * Get supported file formats from the Python service
   */
  async getSupportedFormats(): Promise<string[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/supported-formats`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.supported_formats || ['.txt', '.pdf', '.docx'];
    } catch (error) {
      console.warn('Failed to get supported formats from Python service:', error);
      return ['.txt', '.pdf', '.docx']; // Fallback to default formats
    }
  }

  /**
   * Chunk a file using the Python service
   */
  async chunkFile(
    file: File,
    chunkSizeWords: number = 10000,
    overlapWords: number = 100
  ): Promise<ChunkingResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('chunk_size_words', chunkSizeWords.toString());
    formData.append('overlap_words', overlapWords.toString());

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        console.log(`Attempting to chunk file ${file.name} (attempt ${attempt}/${this.config.retries})`);

        const response = await fetch(`${this.config.baseUrl}/chunk-file`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const result: ChunkingResponse = await response.json();
        
        if (!result.success && result.error) {
          throw new Error(`Python service error: ${result.error}`);
        }

        console.log(`Successfully chunked file ${file.name} into ${result.chunk_count} chunks`);
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Attempt ${attempt} failed for file ${file.name}:`, lastError.message);

        if (attempt < this.config.retries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    throw new Error(`Failed to chunk file after ${this.config.retries} attempts: ${lastError?.message}`);
  }

  /**
   * Chunk multiple files using the Python service
   */
  async chunkMultipleFiles(
    files: File[],
    chunkSizeWords: number = 10000,
    overlapWords: number = 100
  ): Promise<ChunkingResponse[]> {
    if (files.length === 0) {
      return [];
    }

    // For large batches, process files individually to avoid timeouts
    if (files.length > 5) {
      const results: ChunkingResponse[] = [];
      
      for (const file of files) {
        try {
          const result = await this.chunkFile(file, chunkSizeWords, overlapWords);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            file_name: file.name,
            error: error instanceof Error ? error.message : String(error),
            error_type: 'ProcessingError'
          });
        }
      }
      
      return results;
    }

    // For smaller batches, use the batch endpoint
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('chunk_size_words', chunkSizeWords.toString());
    formData.append('overlap_words', overlapWords.toString());

    try {
      const response = await fetch(`${this.config.baseUrl}/chunk-multiple`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.results || [];

    } catch (error) {
      console.error('Batch chunking failed, falling back to individual processing:', error);
      
      // Fallback to individual processing
      return this.chunkMultipleFiles(files, chunkSizeWords, overlapWords);
    }
  }

  /**
   * Chunk raw text content using the Python service
   */
  async chunkText(
    text: string,
    chunkSizeWords: number = 10000,
    overlapWords: number = 100
  ): Promise<ChunkingResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}/chunk-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          chunk_size_words: chunkSizeWords,
          overlap_words: overlapWords
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result: ChunkingResponse = await response.json();
      
      if (!result.success && result.error) {
        throw new Error(`Python service error: ${result.error}`);
      }

      return result;

    } catch (error) {
      throw new Error(`Failed to chunk text: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export a default instance
export const pythonServiceClient = new PythonServiceClient();

// Export types for use in other modules
export type { ChunkingResponse, ChunkData };
