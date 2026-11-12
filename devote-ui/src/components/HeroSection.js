import React from 'react';
import ElectionTimer from './ElectionTimer';
import { ShieldCheckIcon } from './common/Icons';

const HeroSection = ({ onConnectWallet, onNavigate, electionStarted, electionEnded }) => {
  const handleHowItWorksClick = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative bg-gradient-to-br from-dark-green-800 via-dark-green-700 to-dark-green-900 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <ShieldCheckIcon className="w-4 h-4 text-green-300" />
            <span className="text-xs font-semibold tracking-wide uppercase text-dark-green-100">
              Official Blockchain Election Platform
            </span>
          </div>

          {/* Slogan */}
          <p className="text-dark-green-200 text-sm md:text-base font-medium mb-4 tracking-wide">
            Kura Yako, Sauti Yako
          </p>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your Vote. <span className="text-green-300">Your Future.</span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-dark-green-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            Kenya's blockchain-powered electoral system. Secure, transparent, and tamper-proof elections for all 47 counties.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('vote');
                } else {
                  window.location.hash = 'vote';
                }
              }}
              className="px-8 py-4 bg-white text-dark-green-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Sign In to Vote
            </button>
            <button
              onClick={handleHowItWorksClick}
              className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            >
              How It Works
            </button>
          </div>

          {/* Election Timer */}
          <div className="max-w-2xl mx-auto">
            <ElectionTimer 
              electionStarted={electionStarted} 
              electionEnded={electionEnded} 
            />
          </div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;