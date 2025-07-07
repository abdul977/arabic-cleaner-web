# Document Chunking Service

A Python-based microservice for processing large documents by splitting them into manageable chunks while preserving word boundaries and document structure. This service integrates with the Arabic Text Cleaner web application to handle files that exceed the standard processing limits.

## Features

- **Large File Processing**: Handle documents up to 500MB+ in size
- **Smart Chunking**: Split documents into 10,000-word chunks with configurable overlap
- **Word Boundary Preservation**: Never break words in the middle when splitting
- **Multiple Format Support**: Process PDF, DOCX, and TXT files
- **Structure Preservation**: Maintain document formatting and paragraph structure
- **RESTful API**: Easy integration with web applications
- **Robust Error Handling**: Comprehensive error reporting and retry mechanisms

## Supported File Formats

- **PDF files** (.pdf) - Uses pdfplumber and PyPDF2 for text extraction
- **Word documents** (.docx) - Uses python-docx for content extraction
- **Text files** (.txt) - Direct text processing with encoding detection

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Quick Start

1. **Clone or navigate to the python-service directory**
   ```bash
   cd python-service
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Download NLTK data (automatic on first run)**
   ```bash
   python -c "import nltk; nltk.download('punkt')"
   ```

4. **Start the service**
   ```bash
   python start_service.py
   ```

   Or manually:
   ```bash
   uvicorn api_service:app --host 0.0.0.0 --port 8000 --reload
   ```

The service will be available at `http://localhost:8000`

### Environment Configuration

Copy `.env.example` to `.env` and configure as needed:

```bash
cp .env.example .env
```

Key configuration options:
- `HOST`: Service host (default: 0.0.0.0)
- `PORT`: Service port (default: 8000)
- `DEFAULT_CHUNK_SIZE_WORDS`: Default chunk size in words (default: 10000)
- `DEFAULT_OVERLAP_WORDS`: Default overlap between chunks (default: 100)

## API Endpoints

### Health Check
```
GET /health
```
Returns service health status and version information.

### Chunk Single File
```
POST /chunk-file
```
Process a single file and return chunked content.

**Parameters:**
- `file`: The file to process (multipart/form-data)
- `chunk_size_words`: Target words per chunk (optional, default: 10000)
- `overlap_words`: Words to overlap between chunks (optional, default: 100)

**Response:**
```json
{
  "success": true,
  "file_name": "document.pdf",
  "file_size_mb": 25.6,
  "total_word_count": 45000,
  "chunk_count": 5,
  "chunks": [
    {
      "chunk_number": 1,
      "content": "...",
      "word_count": 10000,
      "start_words": ["The", "document", "begins", "..."],
      "end_words": ["...", "end", "of", "chunk"]
    }
  ],
  "processing_info": {
    "chunk_size_words": 10000,
    "overlap_words": 100,
    "format": ".pdf"
  },
  "processing_time_seconds": 2.34
}
```

### Chunk Multiple Files
```
POST /chunk-multiple
```
Process multiple files in a single request (max 10 files).

### Chunk Text Content
```
POST /chunk-text
```
Process raw text content directly.

**Body:**
```json
{
  "text": "Your text content here...",
  "chunk_size_words": 10000,
  "overlap_words": 100
}
```

### Get Supported Formats
```
GET /supported-formats
```
Returns list of supported file formats.

## Integration with Next.js Application

### 1. Environment Setup

Add to your Next.js `.env.local`:
```
PYTHON_SERVICE_URL=http://localhost:8000
```

### 2. Service Client

The service includes a TypeScript client (`python-service-client.ts`) for easy integration:

```typescript
import { pythonServiceClient } from '@/lib/python-service-client';

// Check if service is available
const isAvailable = await pythonServiceClient.isServiceAvailable();

// Process a file
const result = await pythonServiceClient.chunkFile(file, 10000, 100);
```

### 3. API Route Integration

The Next.js API route automatically detects and uses the Python service for large files when available.

## Deployment

### Local Development
```bash
python start_service.py
```

### Production with Gunicorn
```bash
pip install gunicorn
gunicorn api_service:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "api_service:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Vercel/Cloud Deployment

For cloud deployment alongside your Next.js app, consider:
- **Railway**: Easy Python service deployment
- **Heroku**: Python app hosting
- **Google Cloud Run**: Containerized deployment
- **AWS Lambda**: Serverless deployment (with size limits)

## Performance Considerations

- **Memory Usage**: Large files are processed in chunks to minimize memory usage
- **Processing Time**: Typical processing speed is 1000-5000 words per second
- **Concurrent Requests**: Service handles multiple requests concurrently
- **File Size Limits**: No hard limits, but memory usage scales with file size

## Troubleshooting

### Common Issues

1. **Service not starting**
   - Check Python version (3.8+ required)
   - Verify all dependencies are installed
   - Check port availability

2. **PDF processing fails**
   - Install additional dependencies: `pip install pymupdf`
   - Check PDF is not password-protected or corrupted

3. **Memory issues with large files**
   - Reduce chunk size: use smaller `chunk_size_words`
   - Increase system memory or use cloud deployment

4. **NLTK data missing**
   - Run: `python -c "import nltk; nltk.download('punkt')"`

### Logs and Debugging

Enable debug logging:
```bash
export LOG_LEVEL=DEBUG
python start_service.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the Arabic Text Cleaner application and follows the same license terms.
