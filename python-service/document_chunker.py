#!/usr/bin/env python3
"""
Document Chunking Service for Arabic Text Cleaner
Handles large document processing by splitting into manageable chunks
while preserving word boundaries and document structure.
"""

import os
import re
import io
import logging
from typing import List, Dict, Tuple, Optional, Union
from pathlib import Path
import tempfile

# Document processing libraries
try:
    import PyPDF2
    import pdfplumber
except ImportError:
    PyPDF2 = None
    pdfplumber = None

try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

try:
    import nltk
    from nltk.tokenize import sent_tokenize, word_tokenize
    # Download required NLTK data if not present
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
except ImportError:
    nltk = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DocumentChunker:
    """
    A comprehensive document chunking service that handles large files
    by splitting them into smaller, manageable chunks while preserving
    word boundaries and document structure.
    """
    
    def __init__(self, chunk_size_words: int = 10000, overlap_words: int = 100):
        """
        Initialize the document chunker.
        
        Args:
            chunk_size_words: Target number of words per chunk
            overlap_words: Number of words to overlap between chunks for context
        """
        self.chunk_size_words = chunk_size_words
        self.overlap_words = overlap_words
        self.supported_formats = {'.txt', '.pdf', '.docx'}
        
    def is_supported_format(self, file_path: Union[str, Path]) -> bool:
        """Check if the file format is supported."""
        return Path(file_path).suffix.lower() in self.supported_formats
    
    def extract_text_from_file(self, file_path: Union[str, Path]) -> str:
        """
        Extract text content from various file formats.
        
        Args:
            file_path: Path to the document file
            
        Returns:
            Extracted text content
            
        Raises:
            ValueError: If file format is not supported
            Exception: If file processing fails
        """
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        if extension == '.txt':
            return self._extract_from_txt(file_path)
        elif extension == '.pdf':
            return self._extract_from_pdf(file_path)
        elif extension == '.docx':
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {extension}")
    
    def _extract_from_txt(self, file_path: Path) -> str:
        """Extract text from a plain text file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except UnicodeDecodeError:
            # Try with different encodings
            for encoding in ['latin-1', 'cp1252', 'iso-8859-1']:
                try:
                    with open(file_path, 'r', encoding=encoding) as file:
                        return file.read()
                except UnicodeDecodeError:
                    continue
            raise Exception(f"Could not decode text file: {file_path}")
    
    def _extract_from_pdf(self, file_path: Path) -> str:
        """Extract text from a PDF file using multiple methods for best results."""
        text_content = ""
        
        # Try pdfplumber first (better for complex layouts)
        if pdfplumber:
            try:
                with pdfplumber.open(file_path) as pdf:
                    for page in pdf.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_content += page_text + "\n"
                if text_content.strip():
                    return text_content
            except Exception as e:
                logger.warning(f"pdfplumber failed for {file_path}: {e}")
        
        # Fallback to PyPDF2
        if PyPDF2:
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                if text_content.strip():
                    return text_content
            except Exception as e:
                logger.warning(f"PyPDF2 failed for {file_path}: {e}")
        
        if not text_content.strip():
            raise Exception(f"Could not extract text from PDF: {file_path}")
        
        return text_content
    
    def _extract_from_docx(self, file_path: Path) -> str:
        """Extract text from a DOCX file."""
        if not DocxDocument:
            raise Exception("python-docx library not available for DOCX processing")
        
        try:
            doc = DocxDocument(file_path)
            text_content = []
            
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_content.append(paragraph.text)
            
            return "\n".join(text_content)
        except Exception as e:
            raise Exception(f"Could not extract text from DOCX: {file_path}. Error: {e}")
    
    def count_words(self, text: str) -> int:
        """Count words in text, handling various languages and formats."""
        if not text or not text.strip():
            return 0
        
        # Use NLTK if available for better tokenization
        if nltk:
            try:
                words = word_tokenize(text)
                return len([word for word in words if word.isalnum()])
            except:
                pass
        
        # Fallback to simple regex-based counting
        words = re.findall(r'\b\w+\b', text)
        return len(words)
    
    def split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences using NLTK or fallback method."""
        if nltk:
            try:
                return sent_tokenize(text)
            except:
                pass
        
        # Fallback sentence splitting
        sentences = re.split(r'[.!?]+\s+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def chunk_text_with_structure_preservation(self, text: str) -> List[Dict[str, Union[str, int]]]:
        """
        Split text into chunks while preserving structure and word boundaries.
        
        Args:
            text: Input text to be chunked
            
        Returns:
            List of dictionaries containing chunk information
        """
        if not text or not text.strip():
            return []
        
        # Split text into paragraphs first
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]
        
        chunks = []
        current_chunk = ""
        current_word_count = 0
        chunk_number = 1
        
        for paragraph in paragraphs:
            paragraph_word_count = self.count_words(paragraph)
            
            # If adding this paragraph would exceed chunk size
            if current_word_count + paragraph_word_count > self.chunk_size_words and current_chunk:
                # Finalize current chunk
                chunks.append({
                    'chunk_number': chunk_number,
                    'content': current_chunk.strip(),
                    'word_count': current_word_count,
                    'start_words': current_chunk.strip().split()[:10] if current_chunk.strip() else [],
                    'end_words': current_chunk.strip().split()[-10:] if current_chunk.strip() else []
                })
                
                # Start new chunk with overlap if configured
                if self.overlap_words > 0 and current_chunk:
                    overlap_text = self._get_overlap_text(current_chunk, self.overlap_words)
                    current_chunk = overlap_text + "\n\n" + paragraph
                    current_word_count = self.count_words(overlap_text) + paragraph_word_count
                else:
                    current_chunk = paragraph
                    current_word_count = paragraph_word_count
                
                chunk_number += 1
            else:
                # Add paragraph to current chunk
                if current_chunk:
                    current_chunk += "\n\n" + paragraph
                else:
                    current_chunk = paragraph
                current_word_count += paragraph_word_count
        
        # Add final chunk if there's remaining content
        if current_chunk.strip():
            chunks.append({
                'chunk_number': chunk_number,
                'content': current_chunk.strip(),
                'word_count': current_word_count,
                'start_words': current_chunk.strip().split()[:10],
                'end_words': current_chunk.strip().split()[-10:]
            })
        
        return chunks
    
    def _get_overlap_text(self, text: str, overlap_words: int) -> str:
        """Get the last N words from text for overlap."""
        words = text.split()
        if len(words) <= overlap_words:
            return text
        return ' '.join(words[-overlap_words:])
    
    def process_file(self, file_path: Union[str, Path]) -> Dict[str, Union[str, int, List]]:
        """
        Process a file and return chunked content with metadata.
        
        Args:
            file_path: Path to the file to process
            
        Returns:
            Dictionary containing processing results and metadata
        """
        file_path = Path(file_path)
        
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        if not self.is_supported_format(file_path):
            raise ValueError(f"Unsupported file format: {file_path.suffix}")
        
        try:
            # Extract text content
            logger.info(f"Extracting text from {file_path}")
            text_content = self.extract_text_from_file(file_path)
            
            if not text_content.strip():
                raise Exception("No text content found in file")
            
            # Get file metadata
            file_size = file_path.stat().st_size
            total_word_count = self.count_words(text_content)
            
            # Chunk the content
            logger.info(f"Chunking text into {self.chunk_size_words}-word chunks")
            chunks = self.chunk_text_with_structure_preservation(text_content)
            
            return {
                'success': True,
                'file_name': file_path.name,
                'file_size_bytes': file_size,
                'file_size_mb': round(file_size / (1024 * 1024), 2),
                'total_word_count': total_word_count,
                'chunk_count': len(chunks),
                'chunks': chunks,
                'processing_info': {
                    'chunk_size_words': self.chunk_size_words,
                    'overlap_words': self.overlap_words,
                    'format': file_path.suffix.lower()
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {e}")
            return {
                'success': False,
                'file_name': file_path.name,
                'error': str(e),
                'error_type': type(e).__name__
            }


def main():
    """Example usage of the DocumentChunker."""
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python document_chunker.py <file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    chunker = DocumentChunker(chunk_size_words=10000, overlap_words=100)
    
    try:
        result = chunker.process_file(file_path)
        
        if result['success']:
            print(f"Successfully processed: {result['file_name']}")
            print(f"File size: {result['file_size_mb']} MB")
            print(f"Total words: {result['total_word_count']}")
            print(f"Number of chunks: {result['chunk_count']}")
            
            for i, chunk in enumerate(result['chunks'], 1):
                print(f"\nChunk {i}: {chunk['word_count']} words")
                print(f"Preview: {chunk['content'][:100]}...")
        else:
            print(f"Error processing file: {result['error']}")
            
    except Exception as e:
        print(f"Unexpected error: {e}")


if __name__ == "__main__":
    main()
