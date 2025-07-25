'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

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

interface DocumentUploaderProps {
  onProcessingStart: () => void;
  onProcessingComplete: (results: ProcessingResult[]) => void;
  isProcessing: boolean;
}

export default function DocumentUploader({
  onProcessingStart,
  onProcessingComplete,
  isProcessing
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>('');
  const [pythonServiceStatus, setPythonServiceStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  // Dynamic file size limits based on Python service availability
  const MAX_FILE_SIZE_WITH_PYTHON = 500 * 1024 * 1024; // 500MB per file with Python service
  const MAX_FILE_SIZE_WITHOUT_PYTHON = 100 * 1024 * 1024; // 100MB per file without Python service
  const MAX_TOTAL_SIZE_WITH_PYTHON = 1000 * 1024 * 1024; // 1GB total with Python service
  const MAX_TOTAL_SIZE_WITHOUT_PYTHON = 200 * 1024 * 1024; // 200MB total without Python service
  const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024; // 10MB threshold for large file processing

  // Get effective limits based on Python service status
  const getEffectiveLimits = () => {
    const isPythonAvailable = pythonServiceStatus === 'available';
    return {
      maxFileSize: isPythonAvailable ? MAX_FILE_SIZE_WITH_PYTHON : MAX_FILE_SIZE_WITHOUT_PYTHON,
      maxTotalSize: isPythonAvailable ? MAX_TOTAL_SIZE_WITH_PYTHON : MAX_TOTAL_SIZE_WITHOUT_PYTHON,
      isPythonAvailable
    };
  };

  // Check Python service status on component mount
  const checkPythonServiceStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/python-service-status');
      const data = await response.json();
      setPythonServiceStatus(data.available ? 'available' : 'unavailable');
    } catch (error) {
      console.warn('Failed to check Python service status:', error);
      setPythonServiceStatus('unavailable');
    }
  }, []);

  // Check service status on mount
  useEffect(() => {
    checkPythonServiceStatus();
  }, [checkPythonServiceStatus]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('');
    const limits = getEffectiveLimits();

    // Validate individual file sizes
    const oversizedFiles = acceptedFiles.filter(file => file.size > limits.maxFileSize);
    if (oversizedFiles.length > 0) {
      const maxSizeMB = Math.round(limits.maxFileSize / (1024 * 1024));
      const serviceInfo = limits.isPythonAvailable ? 'with enhanced processing' : 'without enhanced processing';
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is ${maxSizeMB}MB per file ${serviceInfo}.`);
      return;
    }

    // Validate total size
    const currentTotalSize = files.reduce((sum, file) => sum + file.size, 0);
    const newTotalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);

    if (currentTotalSize + newTotalSize > limits.maxTotalSize) {
      const maxTotalMB = Math.round(limits.maxTotalSize / (1024 * 1024));
      const serviceInfo = limits.isPythonAvailable ? 'with enhanced processing' : 'without enhanced processing';
      setError(`Total file size exceeds ${maxTotalMB}MB limit ${serviceInfo}. Please select fewer or smaller files.`);
      return;
    }

    setFiles(prev => [...prev, ...acceptedFiles]);
  }, [files, getEffectiveLimits]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    disabled: isProcessing
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(''); // Clear error when removing files
  };

  const isLargeFile = (file: File) => {
    return file.size > LARGE_FILE_THRESHOLD;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    onProcessingStart();

    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`file-${index}`, file);
    });

    try {
      const response = await fetch('/api/process-documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to process documents';

        if (response.status === 413) {
          try {
            const errorData = await response.json();
            if (errorData.pythonServiceAvailable !== undefined) {
              const limits = getEffectiveLimits();
              const maxFileMB = Math.round(limits.maxFileSize / (1024 * 1024));
              const maxTotalMB = Math.round(limits.maxTotalSize / (1024 * 1024));
              const serviceInfo = limits.isPythonAvailable ? 'with enhanced processing' : 'without enhanced processing';
              errorMessage = `File(s) too large. Please try smaller files (max ${maxFileMB}MB per file, ${maxTotalMB}MB total ${serviceInfo}).`;
            } else {
              errorMessage = errorData.error || 'File(s) too large. Please try smaller files.';
            }
          } catch {
            const limits = getEffectiveLimits();
            const maxFileMB = Math.round(limits.maxFileSize / (1024 * 1024));
            const maxTotalMB = Math.round(limits.maxTotalSize / (1024 * 1024));
            errorMessage = `File(s) too large. Please try smaller files (max ${maxFileMB}MB per file, ${maxTotalMB}MB total).`;
          }
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (response.status === 400) {
          errorMessage = 'Invalid file format. Please check your files.';
        }

        throw new Error(errorMessage);
      }

      const results = await response.json();
      onProcessingComplete(results);
      setFiles([]); // Clear files after processing
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error processing files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process documents. Please try again.';
      onProcessingComplete([{
        originalName: 'Error',
        cleanedUrl: '',
        status: 'error',
        error: errorMessage
      }]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Python Service Status Indicator */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Enhanced Processing Status:</span>
          <div className="flex items-center space-x-2">
            {pythonServiceStatus === 'checking' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-yellow-600">Checking...</span>
              </>
            )}
            {pythonServiceStatus === 'available' && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Available (up to 500MB per file)</span>
              </>
            )}
            {pythonServiceStatus === 'unavailable' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-600">Unavailable (up to 100MB per file)</span>
              </>
            )}
          </div>
        </div>
        {pythonServiceStatus === 'unavailable' && (
          <p className="text-xs text-gray-500 mt-1">
            Enhanced processing service is offline. Large file processing will use fallback mode.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">📄</div>
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-gray-500 mt-2">
              or click to select files
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports: PDF, Word documents (.docx), Text files (.txt)
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Selected Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isLargeFile(file)
                    ? 'bg-amber-50 border border-amber-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {file.type.includes('pdf') ? '📄' :
                     file.type.includes('word') ? '📝' : '📄'}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                      {isLargeFile(file) && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                          Large File
                        </span>
                      )}
                    </div>
                    {isLargeFile(file) && (
                      <p className="text-xs text-amber-600 mt-1">
                        Will be processed in chunks for optimal performance
                      </p>
                    )}
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1 ml-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Button */}
      {files.length > 0 && (
        <div className="text-center">
          <button
            onClick={processFiles}
            disabled={isProcessing}
            className={`px-8 py-3 rounded-lg font-medium text-white transition-colors ${
              isProcessing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Processing...' : `Clean ${files.length} File${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
