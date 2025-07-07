#!/usr/bin/env python3
"""
Startup script for the Document Chunking Service.
Handles initialization, dependency checking, and service startup.
"""

import sys
import subprocess
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        return False
    logger.info(f"Python version: {sys.version}")
    return True


def install_dependencies():
    """Install required dependencies."""
    requirements_file = Path(__file__).parent / "requirements.txt"
    
    if not requirements_file.exists():
        logger.error("requirements.txt not found")
        return False
    
    try:
        logger.info("Installing dependencies...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ])
        logger.info("Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install dependencies: {e}")
        return False


def download_nltk_data():
    """Download required NLTK data."""
    try:
        import nltk
        logger.info("Downloading NLTK data...")
        nltk.download('punkt', quiet=True)
        logger.info("NLTK data downloaded successfully")
        return True
    except Exception as e:
        logger.warning(f"Failed to download NLTK data: {e}")
        return False


def start_service(host="0.0.0.0", port=8000, reload=False):
    """Start the FastAPI service."""
    try:
        import uvicorn
        from api_service import app
        
        logger.info(f"Starting Document Chunking Service on {host}:{port}")
        
        uvicorn.run(
            "api_service:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
        
    except ImportError as e:
        logger.error(f"Failed to import required modules: {e}")
        return False
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        return False


def main():
    """Main startup function."""
    logger.info("Starting Document Chunking Service...")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Install dependencies
    if not install_dependencies():
        logger.error("Failed to install dependencies. Please install manually using:")
        logger.error("pip install -r requirements.txt")
        sys.exit(1)
    
    # Download NLTK data
    download_nltk_data()
    
    # Parse command line arguments
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "false").lower() == "true"
    
    # Start the service
    start_service(host=host, port=port, reload=reload)


if __name__ == "__main__":
    main()
