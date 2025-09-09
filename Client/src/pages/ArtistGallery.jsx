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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists, gurus, or gharanas..."
                className="w-full pl-10 pr-4 py-3 border border-secondary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-secondary-400" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-secondary-400 hover:text-secondary-600"
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
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-secondary-500 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'text-secondary-700 bg-white border border-secondary-300 hover:bg-secondary-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm font-medium text-secondary-500 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
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