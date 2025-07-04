'use client';

import { useState } from 'react';
import DocumentUploader from '@/components/DocumentUploader';
import ProcessingStatus from '@/components/ProcessingStatus';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<Array<{
    originalName: string;
    cleanedUrl: string;
    status: 'success' | 'error';
    error?: string;
  }>>([]);

  const handleFilesProcessed = (results: Array<{
    originalName: string;
    cleanedUrl: string;
    status: 'success' | 'error';
    error?: string;
  }>) => {
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
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {file.originalName}
                          </p>
                          {file.status === 'error' && file.error && (
                            <p className="text-sm text-red-600 mt-1">
                              {file.error}
                            </p>
                          )}
                        </div>
                        {file.status === 'success' && (
                          <a
                            href={file.cleanedUrl}
                            download
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Download Cleaned File
                          </a>
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
