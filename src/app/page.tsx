'use client';

import { useState } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import ProcessingStatus from '@/components/ProcessingStatus';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
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

  const [processedFiles, setProcessedFiles] = useState<ProcessingResult[]>([]);

  const handleFilesProcessed = (results: ProcessingResult[]) => {
    setProcessedFiles(results);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Arabic Text Cleaner
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Remove Arabic text and symbols from your documents while preserving all other content.
            Supports PDF, Word documents, and text files.
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <DocumentUploader
              onProcessingStart={() => setIsProcessing(true)}
              onProcessingComplete={handleFilesProcessed}
              isProcessing={isProcessing}
            />

            {isProcessing && (
              <div className="mt-8">
                <ProcessingStatus />
              </div>
            )}

            {processedFiles.length > 0 && !isProcessing && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Processing Results
                </h3>
                <div className="space-y-3">
                  {processedFiles.map((file, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        file.status === 'success'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {file.originalName}
                            </p>
                            {file.status === 'success' && (
                              <div className="mt-2 space-y-1">
                                {file.isLargeFile && (
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Large File
                                    </span>
                                    <span>{file.chunks} chunks processed</span>
                                    <span>{file.wordCount?.toLocaleString()} words</span>
                                    <span>{file.fileSizeMB} MB</span>
                                  </div>
                                )}
                                {!file.isLargeFile && (
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span>{file.wordCount?.toLocaleString()} words</span>
                                    <span>{file.fileSizeMB} MB</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {file.status === 'error' && file.error && (
                              <p className="text-sm text-red-600 mt-1">
                                {file.error}
                              </p>
                            )}
                          </div>

                          {file.status === 'success' && (
                            <div className="flex flex-col space-y-2 ml-4">
                              {file.isLargeFile ? (
                                <>
                                  <a
                                    href={file.zipUrl}
                                    download
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                                  >
                                    📦 Download ZIP Package
                                  </a>
                                  <a
                                    href={file.cleanedUrl}
                                    download
                                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-center text-sm"
                                  >
                                    📄 Download Merged File
                                  </a>
                                </>
                              ) : (
                                <a
                                  href={file.cleanedUrl}
                                  download
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm"
                                >
                                  📄 Download Cleaned File
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {file.status === 'success' && file.isLargeFile && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-700">
                              <strong>Large File Processing Complete:</strong> Your file was split into {file.chunks} chunks for processing.
                              Download the ZIP package for individual chunk files, or the merged file for a single document.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>Powered by Next.js • Deployed on Vercel</p>
        </div>
      </div>
    </div>
  );
}
