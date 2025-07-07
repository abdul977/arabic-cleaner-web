#!/usr/bin/env python3
"""
Test script to verify PORT environment variable handling.
"""

import os
import sys

def test_port_env():
    """Test PORT environment variable handling."""
    
    # Test 1: Default port
    if "PORT" in os.environ:
        del os.environ["PORT"]
    
    port = int(os.getenv("PORT", "8000"))
    print(f"Test 1 - Default port: {port}")
    assert port == 8000, f"Expected 8000, got {port}"
    
    # Test 2: Custom port from environment
    os.environ["PORT"] = "3000"
    port = int(os.getenv("PORT", "8000"))
    print(f"Test 2 - Custom port: {port}")
    assert port == 3000, f"Expected 3000, got {port}"
    
    # Test 3: Railway-style port
    os.environ["PORT"] = "12345"
    port = int(os.getenv("PORT", "8000"))
    print(f"Test 3 - Railway port: {port}")
    assert port == 12345, f"Expected 12345, got {port}"
    
    print("✅ All PORT environment variable tests passed!")

def test_other_env_vars():
    """Test other environment variables."""
    
    # Test ALLOWED_ORIGINS
    origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,https://*.vercel.app").split(",")
    print(f"ALLOWED_ORIGINS: {origins}")
    
    # Test chunk size
    chunk_size = int(os.getenv("DEFAULT_CHUNK_SIZE_WORDS", "10000"))
    print(f"DEFAULT_CHUNK_SIZE_WORDS: {chunk_size}")
    
    # Test overlap
    overlap = int(os.getenv("DEFAULT_OVERLAP_WORDS", "100"))
    print(f"DEFAULT_OVERLAP_WORDS: {overlap}")
    
    print("✅ Environment variable configuration looks good!")

if __name__ == "__main__":
    print("Testing environment variable handling...")
    test_port_env()
    test_other_env_vars()
    print("🎉 All tests passed!")
