import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MusicalNoteIcon, 
  UserGroupIcon, 
  DocumentTextIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const features = [
    {
      icon: MusicalNoteIcon,
      title: 'Artist Profiles',
      description: 'Comprehensive profiles of classical music artists with detailed information about their background, training, and achievements.',
    },
    {
      icon: UserGroupIcon,
      title: 'Guru-Shishya Tradition',
      description: 'Explore the rich tradition of guru-shishya relationships and the lineage of classical music knowledge.',
    },
    {
      icon: DocumentTextIcon,
      title: 'Document Processing',
      description: 'Advanced OCR and text extraction from various document formats to automatically create artist profiles.',
    },
    {
      icon: SparklesIcon,
      title: 'Gharana Information',
      description: 'Learn about different gharanas (schools) of classical music and their unique characteristics and styles.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
              Discover Classical Music
              <span className="block text-primary-200">Artists & Their Legacy</span>
            </h1>
            <p className="text-xl text-primary-100 mb-8 max-w-3xl mx-auto animate-slide-up">
              Explore the rich world of classical music through comprehensive artist profiles, 
              their guru-shishya relationships, and the beautiful traditions of different gharanas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Link
                to="/artists"
                className="inline-flex items-center px-8 py-3 bg-white text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Explore Artists
                <ArrowRightIcon className="ml-2 w-5 h-5" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-3 bg-primary-500 text-white font-semibold rounded-lg hover:bg-primary-400 transition-all duration-200 shadow-lg hover:shadow-xl border border-primary-400"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
              Preserving Musical Heritage
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Our platform combines modern technology with traditional knowledge to create 
              a comprehensive database of classical music artists and their contributions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="card hover:scale-105 transition-all duration-300 text-center group"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-200 transition-colors duration-200">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-secondary-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Admin Section */}
      {isAdmin && (
        <section className="py-16 bg-gradient-to-r from-primary-50 to-secondary-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-secondary-900 mb-4">
                Admin Dashboard
              </h2>
              <p className="text-secondary-600 mb-6">
                Manage artist profiles, upload documents, and oversee the platform's content.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/admin"
                  className="btn-primary"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="btn-secondary"
                >
                  Upload Document
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 bg-secondary-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Join Our Community
            </h2>
            <p className="text-secondary-300 text-lg mb-8 max-w-2xl mx-auto">
              Become part of our mission to preserve and celebrate the rich heritage 
              of classical music and its legendary artists.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-200"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-3 bg-transparent text-white font-semibold rounded-lg border border-secondary-600 hover:bg-secondary-800 transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;