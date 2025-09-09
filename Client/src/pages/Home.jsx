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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-secondary-600/20 to-primary-800/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 animate-fade-in">
                <span className="admin-gradient-text text-5xl md:text-6xl font-extrabold">Discover Classical Music</span>
              <span className="block text-4xl md:text-5xl mt-4 text-dark-700">Artists & Their Legacy</span>
            </h1>
            <p className="text-xl text-dark-600 mb-12 max-w-4xl mx-auto animate-slide-up leading-relaxed">
              Explore the rich world of classical music through comprehensive artist profiles, 
              their guru-shishya relationships, and the beautiful traditions of different gharanas.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up">
              <Link
                to="/artists"
                className="btn-primary text-lg px-10 py-4 hover:scale-105"
              >
                <SparklesIcon className="w-6 h-6 text-white stroke-white" />
                Explore Artists
                <ArrowRightIcon className="w-6 h-6 text-white stroke-white" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="btn-secondary text-lg px-10 py-4 hover:scale-105"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative floating elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full blur-xl opacity-30 floating-element"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-br from-secondary-400 to-primary-400 rounded-full blur-2xl opacity-20 floating-element" style={{ animationDelay: '2s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-gradient-to-br from-accent-400 to-primary-400 rounded-full blur-xl opacity-25 floating-element" style={{ animationDelay: '4s' }}></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold gradient-text mb-6">
              Preserving Musical Heritage
            </h2>
            <p className="text-xl text-dark-600 max-w-3xl mx-auto leading-relaxed">
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
                  className="card text-center group hover:scale-105"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg transition-all duration-300 floating-element">
                    <Icon className="w-8 h-8 text-white stroke-[#7e22ce]" />
                  </div>
                  <h3 className="text-xl font-bold text-dark-800 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-dark-600 leading-relaxed">
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
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card max-w-4xl mx-auto text-center bg-gradient-to-br from-accent-50 to-primary-50 border-2 border-accent-200">
              <h2 className="text-3xl font-bold gradient-text mb-6">
                Admin Dashboard
              </h2>
              <p className="text-dark-600 mb-8 text-lg">
                Manage artist profiles, upload documents, and oversee the platform's content.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  to="/admin"
                  className="btn-primary text-lg"
                >
                  Go to Dashboard
                </Link>
                <Link
                  to="/upload"
                  className="btn-secondary text-lg"
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
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-secondary-900 to-primary-900 opacity-95"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Join Our Community
            </h2>
            <p className="text-gray-300 text-xl mb-10 max-w-3xl mx-auto leading-relaxed">
              Become part of our mission to preserve and celebrate the rich heritage 
              of classical music and its legendary artists.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/register"
                className="btn-primary text-lg px-10 py-4"
              >
                Create Account
              </Link>
              <Link
                to="/login"
                className="btn-secondary text-lg px-10 py-4 bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                Sign In
              </Link>
            </div>
          </div>
          
          {/* Background decorations */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-secondary-400 to-accent-400 rounded-full blur-3xl opacity-20"></div>
        </section>
      )}
    </div>
  );
};

export default Home;