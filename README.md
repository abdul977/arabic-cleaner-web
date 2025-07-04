# Arabic Text Cleaner - Web Application

A modern web application that removes Arabic text and symbols from documents while preserving all other content. Built with Next.js and deployed on Vercel.

## Features

- 🧹 **Clean Documents**: Remove Arabic text, symbols, and diacritical marks
- 📄 **Multiple Formats**: Support for PDF, Word documents (.docx), and text files
- 🎯 **Preserve Content**: Keep all non-Arabic text intact
- 🚀 **Fast Processing**: Quick document processing with real-time feedback
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ☁️ **Cloud-Based**: No software installation required

## Supported File Types

- **PDF files** (.pdf) - Extracts text and removes Arabic content
- **Word documents** (.docx) - Processes and cleans document content
- **Text files** (.txt) - Direct text processing

## How It Works

1. **Upload**: Drag and drop or select your documents
2. **Process**: The application analyzes and removes Arabic text
3. **Download**: Get your cleaned documents instantly

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Document Processing**: pdf-parse, mammoth, custom Arabic text detection
- **Deployment**: Vercel
- **File Handling**: react-dropzone, multer

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
