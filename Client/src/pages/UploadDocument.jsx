import React, { useState } from 'react';
import { useNotify } from '../context/NotifyContext';
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
  EyeIcon,
  SparklesIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const UploadDocument = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [enhancing, setEnhancing] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const navigate = useNavigate();
  const notify = useNotify();
  // Form data for editing with verification status
  const [formData, setFormData] = useState({
    artistName: '',
    guruName: '',
    gharana: '',
    biography: '',
    description: '',
    aiGeneratedSummary: '',
    contactDetails: {
      phone: '',
      email: '',
      address: '',
      website: '',
      instagram: '',
      facebook: '',
      twitter: '',
      youtube: '',
      linkedin: ''
    }
  });

  // Field verification status
  const [fieldVerification, setFieldVerification] = useState({
    artistName: false,
    guruName: false,
    gharana: false,
    biography: false,
    description: false,
    aiGeneratedSummary: false,
    'contactDetails.phone': false,
    'contactDetails.email': false,
    'contactDetails.address': false,
    'contactDetails.website': false,
    'contactDetails.instagram': false,
    'contactDetails.facebook': false,
    'contactDetails.twitter': false,
    'contactDetails.youtube': false,
    'contactDetails.linkedin': false
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError('');
    setResult(null);
    setSummary('');
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    setFile(droppedFile);
    setError('');
    setResult(null);
    setSummary('');
    setHistory([]);
    setHistoryIndex(-1);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const saveToHistory = (data) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(data)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
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
      const initialFormData = {
        artistName: resultData.extractedData.artistName || '',
        guruName: resultData.extractedData.guruName || '',
        gharana: resultData.extractedData.gharana || '',
        biography: resultData.extractedData.biography || '',
        description: resultData.extractedData.description || '',
        aiGeneratedSummary: resultData.artist.aiGeneratedSummary || '',
        contactDetails: {
          phone: resultData.extractedData.contactDetails?.phone || '',
          email: resultData.extractedData.contactDetails?.email || '',
          address: resultData.extractedData.contactDetails?.address || '',
          website: resultData.extractedData.contactDetails?.website || '',
          instagram: resultData.extractedData.contactDetails?.instagram || '',
          facebook: resultData.extractedData.contactDetails?.facebook || '',
          twitter: resultData.extractedData.contactDetails?.twitter || '',
          youtube: resultData.extractedData.contactDetails?.youtube || '',
          linkedin: resultData.extractedData.contactDetails?.linkedin || ''
        }
      };
      
      setFormData(initialFormData);
      saveToHistory(initialFormData);
      
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
    
    let newFormData;
    if (name.startsWith('contactDetails.')) {
      const field = name.split('.')[1];
      newFormData = {
        ...formData,
        contactDetails: {
          ...formData.contactDetails,
          [field]: value
        }
      };
    } else {
      newFormData = {
        ...formData,
        [name]: value
      };
    }
    
    setFormData(newFormData);
    saveToHistory(newFormData);
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

  const handleFieldVerification = (fieldName) => {
    setFieldVerification(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setFormData(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setFormData(history[historyIndex + 1]);
    }
  };

  const enhanceFieldWithAI = async (fieldName, fieldValue) => {
  if (!(fieldValue || '').trim()) return;

    setEnhancing(true);
    try {
      const response = await axios.post('/artists/admin/enhance-field', {
        field: fieldName,
        value: fieldValue,
        context: formData
      });

      const enhancedValue = response.data.data.enhancedValue;
      const newFormData = { ...formData };
      
      if (fieldName.startsWith('contactDetails.')) {
        const field = fieldName.split('.')[1];
        newFormData.contactDetails[field] = enhancedValue;
      } else {
        newFormData[fieldName] = enhancedValue;
      }
      
      setFormData(newFormData);
      saveToHistory(newFormData);
    } catch (error) {
      console.error('AI enhancement failed:', error);
      setError(`Failed to enhance ${fieldName}: ${error.response?.data?.message || error.message}`);
    } finally {
      setEnhancing(false);
    }
  };

  const enhanceAllFieldsWithAI = async () => {
    setEnhancing(true);
    try {
      const response = await axios.post('/artists/admin/enhance-all', {
        data: formData,
        rawText: result?.extractedData?.rawText
      });

      const enhancedFormData = response.data.data.enhancedFormData;
      setFormData(enhancedFormData);
      saveToHistory(enhancedFormData);
  notify?.push({ title: 'AI Enhance', message: 'All fields enhanced successfully', type: 'success' });
    } catch (error) {
      console.error('Comprehensive AI enhancement failed:', error);
  setError(`Failed to enhance all fields: ${error.response?.data?.message || error.message}`);
  notify?.push({ title: 'AI Enhance', message: `Enhance failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    } finally {
      setEnhancing(false);
    }
  };

  const generateSummary = async () => {
    if (!formData.artistName) {
      setError('Artist name is required to generate summary');
      return;
    }

    setGeneratingSummary(true);
    try {
      const response = await axios.post('/artists/admin/generate-summary', {
        artistName: formData.artistName,
        guruName: formData.guruName,
        gharana: formData.gharana,
        biography: formData.biography,
        rawText: result?.extractedData?.rawText,
        artistId: result?.artist?._id
      });

      const summaryData = response.data.data;
      const generatedSummary = summaryData.summary || summaryData.description || summaryData.biography;
      setSummary(generatedSummary);
      
      // Update form data with generated summary
      const newFormData = {
        ...formData,
        aiGeneratedSummary: generatedSummary
      };
  setFormData(newFormData);
  saveToHistory(newFormData);
  notify?.push({ title: 'Summary Generated', message: 'AI summary generated successfully', type: 'success' });
    } catch (error) {
      console.error('Summary generation failed:', error);
  setError(`Failed to generate summary: ${error.response?.data?.message || error.message}`);
  notify?.push({ title: 'Summary Generated', message: `Failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    } finally {
      setGeneratingSummary(false);
    }
  };

  const getComprehensiveAIDetails = async () => {
    if (!formData.artistName) {
      setError('Artist name is required for comprehensive AI details');
      return;
    }

    setEnhancing(true);
    try {
      const response = await axios.post('/artists/admin/comprehensive-details', {
        artistName: formData.artistName,
        guruName: formData.guruName,
        gharana: formData.gharana,
        rawText: result?.extractedData?.rawText
      });

      const comprehensiveData = response.data.data;
      const enhancedFormData = {
        ...formData,
        biography: comprehensiveData.biography || formData.biography,
        description: comprehensiveData.description || formData.description,
      };
      
      setFormData(enhancedFormData);
      saveToHistory(enhancedFormData);
      setSummary(comprehensiveData.summary || summary);
    } catch (error) {
      console.error('Comprehensive AI details failed:', error);
      setError(`Failed to get comprehensive AI details: ${error.response?.data?.message || error.message}`);
    } finally {
      setEnhancing(false);
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
  notify?.push({ title: 'Artist Verified', message: `${response.data.data.artist.fullName || 'Artist'} verified`, type: 'success' });

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
      notify?.push({ title: 'Artist Verify', message: `Failed: ${error.response?.data?.message || error.message}`, type: 'error' });
    }
  };

  const renderFieldWithVerification = (fieldName, label, value, type = 'text', rows = null) => {
    const isVerified = fieldVerification[fieldName];
    const InputComponent = rows ? 'textarea' : 'input';
    
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-secondary-700">
            {label}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => enhanceFieldWithAI(fieldName, value)}
              disabled={enhancing || !(value || '').trim()}
              className="text-xs text-primary-600 hover:text-primary-800 disabled:opacity-50 flex items-center"
              title="Enhance with AI"
            >
              <SparklesIcon className="w-3 h-3 mr-1" />
              AI
            </button>
            <button
              type="button"
              onClick={() => handleFieldVerification(fieldName)}
              className={`text-xs flex items-center ${
                isVerified ? 'text-green-600' : 'text-gray-400'
              }`}
              title={isVerified ? 'Verified' : 'Not verified'}
            >
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              {isVerified ? 'Verified' : 'Verify'}
            </button>
          </div>
        </div>
        <div className={`relative ${isVerified ? 'ring-2 ring-green-200' : ''}`}>
          <InputComponent
            type={type}
            name={fieldName}
            rows={rows}
            className={`input-field text-sm ${isVerified ? 'bg-green-50' : ''}`}
            value={value}
            onChange={handleInputChange}
          />
          {isVerified && (
            <CheckCircleIcon className="absolute right-2 top-2 w-4 h-4 text-green-500" />
          )}
        </div>
      </div>
    );
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
            Upload documents containing artist information. Our AI-powered system will automatically 
            extract, format, and enhance the content to create comprehensive artist profiles.
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

            {/* Results with Enhanced Edit Functionality */}
            {result && (
              <div className="space-y-6">
                {/* Success Header with AI Tools */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-6 h-6 text-green-500 mr-2" />
                      <h3 className="text-lg font-semibold text-secondary-900">
                        Document Processed Successfully
                      </h3>
                    </div>
                    <div className="flex space-x-2">
                      {/* Undo/Redo Controls */}
                      <button
                        onClick={handleUndo}
                        disabled={historyIndex <= 0}
                        className="text-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Undo"
                      >
                        <ArrowUturnLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleRedo}
                        disabled={historyIndex >= history.length - 1}
                        className="text-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Redo"
                      >
                        <ArrowUturnRightIcon className="w-4 h-4" />
                      </button>
                      
                      {/* AI Enhancement Tools */}
                      <button
                        onClick={enhanceAllFieldsWithAI}
                        disabled={enhancing}
                        className="text-sm btn-primary disabled:opacity-50"
                        title="Enhance all fields with AI"
                      >
                        <SparklesIcon className="w-4 h-4 mr-1" />
                        {enhancing ? 'Enhancing...' : 'AI Enhance All'}
                      </button>
                      
                      <button
                        onClick={getComprehensiveAIDetails}
                        disabled={enhancing}
                        className="text-sm btn-primary disabled:opacity-50"
                        title="Get comprehensive AI details"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4 mr-1" />
                        AI Research
                      </button>
                      
                      {!result.artist.isVerified && (
                        <button
                          onClick={handleVerifyArtist}
                          className="btn-primary text-sm"
                        >
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Verify Artist
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI-Generated Summary */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-semibold text-secondary-900">
                      AI-Generated Summary
                    </h4>
                    <button
                      onClick={generateSummary}
                      disabled={generatingSummary}
                      className="text-sm btn-primary disabled:opacity-50"
                    >
                      <ClipboardDocumentCheckIcon className="w-4 h-4 mr-1" />
                      {generatingSummary ? 'Generating...' : 'Generate Summary'}
                    </button>
                  </div>
                  {summary ? (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-secondary-700 leading-relaxed">{summary}</p>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-secondary-500">Click "Generate Summary" to create an AI-powered summary</p>
                    </div>
                  )}
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
                          
                          {/* Field Verification Summary */}
                          <div className="mt-3">
                            <span className="text-xs font-medium text-secondary-700">Field Verification: </span>
                            <div className="mt-1">
                              <span className="text-xs text-green-600">
                                {Object.values(fieldVerification).filter(Boolean).length} of {Object.keys(fieldVerification).length} verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Artist Details - Always Editable */}
                  <div className="lg:col-span-2">
                    <div className="card">
                      <h4 className="text-md font-semibold text-secondary-900 mb-4">
                        Artist Information
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {renderFieldWithVerification('artistName', 'Artist Name *', formData.artistName)}
                          </div>

                          <div>
                            {renderFieldWithVerification('guruName', 'Guru Name', formData.guruName)}
                          </div>

                          <div>
                            {renderFieldWithVerification('gharana', 'Gharana', formData.gharana)}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.phone', 'Phone', formData.contactDetails.phone, 'tel')}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            {renderFieldWithVerification('contactDetails.email', 'Email', formData.contactDetails.email, 'email')}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.website', 'Website', formData.contactDetails.website, 'url')}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.instagram', 'Instagram', formData.contactDetails.instagram)}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.facebook', 'Facebook', formData.contactDetails.facebook)}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.twitter', 'Twitter/X', formData.contactDetails.twitter)}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.youtube', 'YouTube', formData.contactDetails.youtube)}
                          </div>

                          <div>
                            {renderFieldWithVerification('contactDetails.linkedin', 'LinkedIn', formData.contactDetails.linkedin)}
                          </div>
                        </div>

                        <div>
                            {renderFieldWithVerification('contactDetails.address', 'Address', formData.contactDetails.address, 'text', 2)}
                        </div>

                        <div>
                            {renderFieldWithVerification('biography', 'Biography', formData.biography, 'text', 4)}
                        </div>

                        <div>
                            {renderFieldWithVerification('description', 'Description', formData.description, 'text', 3)}
                        </div>

                        <div>
                          {renderFieldWithVerification('aiGeneratedSummary', 'AI Generated Summary', formData.aiGeneratedSummary, 'text', 3)}
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
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
                          setFormData({
                            artistName: '',
                            guruName: '',
                            gharana: '',
                            biography: '',
                            description: '',
                           aiGeneratedSummary: '',
                           contactDetails: { 
                             phone: '', 
                             email: '', 
                             address: '',
                             website: '',
                             instagram: '',
                             facebook: '',
                             twitter: '',
                             youtube: '',
                             linkedin: ''
                           }
                          });
                          setFieldVerification({
                            artistName: false,
                            guruName: false,
                            gharana: false,
                            biography: false,
                            description: false,
                           aiGeneratedSummary: false,
                            'contactDetails.phone': false,
                            'contactDetails.email': false,
                           'contactDetails.address': false,
                           'contactDetails.website': false,
                           'contactDetails.instagram': false,
                           'contactDetails.facebook': false,
                           'contactDetails.twitter': false,
                           'contactDetails.youtube': false,
                           'contactDetails.linkedin': false
                          });
                          setSummary('');
                          setHistory([]);
                          setHistoryIndex(-1);
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

              {/* AI Enhancement Features */}
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  🤖 AI Enhancement Features
                </h3>
                <ul className="space-y-2 text-sm text-secondary-600">
                  <li>• <strong>Smart Data Formatting:</strong> Clean and structure extracted text</li>
                  <li>• <strong>Field-level Enhancement:</strong> Improve individual fields with AI</li>
                  <li>• <strong>Comprehensive Research:</strong> Get detailed artist information</li>
                  <li>• <strong>Auto-generated Summaries:</strong> Create professional profiles</li>
                  <li>• <strong>Field Verification:</strong> Mark fields as verified</li>
                  <li>• <strong>Undo/Redo:</strong> Track and revert changes</li>
                </ul>
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