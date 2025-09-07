import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchStats();
    fetchArtists();
  }, [currentPage, statusFilter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/artists/admin/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/artists/admin/all', {
        params: {
          page: currentPage,
          limit: 10,
          status: statusFilter || undefined,
        },
      });
      
      setArtists(response.data.data.docs);
      setPagination({
        currentPage: response.data.data.page,
        totalPages: response.data.data.totalPages,
        totalItems: response.data.data.totalDocs,
      });
    } catch (error) {
      setError('Failed to fetch artists');
      console.error('Error fetching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyArtist = async (artistId) => {
    try {
      await axios.patch(`/artists/admin/${artistId}/verify`);
      fetchArtists();
      fetchStats();
    } catch (error) {
      console.error('Error verifying artist:', error);
    }
  };

  const handleDeleteArtist = async (artistId) => {
    if (window.confirm('Are you sure you want to delete this artist?')) {
      try {
        await axios.delete(`/artists/admin/${artistId}`);
        fetchArtists();
        fetchStats();
      } catch (error) {
        console.error('Error deleting artist:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'verified':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">Admin Dashboard</h1>
            <p className="text-secondary-600 mt-1">Manage artist profiles and documents</p>
          </div>
          <Link
            to="/upload"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Upload Document
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Total Artists</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.totalArtists || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Verified</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.verifiedArtists || 0}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Verification Rate</p>
                <p className="text-2xl font-bold text-secondary-900">{stats.verificationRate || 0}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">Processing</p>
                <p className="text-2xl font-bold text-secondary-900">
                  {stats.extractionStats?.find(s => s._id === 'processing')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Artists Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-secondary-900">Artists Management</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-auto"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : artists.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead className="bg-secondary-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Artist
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Guru/Gharana
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {artists.map((artist) => (
                      <tr key={artist._id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              {artist.profilePhoto ? (
                                <img
                                  src={artist.profilePhoto}
                                  alt={artist.artistName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-600 font-medium text-sm">
                                  {artist.artistName?.charAt(0) || 'A'}
                                </span>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-secondary-900">
                                {artist.artistName || 'Unknown Artist'}
                              </div>
                              <div className="text-sm text-secondary-500">
                                {artist.createdBy?.fullName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-secondary-900">
                            {artist.guruName && (
                              <div>Guru: {artist.guruName}</div>
                            )}
                            {artist.gharana && (
                              <div>Gharana: {artist.gharana}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getStatusIcon(artist.extractionStatus)}
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(artist.extractionStatus)}`}>
                              {artist.extractionStatus}
                            </span>
                            {artist.isVerified && (
                              <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {new Date(artist.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              to={`/artists/${artist._id}`}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/admin/edit/${artist._id}`}
                              className="text-secondary-600 hover:text-secondary-900"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            {!artist.isVerified && artist.extractionStatus === 'completed' && (
                              <button
                                onClick={() => handleVerifyArtist(artist._id)}
                                className="text-green-600 hover:text-green-900"
                                title="Verify Artist"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteArtist(artist._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
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
                        onClick={() => setCurrentPage(page)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 text-sm font-medium text-secondary-500 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
              <p className="text-secondary-600">No artists found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;