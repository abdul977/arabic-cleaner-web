'use client';

interface ProcessingStatusProps {
  fileCount?: number;
  currentFile?: string;
  isLargeFile?: boolean;
  totalChunks?: number;
  currentChunk?: number;
  processingStage?: 'analyzing' | 'chunking' | 'cleaning' | 'packaging';
}

export default function ProcessingStatus({
  fileCount = 1,
  currentFile,
  isLargeFile = false,
  totalChunks = 0,
  currentChunk = 0,
  processingStage = 'analyzing'
}: ProcessingStatusProps) {
  const getStageMessage = () => {
    switch (processingStage) {
      case 'analyzing':
        return 'Analyzing document content and size...';
      case 'chunking':
        return 'Splitting large file into manageable chunks...';
      case 'cleaning':
        return isLargeFile
          ? `Cleaning chunk ${currentChunk} of ${totalChunks}...`
          : 'Removing Arabic text and symbols...';
      case 'packaging':
        return 'Creating download package...';
      default:
        return 'Processing documents...';
    }
  };

  const getProgressPercentage = () => {
    if (!isLargeFile) return 0;
    if (totalChunks === 0) return 0;

    switch (processingStage) {
      case 'analyzing':
        return 10;
      case 'chunking':
        return 20;
      case 'cleaning':
        return 20 + (currentChunk / totalChunks) * 60;
      case 'packaging':
        return 90;
      default:
        return 0;
    }
  };

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Processing Documents
        </h3>
        {currentFile && (
          <p className="text-sm text-gray-500 mt-1">
            Current file: {currentFile}
          </p>
        )}
        <p className="text-gray-600 mt-2">
          {getStageMessage()}
        </p>
      </div>

      {isLargeFile && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-amber-700">
              <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
              <span className="text-sm font-medium">Large File Detected</span>
            </div>
            <p className="text-sm text-amber-600 mt-1">
              This file will be processed in {totalChunks} chunks for optimal performance
            </p>
          </div>

          {totalChunks > 0 && (
            <div className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-500">
                  {Math.round(getProgressPercentage())}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              {processingStage === 'cleaning' && (
                <p className="text-xs text-gray-500 mt-2">
                  Processing chunk {currentChunk} of {totalChunks}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-700">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm">
            {isLargeFile ? 'Processing large file with advanced chunking' : 'Standard document processing'}
          </span>
        </div>
      </div>

      {fileCount > 1 && (
        <div className="text-sm text-gray-500">
          Processing {fileCount} files total
        </div>
      )}
    </div>
  );
}
