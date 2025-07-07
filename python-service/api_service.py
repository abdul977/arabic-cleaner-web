#!/usr/bin/env python3
"""
FastAPI service for document chunking functionality.
Provides REST API endpoints for the Arabic Text Cleaner web application.
"""

import os
import tempfile
import shutil
import logging
from typing import List, Dict, Optional, Union
from pathlib import Path
import asyncio
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import aiofiles
from pydantic import BaseModel

from document_chunker import DocumentChunker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Chunking Service",
    description="API service for chunking large documents while preserving structure",
    version="1.0.0"
)

# Configure CORS for Next.js integration
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://*.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global chunker instance with configurable parameters
default_chunk_size = int(os.getenv("DEFAULT_CHUNK_SIZE_WORDS", "10000"))
default_overlap = int(os.getenv("DEFAULT_OVERLAP_WORDS", "100"))
chunker = DocumentChunker(chunk_size_words=default_chunk_size, overlap_words=default_overlap)

# Temporary directory for file processing
TEMP_DIR = Path(tempfile.gettempdir()) / "document_chunker"
TEMP_DIR.mkdir(exist_ok=True)


class ChunkingRequest(BaseModel):
    """Request model for chunking configuration."""
    chunk_size_words: Optional[int] = 10000
    overlap_words: Optional[int] = 100


class ChunkingResponse(BaseModel):
    """Response model for chunking results."""
    success: bool
    file_name: str
    file_size_mb: Optional[float] = None
    total_word_count: Optional[int] = None
    chunk_count: Optional[int] = None
    chunks: Optional[List[Dict]] = None
    processing_info: Optional[Dict] = None
    error: Optional[str] = None
    error_type: Optional[str] = None
    processing_time_seconds: Optional[float] = None


class HealthResponse(BaseModel):
    """Health check response model."""
    status: str
    timestamp: str
    service: str
    version: str


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now().isoformat(),
        service="Document Chunking Service",
        version="1.0.0"
    )


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Document Chunking Service",
        "version": "1.0.0",
        "description": "API service for chunking large documents while preserving structure",
        "endpoints": {
            "health": "/health",
            "chunk_file": "/chunk-file",
            "chunk_multiple": "/chunk-multiple",
            "supported_formats": "/supported-formats"
        }
    }


