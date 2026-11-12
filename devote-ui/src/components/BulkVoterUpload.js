import React, { useRef, useState } from 'react';

const BulkVoterUpload = ({ isLoading = false, onUpload }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setStatus('');
  };

  const resetFileInput = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus('Please select a file first');
      return;
    }

    if (typeof onUpload !== 'function') {
      setStatus('Upload handler is not available');
      return;
    }

    try {
      setStatus('Uploading voter list...');
      await onUpload(file);
      setStatus('File uploaded successfully');
      resetFileInput();
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err?.message || 'Upload failed'}`);
    }
  };

  const handleRemoveFile = () => {
    resetFileInput();
    setStatus('');
  };

  return (
    <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl">
      <h3 className="text-lg font-semibold text-yellow-900 mb-4">Bulk Voter Upload</h3>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-yellow-300 rounded-xl bg-white p-6">
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            disabled={isLoading}
            className="block w-full text-sm text-gray-700
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:bg-yellow-600 file:text-white
              hover:file:bg-yellow-700
              disabled:opacity-50"
          />

          <p className="text-sm text-yellow-700 mt-3">
            Upload a CSV or TXT file containing voter wallet addresses, one address per line or comma-separated.
          </p>
        </div>

        {file && (
          <div className="flex items-center justify-between bg-white border border-yellow-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-600">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemoveFile}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isLoading || !file}
            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Upload Voter List'}
          </button>
        </div>

        {status && (
          <div
            className={`p-4 rounded-xl border-2 ${
              status.startsWith('File uploaded')
                ? 'bg-green-50 border-green-200 text-green-800'
                : status.startsWith('Error')
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            }`}
          >
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkVoterUpload;