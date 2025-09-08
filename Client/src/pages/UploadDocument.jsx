import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  UserIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const navigate = useNavigate();

  // Form data for editing
  const [formData, setFormData] = useState({
    artistName: '',
    guruName: '',
    gharana: '',
    biography: '',
    description: '',
    contactDetails: {
      phone: '',
      email: '',
      address: ''
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setResult(null);
    setEditMode(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setError('');
    setResult(null);
    setEditMode(false);
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

    const formDataUpload = new FormData();
    formDataUpload.append('document', file);

    try {
      setUploading(true);
      setError('');
      
      const response = await axios.post('/artists/admin/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const resultData = response.data.data;
      setResult(resultData);
      
      // Initialize form data with extracted data
      setFormData({
        artistName: resultData.extractedData.artistName || '',
        guruName: resultData.extractedData.guruName || '',
        gharana: resultData.extractedData.gharana || '',
        biography: resultData.extractedData.biography || '',
        description: resultData.extractedData.description || '',
        contactDetails: {
          phone: resultData.extractedData.contactDetails?.phone || '',
          email: resultData.extractedData.contactDetails?.email || '',
          address: resultData.extractedData.contactDetails?.address || ''
        }
      });
      
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('contactDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactDetails: {
          ...prev.contactDetails,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!result?.artist?._id) return;

    setSaving(true);
    setError('');

    try {
      // Update artist information
      await axios.patch(`/artists/admin/${result.artist._id}`, formData);
      
      // Upload photo if selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        await axios.patch(`/artists/admin/${result.artist._id}/photo`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // Refresh the result data
      const response = await axios.get(`/artists/${result.artist._id}`);
      setResult(prev => ({
        ...prev,
        artist: response.data.data.artist
      }));

      setEditMode(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update artist');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyArtist = async () => {
    if (!result?.artist?._id) return;

    try {
      await axios.patch(`/artists/admin/${result.artist._id}/verify`);
      
      // Refresh the result data
      const response = await axios.get(`/artists/${result.artist._id}`);
      setResult(prev => ({
        ...prev,
        artist: response.data.data.artist
      }));
      
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify artist');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            {!result && (
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
            )}

            {/* Results with Edit Functionality */}
            {result && (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Document Processed Successfully
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      {!result.artist.isVerified && (
                        <button
                          onClick={handleVerifyArtist}
                          className="btn-primary text-sm"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Verify Artist
                        </button>
                      )}
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={`text-sm ${editMode ? 'btn-secondary' : 'btn-primary'}`}
                      >
                        {editMode ? (
                          <>
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View Mode
                          </>
                        ) : (
                          <>
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit Details
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Artist Profile Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Profile Photo */}
                  <div className="lg:col-span-1">
                    <div className="card">
                      <h4 className="text-md font-semibold text-secondary-900 mb-4">
                        Profile Photo
                      </h4>
                      
                      <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden mb-4">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : result.artist.profilePhoto ? (
                          <img
                            src={result.artist.profilePhoto}
                            alt={result.artist.artistName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UserIcon className="w-16 h-16 text-primary-400" />
                          </div>
                        )}
                      </div>

                      {editMode && (
                        <>
                          <input
                            type="file"
                            id="photo-upload"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                          
                          <button
                            type="button"
                            onClick={() => document.getElementById('photo-upload').click()}
                            className="w-full btn-secondary flex items-center justify-center text-sm"
                          >
                            <PhotoIcon className="w-4 h-4 mr-2" />
                            {result.artist.profilePhoto ? 'Change Photo' : 'Upload Photo'}
                          </button>
                        </>
                      )}

                      {/* Status Info */}
                      <div className="mt-4 pt-4 border-t border-secondary-200">
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-secondary-700">Status: </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              result.artist.extractionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                              result.artist.extractionStatus === 'verified' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {result.artist.extractionStatus}
                            </span>
                          </div>
                          {result.artist.isVerified && (
                            <div>
                              <span className="text-xs font-medium text-secondary-700">Verified: </span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                Yes
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artist Details */}
                  <div className="lg:col-span-2">
                    <div className="card">
                      <h4 className="text-md font-semibold text-secondary-900 mb-4">
                        Artist Information
                      </h4>

                      {editMode ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Artist Name *
                              </label>
                              <input
                                type="text"
                                name="artistName"
                                required
                                className="input-field text-sm"
                                value={formData.artistName}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Guru Name
                              </label>
                              <input
                                type="text"
                                name="guruName"
                                className="input-field text-sm"
                                value={formData.guruName}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Gharana
                              </label>
                              <input
                                type="text"
                                name="gharana"
                                className="input-field text-sm"
                                value={formData.gharana}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Phone
                              </label>
                              <input
                                type="tel"
                                name="contactDetails.phone"
                                className="input-field text-sm"
                                value={formData.contactDetails.phone}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                name="contactDetails.email"
                                className="input-field text-sm"
                                value={formData.contactDetails.email}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Address
                              </label>
                              <textarea
                                name="contactDetails.address"
                                rows={2}
                                className="input-field text-sm"
                                value={formData.contactDetails.address}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Biography
                              </label>
                              <textarea
                                name="biography"
                                rows={3}
                                className="input-field text-sm"
                                value={formData.biography}
                                onChange={handleInputChange}
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-secondary-700 mb-1">
                                Description
                              </label>
                              <textarea
                                name="description"
                                rows={2}
                                className="input-field text-sm"
                                value={formData.description}
                                onChange={handleInputChange}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
                            <button
                              type="button"
                              onClick={() => {
                                setEditMode(false);
                                setPhotoFile(null);
                                setPhotoPreview(null);
                              }}
                              className="btn-secondary text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveChanges}
                              disabled={saving}
                              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {saving ? (
                                <div className="flex items-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Saving...
                                </div>
                              ) : (
                                'Save Changes'
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.extractedData.artistName && (
                              <div>
                                <label className="block text-sm font-medium text-secondary-700">Artist Name</label>
                                <p className="text-secondary-900 text-sm">{result.extractedData.artistName}</p>
                              </div>
                            )}
                            {result.extractedData.guruName && (
                              <div>
                                <label className="block text-sm font-medium text-secondary-700">Guru Name</label>
                                <p className="text-secondary-900 text-sm">{result.extractedData.guruName}</p>
                              </div>
                            )}
                            {result.extractedData.gharana && (
                              <div>
                                <label className="block text-sm font-medium text-secondary-700">Gharana</label>
                                <p className="text-secondary-900 text-sm">{result.extractedData.gharana}</p>
                              </div>
                            )}
                          </div>

                          {result.extractedData.contactDetails && (
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-2">Contact Details</label>
                              <div className="bg-secondary-50 p-3 rounded-lg text-sm">
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

                          {result.extractedData.biography && (
                            <div>
                              <label className="block text-sm font-medium text-secondary-700 mb-2">Biography</label>
                              <p className="text-secondary-900 text-sm leading-relaxed">{result.extractedData.biography}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="card">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="text-sm text-secondary-600">
                      Artist profile created and ready for review
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate('/admin')}
                        className="btn-secondary text-sm"
                      >
                        Go to Dashboard
                      </button>
                      <button
                        onClick={() => navigate(`/artists/${result.artist._id}`)}
                        className="btn-primary text-sm"
                      >
                        View Artist Profile
                      </button>
                      <button
                        onClick={() => {
                          setResult(null);
                          setEditMode(false);
                          setFormData({
                            artistName: '',
                            guruName: '',
                            gharana: '',
                            biography: '',
                            description: '',
                            contactDetails: { phone: '', email: '', address: '' }
                          });
                        }}
                        className="btn-secondary text-sm"
                      >
                        Upload Another
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Only show when no result */}
          {!result && (
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
          )}
        </div>

        {/* Error Message */}
        {error && result && (
          <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center max-w-4xl mx-auto">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;