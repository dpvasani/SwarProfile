import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  GlobeAltIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      // Use admin endpoint if user is admin, otherwise use public endpoint
      const endpoint = isAdmin ? `/artists/admin/${id}` : `/artists/${id}`;
      const response = await axios.get(endpoint);
      setArtist(response.data.data.artist);
    } catch (error) {
      setError('Failed to fetch artist details');
      console.error('Error fetching artist:', error);
    } finally {
      setLoading(false);
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

  if (error || !artist) {
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
            {error || 'The artist you are looking for does not exist.'}
          </p>
          <button
            onClick={() => navigate('/artists')}
            className="btn-primary"
          >
            Back to Gallery
          </button>
        </div>
      </div>
    );
  }

  // User View - Limited Information
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/artists')}
            className="flex items-center text-secondary-600 hover:text-primary-600 mb-6 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Gallery
          </button>

          <div className="card">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Profile Image */}
              <div className="lg:col-span-1">
                <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden">
                  {artist.profilePhoto ? (
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
              </div>

              {/* Artist Information */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-secondary-900 mb-4">
                    {artist.artistName}
                  </h1>
                  <div className="space-y-3">
                    {artist.guruName && (
                      <div className="flex items-center text-secondary-600">
                        <AcademicCapIcon className="w-5 h-5 mr-3" />
                        <span><strong>Guru:</strong> {artist.guruName}</span>
                      </div>
                    )}
                    {artist.gharana && (
                      <div className="flex items-center text-secondary-600">
                        <MusicalNoteIcon className="w-5 h-5 mr-3" />
                        <span><strong>Gharana:</strong> {artist.gharana}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Generated Summary */}
                {artist.aiGeneratedSummary && (
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                      About
                    </h3>
                    <p className="text-secondary-700 leading-relaxed">
                      {artist.aiGeneratedSummary}
                    </p>
                  </div>
                )}

                {/* Biography (fallback if no summary) */}
                {!artist.aiGeneratedSummary && artist.biography && (
                  <div>
                    <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                      Biography
                    </h3>
                    <p className="text-secondary-700 leading-relaxed">
                      {artist.biography}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin View - Complete Information
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/artists')}
            className="flex items-center text-secondary-600 hover:text-primary-600 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Gallery
          </button>
          
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/admin/edit/${artist._id}`)}
              className="btn-secondary flex items-center"
            >
              <PencilIcon className="w-4 h-4 mr-2" />
              Edit Artist
            </button>
            {!artist.isVerified && artist.extractionStatus === 'completed' && (
              <button
                onClick={async () => {
                  try {
                    await axios.patch(`/artists/admin/${artist._id}/verify`);
                    fetchArtist(); // Refresh data
                  } catch (error) {
                    console.error('Verification failed:', error);
                  }
                }}
                className="btn-primary flex items-center"
              >
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Verify Artist
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Photo & Status */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Photo */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Profile Photo
              </h3>
              <div className="aspect-square bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl overflow-hidden">
                {artist.profilePhoto ? (
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
            </div>

            {/* Status Information */}
            <div className="card">
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
                    artist.extractionStatus === 'verified' ? 'bg-blue-100 text-blue-800' :
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
                {artist.verifiedAt && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700">Verified</label>
                    <p className="text-sm text-secondary-600">
                      {new Date(artist.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artist Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                Artist Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Artist Name</label>
                  <p className="text-secondary-900 font-medium">{artist.artistName || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Guru Name</label>
                  <p className="text-secondary-900">{artist.guruName || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">Gharana</label>
                  <p className="text-secondary-900">{artist.gharana || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card">
              <h3 className="text-lg font-semibold text-secondary-900 mb-6">
                Contact Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {artist.contactDetails?.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 text-secondary-400 mr-3" />
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Phone</label>
                      <p className="text-secondary-900">{artist.contactDetails.phone}</p>
                    </div>
                  </div>
                )}
                
                {artist.contactDetails?.email && (
                  <div className="flex items-center">
                    <EnvelopeIcon className="w-5 h-5 text-secondary-400 mr-3" />
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Email</label>
                      <a 
                        href={`mailto:${artist.contactDetails.email}`}
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        {artist.contactDetails.email}
                      </a>
                    </div>
                  </div>
                )}
                
                {artist.contactDetails?.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="w-5 h-5 text-secondary-400 mr-3" />
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Website</label>
                      <a 
                        href={artist.contactDetails.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-800 transition-colors"
                      >
                        {artist.contactDetails.website}
                      </a>
                    </div>
                  </div>
                )}
                
                {artist.contactDetails?.address && (
                  <div className="flex items-start md:col-span-2">
                    <MapPinIcon className="w-5 h-5 text-secondary-400 mr-3 mt-0.5" />
                    <div>
                      <label className="block text-sm font-medium text-secondary-700">Address</label>
                      <p className="text-secondary-900">{artist.contactDetails.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Media */}
              {(artist.contactDetails?.instagram || artist.contactDetails?.facebook || 
                artist.contactDetails?.twitter || artist.contactDetails?.youtube || 
                artist.contactDetails?.linkedin) && (
                <div className="mt-6 pt-6 border-t border-secondary-200">
                  <h4 className="text-md font-semibold text-secondary-900 mb-4">Social Media</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {artist.contactDetails.instagram && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Instagram</label>
                        <a 
                          href={`https://instagram.com/${artist.contactDetails.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          @{artist.contactDetails.instagram}
                        </a>
                      </div>
                    )}
                    
                    {artist.contactDetails.facebook && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Facebook</label>
                        <a 
                          href={`https://facebook.com/${artist.contactDetails.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          {artist.contactDetails.facebook}
                        </a>
                      </div>
                    )}
                    
                    {artist.contactDetails.twitter && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">Twitter/X</label>
                        <a 
                          href={`https://twitter.com/${artist.contactDetails.twitter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          @{artist.contactDetails.twitter}
                        </a>
                      </div>
                    )}
                    
                    {artist.contactDetails.youtube && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">YouTube</label>
                        <a 
                          href={`https://youtube.com/c/${artist.contactDetails.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          {artist.contactDetails.youtube}
                        </a>
                      </div>
                    )}
                    
                    {artist.contactDetails.linkedin && (
                      <div>
                        <label className="block text-sm font-medium text-secondary-700">LinkedIn</label>
                        <a 
                          href={`https://linkedin.com/in/${artist.contactDetails.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-800 transition-colors"
                        >
                          {artist.contactDetails.linkedin}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* AI Generated Summary */}
            {artist.aiGeneratedSummary && (
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  AI Generated Summary
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-secondary-700 leading-relaxed">
                    {artist.aiGeneratedSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Biography */}
            {artist.biography && (
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Biography
                </h3>
                <p className="text-secondary-700 leading-relaxed">
                  {artist.biography}
                </p>
              </div>
            )}

            {/* Description */}
            {artist.description && artist.description !== artist.biography && (
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Description
                </h3>
                <p className="text-secondary-700 leading-relaxed">
                  {artist.description}
                </p>
              </div>
            )}

            {/* Raw Extracted Data (Admin Only) */}
            {artist.rawExtractedData && (
              <div className="card">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                  Raw Extracted Data
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto">
                  <pre className="text-sm text-secondary-600 whitespace-pre-wrap">
                    {artist.rawExtractedData}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;