@app.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported file formats."""
    return {
        "supported_formats": list(chunker.supported_formats),
        "descriptions": {
            ".txt": "Plain text files",
            ".pdf": "PDF documents",
            ".docx": "Microsoft Word documents"
        }
    }


@app.post("/chunk-file", response_model=ChunkingResponse)
async def chunk_single_file(
    file: UploadFile = File(...),
    chunk_size_words: int = 10000,
    overlap_words: int = 100
):
    """
    Chunk a single uploaded file.
    
    Args:
        file: The uploaded file to process
        chunk_size_words: Target words per chunk (default: 10000)
        overlap_words: Words to overlap between chunks (default: 100)
    
    Returns:
        ChunkingResponse with processing results
    """
    start_time = datetime.now()
    temp_file_path = None
    
    try:
        # Validate file format
        file_extension = Path(file.filename).suffix.lower()
        if file_extension not in chunker.supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {file_extension}. "
                       f"Supported formats: {list(chunker.supported_formats)}"
            )
        
        # Create temporary file
        temp_file_path = TEMP_DIR / f"temp_{datetime.now().timestamp()}_{file.filename}"
        
        # Save uploaded file
        async with aiofiles.open(temp_file_path, 'wb') as temp_file:
            content = await file.read()
            await temp_file.write(content)
        
        # Configure chunker
        temp_chunker = DocumentChunker(
            chunk_size_words=chunk_size_words,
            overlap_words=overlap_words
        )
        
        # Process file
        logger.info(f"Processing file: {file.filename}")
        result = temp_chunker.process_file(temp_file_path)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        result['processing_time_seconds'] = round(processing_time, 2)
        
        # Convert to response model
        response = ChunkingResponse(**result)
        
        logger.info(f"Successfully processed {file.filename} in {processing_time:.2f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing file {file.filename}: {e}")
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return ChunkingResponse(
            success=False,
            file_name=file.filename,
            error=str(e),
            error_type=type(e).__name__,
            processing_time_seconds=round(processing_time, 2)
        )
    finally:
        # Clean up temporary file
        if temp_file_path and temp_file_path.exists():
            try:
                temp_file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")


@app.post("/chunk-multiple")
async def chunk_multiple_files(
    files: List[UploadFile] = File(...),
    chunk_size_words: int = 10000,
    overlap_words: int = 100
):
    """
    Chunk multiple uploaded files.
    
    Args:
        files: List of uploaded files to process
        chunk_size_words: Target words per chunk (default: 10000)
        overlap_words: Words to overlap between chunks (default: 100)
    
    Returns:
        List of ChunkingResponse objects
    """
    if len(files) > 10:  # Limit concurrent processing
        raise HTTPException(
            status_code=400,
            detail="Too many files. Maximum 10 files per request."
        )
    
    results = []
    
    for file in files:
        try:
            result = await chunk_single_file(file, chunk_size_words, overlap_words)
            results.append(result.dict())
        except HTTPException as e:
            results.append({
                "success": False,
                "file_name": file.filename,
                "error": e.detail,
                "error_type": "HTTPException"
            })
        except Exception as e:
            results.append({
                "success": False,
                "file_name": file.filename,
                "error": str(e),
                "error_type": type(e).__name__
            })
    
    return {"results": results}


@app.post("/chunk-text")
async def chunk_text_content(
    text: str,
    chunk_size_words: int = 10000,
    overlap_words: int = 100
):
    """
    Chunk raw text content.
    
    Args:
        text: Raw text content to chunk
        chunk_size_words: Target words per chunk (default: 10000)
        overlap_words: Words to overlap between chunks (default: 100)
    
    Returns:
        Chunking results for the text content
    """
    start_time = datetime.now()
    
    try:
        if not text or not text.strip():
            raise HTTPException(status_code=400, detail="Empty text content provided")
        
        # Configure chunker
        temp_chunker = DocumentChunker(
            chunk_size_words=chunk_size_words,
            overlap_words=overlap_words
        )
        
        # Process text
        total_word_count = temp_chunker.count_words(text)
        chunks = temp_chunker.chunk_text_with_structure_preservation(text)
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "success": True,
            "total_word_count": total_word_count,
            "chunk_count": len(chunks),
            "chunks": chunks,
            "processing_info": {
                "chunk_size_words": chunk_size_words,
                "overlap_words": overlap_words,
                "format": "text"
            },
            "processing_time_seconds": round(processing_time, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing text content: {e}")
        processing_time = (datetime.now() - start_time).total_seconds()
        
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "processing_time_seconds": round(processing_time, 2)
        }


async def cleanup_temp_files():
    """Background task to clean up old temporary files."""
    try:
        current_time = datetime.now().timestamp()
        for file_path in TEMP_DIR.iterdir():
            if file_path.is_file():
                # Delete files older than 1 hour
                if current_time - file_path.stat().st_mtime > 3600:
                    file_path.unlink()
                    logger.info(f"Cleaned up old temp file: {file_path}")
    except Exception as e:
        logger.error(f"Error during temp file cleanup: {e}")


@app.on_event("startup")
async def startup_event():
    """Initialize service on startup."""
    logger.info("Document Chunking Service starting up...")
    
    # Ensure temp directory exists
    TEMP_DIR.mkdir(exist_ok=True)
    
    # Schedule periodic cleanup
    asyncio.create_task(periodic_cleanup())
    
    logger.info("Document Chunking Service ready!")


async def periodic_cleanup():
    """Periodic cleanup of temporary files."""
    while True:
        await asyncio.sleep(3600)  # Run every hour
        await cleanup_temp_files()


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on service shutdown."""
    logger.info("Document Chunking Service shutting down...")
    
    # Clean up all temp files
    try:
        shutil.rmtree(TEMP_DIR, ignore_errors=True)
    except Exception as e:
        logger.error(f"Error cleaning up temp directory: {e}")
    
    logger.info("Document Chunking Service stopped.")


if __name__ == "__main__":
    import uvicorn
    
    # Run the service
    uvicorn.run(
        "api_service:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
