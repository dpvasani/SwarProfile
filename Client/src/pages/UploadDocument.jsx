import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setError('');
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    try {
      setUploading(true);
      setError('');
      
      const response = await axios.post('/artists/admin/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const getSupportedFormats = () => {
    return [
      { ext: 'PDF', desc: 'Portable Document Format' },
      { ext: 'DOC/DOCX', desc: 'Microsoft Word Documents' },
      { ext: 'JPEG/JPG', desc: 'Image files with text' },
      { ext: 'PNG', desc: 'Image files with text' },
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-4">
            Upload Artist Document
          </h1>
          <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
            Upload documents containing artist information. Our system will automatically 
            extract and process the content to create artist profiles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
                    file 
                      ? 'border-primary-300 bg-primary-50' 
                      : 'border-secondary-300 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />
                  
                  {file ? (
                    <div className="space-y-4">
                      <CheckCircleIcon className="w-12 h-12 text-primary-600 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-secondary-900">
                          File Selected
                        </p>
                        <p className="text-secondary-600">{file.name}</p>
                        <p className="text-sm text-secondary-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload').click()}
                        className="btn-secondary"
                      >
                        Choose Different File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CloudArrowUpIcon className="w-12 h-12 text-secondary-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-secondary-900">
                          Drop your file here
                        </p>
                        <p className="text-secondary-600">
                          or click to browse
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => document.getElementById('file-upload').click()}
                        className="btn-primary"
                      >
                        Choose File
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Document...
                    </div>
                  ) : (
                    'Upload and Process'
                  )}
                </button>
              </form>
            </div>

            {/* Results */}
            {result && (
              <div className="card mt-6">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-secondary-900">
                    Document Processed Successfully
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.extractedData.artistName && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Artist Name</label>
                        <p className="text-secondary-900">{result.extractedData.artistName}</p>
                      </div>
                    )}
                    {result.extractedData.guruName && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Guru Name</label>
                        <p className="text-secondary-900">{result.extractedData.guruName}</p>
                      </div>
                    )}
                    {result.extractedData.gharana && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Gharana</label>
                        <p className="text-secondary-900">{result.extractedData.gharana}</p>
                      </div>
                    )}
                  </div>

                  {result.extractedData.contactDetails && (
                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">Contact Details</label>
                      <div className="bg-secondary-50 p-3 rounded-lg">
                        {result.extractedData.contactDetails.phone && (
                          <p><strong>Phone:</strong> {result.extractedData.contactDetails.phone}</p>
                        )}
                        {result.extractedData.contactDetails.email && (
                          <p><strong>Email:</strong> {result.extractedData.contactDetails.email}</p>
                        )}
                        {result.extractedData.contactDetails.address && (
                          <p><strong>Address:</strong> {result.extractedData.contactDetails.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button
                      onClick={() => navigate('/admin')}
                      className="btn-primary"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={() => navigate(`/artists/${result.artist._id}`)}
                      className="btn-secondary"
                    >
                      View Artist Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Supported Formats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Supported Formats
              </h3>
              <div className="space-y-3">
                {getSupportedFormats().map((format, index) => (
                  <div key={index} className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 text-primary-600 mr-3" />
                    <div>
                      <p className="font-medium text-secondary-900">{format.ext}</p>
                      <p className="text-sm text-secondary-600">{format.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Processing Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                What We Extract
              </h3>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li>• Artist Name</li>
                <li>• Guru/Teacher Information</li>
                <li>• Gharana/School Details</li>
                <li>• Contact Information</li>
                <li>• Biography & Background</li>
                <li>• Performance History</li>
                <li>• Awards & Recognition</li>
              </ul>
            </div>

            {/* Tips */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Tips for Better Results
              </h3>
              <ul className="space-y-2 text-sm text-secondary-600">
                <li>• Use high-quality, clear documents</li>
                <li>• Ensure text is readable and not blurry</li>
                <li>• Include complete artist information</li>
                <li>• Use standard document formats</li>
                <li>• Keep file size under 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;