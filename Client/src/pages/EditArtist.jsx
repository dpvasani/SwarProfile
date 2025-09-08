import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const EditArtist = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

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

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/artists/admin/${id}`);
      const artistData = response.data.data.artist;
      
      setArtist(artistData);
      setFormData({
        artistName: artistData.artistName || '',
        guruName: artistData.guruName || '',
        gharana: artistData.gharana || '',
        biography: artistData.biography || '',
        description: artistData.description || '',
        aiGeneratedSummary: artistData.aiGeneratedSummary || '',
        contactDetails: {
          phone: artistData.contactDetails?.phone || '',
          email: artistData.contactDetails?.email || '',
          address: artistData.contactDetails?.address || '',
          website: artistData.contactDetails?.website || '',
          instagram: artistData.contactDetails?.instagram || '',
          facebook: artistData.contactDetails?.facebook || '',
          twitter: artistData.contactDetails?.twitter || '',
          youtube: artistData.contactDetails?.youtube || '',
          linkedin: artistData.contactDetails?.linkedin || ''
        }
      });
    } catch (error) {
      setError('Failed to fetch artist details');
      console.error('Error fetching artist:', error);
    } finally {
      setLoading(false);
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
    
    setError('');
    setSuccess('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update artist information
      await axios.patch(`/artists/admin/${id}`, formData);
      
      // Upload photo if selected
      if (photoFile) {
        const photoFormData = new FormData();
        photoFormData.append('photo', photoFile);
        await axios.patch(`/artists/admin/${id}/photo`, photoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      setSuccess('Artist updated successfully!');
      setTimeout(() => {
        navigate('/admin');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update artist');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      await axios.patch(`/artists/admin/${id}/verify`);
      setSuccess('Artist verified successfully!');
      fetchArtist(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify artist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading artist details...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <h3 className="text-lg font-medium text-secondary-900 mb-2">
            Artist Not Found
          </h3>
          <p className="text-secondary-600 mb-4">
            The artist you are trying to edit does not exist.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center text-secondary-600 hover:text-primary-600 mr-4 transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Edit Artist</h1>
              <p className="text-secondary-600 mt-1">Update artist information and profile</p>
            </div>
          </div>
          
          {!artist.isVerified && artist.extractionStatus === 'completed' && (
            <button
              onClick={handleVerify}
              className="btn-primary flex items-center"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Verify Artist
            </button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo Section */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Profile Photo
              </h3>
              
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden mb-4">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : artist.profilePhoto ? (
                  <img
                    src={artist.profilePhoto}
                    alt={artist.artistName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserIcon className="w-24 h-24 text-primary-400" />
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
                className="w-full btn-secondary flex items-center justify-center"
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                {artist.profilePhoto ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>

            {/* Status Info */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Status Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Extraction Status</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    artist.extractionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    artist.extractionStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                    artist.extractionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {artist.extractionStatus}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Verification Status</label>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    artist.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {artist.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary-700">Created</label>
                  <p className="text-sm text-secondary-600">
                    {new Date(artist.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                Artist Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="artistName" className="block text-sm font-medium text-secondary-700 mb-2">
                      Artist Name *
                    </label>
                    <input
                      type="text"
                      id="artistName"
                      name="artistName"
                      required
                      className="input-field"
                      value={formData.artistName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="guruName" className="block text-sm font-medium text-secondary-700 mb-2">
                      Guru Name
                    </label>
                    <input
                      type="text"
                      id="guruName"
                      name="guruName"
                      className="input-field"
                      value={formData.guruName}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="gharana" className="block text-sm font-medium text-secondary-700 mb-2">
                      Gharana
                    </label>
                    <input
                      type="text"
                      id="gharana"
                      name="gharana"
                      className="input-field"
                      value={formData.gharana}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.phone" className="block text-sm font-medium text-secondary-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="contactDetails.phone"
                      name="contactDetails.phone"
                      className="input-field"
                      value={formData.contactDetails.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="contactDetails.email" className="block text-sm font-medium text-secondary-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contactDetails.email"
                      name="contactDetails.email"
                      className="input-field"
                      value={formData.contactDetails.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="contactDetails.address" className="block text-sm font-medium text-secondary-700 mb-2">
                      Address
                    </label>
                    <textarea
                      id="contactDetails.address"
                      name="contactDetails.address"
                      rows={2}
                      className="input-field"
                      value={formData.contactDetails.address}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.website" className="block text-sm font-medium text-secondary-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      id="contactDetails.website"
                      name="contactDetails.website"
                      className="input-field"
                      value={formData.contactDetails.website}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.instagram" className="block text-sm font-medium text-secondary-700 mb-2">
                      Instagram
                    </label>
                    <input
                      type="text"
                      id="contactDetails.instagram"
                      name="contactDetails.instagram"
                      className="input-field"
                      placeholder="username (without @)"
                      value={formData.contactDetails.instagram}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.facebook" className="block text-sm font-medium text-secondary-700 mb-2">
                      Facebook
                    </label>
                    <input
                      type="text"
                      id="contactDetails.facebook"
                      name="contactDetails.facebook"
                      className="input-field"
                      value={formData.contactDetails.facebook}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.twitter" className="block text-sm font-medium text-secondary-700 mb-2">
                      Twitter/X
                    </label>
                    <input
                      type="text"
                      id="contactDetails.twitter"
                      name="contactDetails.twitter"
                      className="input-field"
                      placeholder="username (without @)"
                      value={formData.contactDetails.twitter}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.youtube" className="block text-sm font-medium text-secondary-700 mb-2">
                      YouTube
                    </label>
                    <input
                      type="text"
                      id="contactDetails.youtube"
                      name="contactDetails.youtube"
                      className="input-field"
                      value={formData.contactDetails.youtube}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="contactDetails.linkedin" className="block text-sm font-medium text-secondary-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="text"
                      id="contactDetails.linkedin"
                      name="contactDetails.linkedin"
                      className="input-field"
                      value={formData.contactDetails.linkedin}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="biography" className="block text-sm font-medium text-secondary-700 mb-2">
                      Biography
                    </label>
                    <textarea
                      id="biography"
                      name="biography"
                      rows={4}
                      className="input-field"
                      value={formData.biography}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="input-field"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="aiGeneratedSummary" className="block text-sm font-medium text-secondary-700 mb-2">
                      AI Generated Summary
                    </label>
                    <textarea
                      id="aiGeneratedSummary"
                      name="aiGeneratedSummary"
                      rows={3}
                      className="input-field"
                      value={formData.aiGeneratedSummary}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditArtist;