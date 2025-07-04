'use client';

export default function ProcessingStatus() {
  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <div>
        <h3 className="text-lg font-medium text-gray-900">
          Processing Documents
        </h3>
        <p className="text-gray-600 mt-2">
          Removing Arabic text and symbols from your documents...
        </p>
      </div>
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-blue-700">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="text-sm">Analyzing document content</span>
        </div>
      </div>
    </div>
  );
}
