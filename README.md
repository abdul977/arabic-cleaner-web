# Arabic Text Cleaner - Web Application

A modern web application that removes Arabic text and symbols from documents while preserving all other content. Built with Next.js and deployed on Vercel.

## Features

- 🧹 **Clean Documents**: Remove Arabic text, symbols, and diacritical marks
- 📄 **Multiple Formats**: Support for PDF, Word documents (.docx), and text files
- 🎯 **Preserve Content**: Keep all non-Arabic text intact
- 🚀 **Fast Processing**: Quick document processing with real-time feedback
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ☁️ **Cloud-Based**: No software installation required
- 📊 **Large File Support**: Handle documents up to 500MB with intelligent chunking
- 🔧 **Smart Chunking**: Automatically split large documents while preserving word boundaries
- 🐍 **Python Integration**: Advanced document processing with Python microservice
- 📦 **Batch Processing**: Process multiple files simultaneously
- 💾 **Multiple Output Formats**: Download individual chunks or merged files

## Supported File Types

- **PDF files** (.pdf) - Extracts text and removes Arabic content
- **Word documents** (.docx) - Processes and cleans document content
- **Text files** (.txt) - Direct text processing

## How It Works

1. **Upload**: Drag and drop or select your documents (up to 500MB per file)
2. **Smart Processing**:
   - Small files (< 10MB): Processed directly in the browser
   - Large files (≥ 10MB): Automatically chunked using Python service
3. **Intelligent Chunking**: Large documents are split into 10,000-word chunks while preserving:
   - Word boundaries (no words are broken)
   - Document structure and formatting
   - Paragraph integrity
4. **Arabic Text Removal**: Each chunk is processed to remove Arabic content
5. **Download Options**:
   - Individual chunk files
   - Merged cleaned document
   - ZIP archive with all chunks

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes + Python FastAPI microservice
- **Document Processing**:
  - JavaScript: pdf-parse, mammoth, custom Arabic text detection
  - Python: PyPDF2, pdfplumber, python-docx, NLTK
- **Large File Processing**: Python-based chunking service with intelligent text splitting
- **Deployment**: Vercel (Next.js) + Railway/Heroku (Python service)
- **File Handling**: react-dropzone, multer, aiofiles
- **API Integration**: Custom TypeScript client for Python service communication

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arabic-cleaner-web
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Deployment

This application is configured for easy deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with zero configuration

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/arabic-cleaner-web)

## API Endpoints

### POST /api/process-documents

Processes uploaded documents and removes Arabic text.

**Request**: FormData with files
**Response**: Array of processing results with download URLs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
