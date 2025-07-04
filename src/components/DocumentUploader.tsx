'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DocumentUploaderProps {
  onProcessingStart: () => void;
  onProcessingComplete: (results: Array<{
    originalName: string;
    cleanedUrl: string;
    status: 'success' | 'error';
    error?: string;
  }>) => void;
  isProcessing: boolean;
}

export default function DocumentUploader({ 
  onProcessingStart, 
  onProcessingComplete, 
  isProcessing 
}: DocumentUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

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
        throw new Error('Failed to process documents');
      }

      const results = await response.json();
      onProcessingComplete(results);
      setFiles([]); // Clear files after processing
    } catch (error) {
      console.error('Error processing files:', error);
      onProcessingComplete([{
        originalName: 'Error',
        cleanedUrl: '',
        status: 'error',
        error: 'Failed to process documents. Please try again.'
      }]);
    }
  };

  return (
    <div className="space-y-6">
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
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {file.type.includes('pdf') ? '📄' : 
                     file.type.includes('word') ? '📝' : '📄'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700 p-1"
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
