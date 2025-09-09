import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  MagnifyingGlassIcon, 
  UserIcon,
  AcademicCapIcon,
  MusicalNoteIcon 
} from '@heroicons/react/24/outline';

const ArtistGallery = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchArtists();
  }, [currentPage, isAdmin]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchArtists();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isAdmin]);

  const fetchArtists = React.useCallback(async () => {
    try {
      setLoading(true);

      if (isAdmin) {
        // Admins get the full artists list (paginated) from admin endpoint
        const response = await axios.get('/artists/admin/all', {
          params: {
            page: currentPage,
            limit: 12,
            search: searchTerm.trim() || undefined,
          },
        });

        const data = response.data.data; // paginate object with docs
        const docs = data.docs || [];
        // Normalize to minimal view used by the gallery
        setArtists(docs.map(a => ({
          _id: a._id,
          artistName: a.artistName,
          guruName: a.guruName,
          gharana: a.gharana,
          profilePhoto: a.profilePhoto,
        })));

        setPagination({
          currentPage: data.page,
          totalPages: data.totalPages,
          totalItems: data.totalDocs,
        });
      } else {
        // Public users (logged in or not) see all completed/verified artists
        const response = await axios.get('/artists', {
          params: {
            page: currentPage,
            limit: 12,
            search: searchTerm.trim() || undefined,
          },
        });

        setArtists(response.data.data.artists);
        setPagination(response.data.data.pagination);
      }

    } catch (error) {
      setError('Failed to fetch artists');
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, isAdmin, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is now handled by useEffect above
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && artists.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-secondary-600">Loading artists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full blur-3xl opacity-20 floating-element"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-full blur-3xl opacity-20 floating-element" style={{ animationDelay: '3s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full blur-2xl opacity-15 floating-element" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Artist Gallery
          </h1>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
            Discover the rich heritage of classical music through our curated collection 
            of artist profiles, their guru-shishya relationships, and gharana traditions.
          </p>
        </div>

        {/* Search */}
        <div className="mb-12">
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists, gurus, or gharanas..."
                className="w-full pl-14 pr-12 py-4 text-lg input-field shadow-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-4 top-4 h-6 w-6 text-primary-500" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-4 w-6 h-6 flex items-center justify-center text-dark-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  ✕
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 max-w-md mx-auto">
            {error}
          </div>
        )}

        {/* Artists Grid */}
        {artists.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {artists.map((artist) => (
                <Link
                  key={artist._id}
                  to={`/artists/${artist._id}`}
                  className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group border border-white/20"
                >
                  <div className="aspect-square bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-200 rounded-xl mb-4 overflow-hidden">
                    {artist.profilePhoto ? (
                      <img
                        src={artist.profilePhoto}
                        alt={artist.artistName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <UserIcon className="w-16 h-16 text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                      {artist.artistName}
                    </h3>
                    
                    {artist.guruName && (
                      <div className="flex items-center text-sm text-slate-600">
                        <AcademicCapIcon className="w-4 h-4 mr-2 text-purple-500" />
                        <span className="font-medium">Guru:</span>
                        <span className="ml-1">{artist.guruName}</span>
                      </div>
                    )}
                    
                    {artist.gharana && (
                      <div className="flex items-center text-sm text-slate-600">
                        <MusicalNoteIcon className="w-4 h-4 mr-2 text-indigo-500" />
                        <span className="font-medium">Gharana:</span>
                        <span className="ml-1">{artist.gharana}</span>
                      </div>
                    )}

                    {artist.biography && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                        {artist.biography.length > 100 
                          ? `${artist.biography.substring(0, 100)}...` 
                          : artist.biography}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-3">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 font-semibold rounded-xl transition-all duration-300 ${
                        currentPage === page
                          ? 'btn-primary'
                          : 'btn-secondary hover:scale-105'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No artists found
            </h3>
            <p className="text-secondary-600">
              {searchTerm 
                ? `No artists match your search for "${searchTerm}"`
                : 'No verified artists available at the moment'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistGallery;