import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeftIcon,
  UserIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const ArtistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artist, setArtist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArtist();
  }, [id]);

  const fetchArtist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/artists/${id}`);
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
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">
                  {artist.artistName}
                </h1>
                <div className="space-y-2">
                  {artist.guruName && (
                    <div className="flex items-center text-secondary-600">
                      <AcademicCapIcon className="w-5 h-5 mr-2" />
                      <span><strong>Guru:</strong> {artist.guruName}</span>
                    </div>
                  )}
                  {artist.gharana && (
                    <div className="flex items-center text-secondary-600">
                      <MusicalNoteIcon className="w-5 h-5 mr-2" />
                      <span><strong>Gharana:</strong> {artist.gharana}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              {artist.contactDetails && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {artist.contactDetails.phone && (
                      <div className="flex items-center text-secondary-600">
                        <PhoneIcon className="w-5 h-5 mr-2" />
                        <span>{artist.contactDetails.phone}</span>
                      </div>
                    )}
                    {artist.contactDetails.email && (
                      <div className="flex items-center text-secondary-600">
                        <EnvelopeIcon className="w-5 h-5 mr-2" />
                        <a 
                          href={`mailto:${artist.contactDetails.email}`}
                          className="hover:text-primary-600 transition-colors duration-200"
                        >
                          {artist.contactDetails.email}
                        </a>
                      </div>
                    )}
                    {artist.contactDetails.address && (
                      <div className="flex items-start text-secondary-600">
                        <MapPinIcon className="w-5 h-5 mr-2 mt-0.5" />
                        <span>{artist.contactDetails.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Biography */}
              {artist.biography && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                    Biography
                  </h3>
                  <p className="text-secondary-700 leading-relaxed">
                    {artist.biography}
                  </p>
                </div>
              )}

              {/* Description */}
              {artist.description && artist.description !== artist.biography && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                    About
                  </h3>
                  <p className="text-secondary-700 leading-relaxed">
                    {artist.description}
                  </p>
                </div>
              )}

              {/* Additional Fields */}
              {artist.additionalFields && Object.keys(artist.additionalFields).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-3">
                    Additional Information
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(artist.additionalFields).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="font-medium text-secondary-700 capitalize mr-2">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="text-secondary-600">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistDetail;