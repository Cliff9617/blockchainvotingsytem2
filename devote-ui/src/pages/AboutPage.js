import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  ShieldCheckIcon,
  EyeIcon,
  GlobeIcon,
  LockIcon,
  CheckCircleIcon,
  BoltIcon,
  ScaleIcon,
  CheckIcon,
  BuildingIcon,
  MapPinIcon,
  UsersIcon,
} from '../components/common/Icons';

const AboutPage = ({ onConnectWallet, isConnected, account, onNavigate }) => {
  const handleHowItWorksClick = () => {
    window.location.href = '/#how-it-works';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        onConnectWallet={onConnectWallet}
        isConnected={isConnected}
        account={account}
        onNavigate={onNavigate}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-dark-green-800 via-dark-green-700 to-dark-green-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-200 mb-6">
              About DeVote
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Built for <span className="text-green-300">Every Kenyan</span>
            </h1>

            <p className="text-lg md:text-xl text-dark-green-100 max-w-3xl mx-auto leading-relaxed">
              DeVote Kenya Elections is a secure blockchain-powered voting platform designed to make elections transparent, tamper-proof, accessible, and trustworthy for citizens across all 47 counties.
            </p>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Purpose Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
                Our Purpose
              </p>

              <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-6">
                What is DeVote?
              </h2>

              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  DeVote is a digital election platform that allows eligible voters to cast votes securely using a connected wallet while preserving election integrity through blockchain technology.
                </p>
                <p>
                  The system records every valid vote on a transparent and tamper-resistant blockchain ledger, helping reduce manipulation, double voting, hidden tallying, and result disputes.
                </p>
                <p>
                  DeVote is designed for national, county, constituency, and ward-level elections, supporting Kenya's six elective positions: President, Governor, Senator, Woman Representative, Member of Parliament, and Member of County Assembly.
                </p>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-dark-green-700 via-dark-green-800 to-dark-green-900 rounded-2xl shadow-xl p-8 text-white">
                <h3 className="text-xl font-bold mb-6 text-center">Nationwide Coverage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-dark-green-600/30 rounded-xl">
                    <div className="text-3xl font-bold text-green-300">47</div>
                    <div className="text-sm text-dark-green-200 mt-1">Counties</div>
                  </div>
                  <div className="text-center p-4 bg-dark-green-600/30 rounded-xl">
                    <div className="text-3xl font-bold text-green-300">290</div>
                    <div className="text-sm text-dark-green-200 mt-1">Constituencies</div>
                  </div>
                  <div className="text-center p-4 bg-dark-green-600/30 rounded-xl">
                    <div className="text-3xl font-bold text-green-300">1,450+</div>
                    <div className="text-sm text-dark-green-200 mt-1">Wards</div>
                  </div>
                  <div className="text-center p-4 bg-dark-green-600/30 rounded-xl">
                    <div className="text-3xl font-bold text-green-300">22M+</div>
                    <div className="text-sm text-dark-green-200 mt-1">Registered Voters</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes DeVote Different Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
              Why DeVote?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              What Makes This System Different?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              DeVote combines cutting-edge technology with electoral best practices to deliver a voting system Kenyans can trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <ShieldCheckIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">Your Vote is Protected</h3>
              <p className="text-gray-600 leading-relaxed">
                Voter identity is verified securely, and sensitive information is never exposed publicly.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <EyeIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">Transparent Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Vote totals can be viewed in real time, making the counting process open and auditable.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <GlobeIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">Region-Locked Ballots</h3>
              <p className="text-gray-600 leading-relaxed">
                Voters only access candidates from their registered county, constituency, and ward.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <LockIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">Tamper-Proof Records</h3>
              <p className="text-gray-600 leading-relaxed">
                Once a vote is confirmed, it cannot be secretly changed, deleted, or hidden.
              </p>
            </div>

            {/* Card 5 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <CheckCircleIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">One Person, One Vote</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart contract rules prevent repeat voting and enforce voter eligibility.
              </p>
            </div>

            {/* Card 6 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                <BoltIcon className="w-6 h-6 text-dark-green-600" />
              </div>
              <h3 className="text-xl font-bold text-dark-green-800 mb-3">Fast Digital Tallying</h3>
              <p className="text-gray-600 leading-relaxed">
                Results are calculated automatically, reducing delays and manual counting errors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Governance Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
                Governance
              </p>

              <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-6">
                Built Around Election Integrity
              </h2>

              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                DeVote can support election administrators, institutions, and oversight bodies by providing a clear digital workflow for voter registration, candidate verification, ballot control, voting, and result publication.
              </p>
            </div>

            <div className="lg:pl-8">
              <div className="bg-gradient-to-br from-dark-green-50 to-dark-green-100 rounded-2xl shadow-lg p-8 border border-dark-green-200">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto rounded-full bg-dark-green-600 flex items-center justify-center mb-4">
                    <ScaleIcon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-dark-green-800">Election Integrity</h3>
                </div>

                <div className="space-y-4">
                  {['Verified voters', 'Approved candidates', 'Public results', 'Secure audit trail'].map((item) => (
                    <div key={item} className="flex items-center p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center mr-4">
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-medium text-dark-green-800">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Help and Support Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
              Support
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              Voter Support and Assistance
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Voters should be able to get help with registration, wallet connection, eligibility confirmation, and voting guidance before election day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Support Card 1 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-dark-green-100 flex items-center justify-center mb-4">
                <BuildingIcon className="w-5 h-5 text-dark-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-green-800 mb-2">National Support Desk</h3>
              <p className="text-sm text-gray-500 mb-2">Nairobi</p>
              <p className="text-dark-green-600 font-semibold">0800 724 243</p>
            </div>

            {/* Support Card 2 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-dark-green-100 flex items-center justify-center mb-4">
                <GlobeIcon className="w-5 h-5 text-dark-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-green-800 mb-2">County Election Office</h3>
              <p className="text-sm text-gray-500 mb-2">County Level Support</p>
              <p className="text-dark-green-600 font-semibold">47 Offices</p>
            </div>

            {/* Support Card 3 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-dark-green-100 flex items-center justify-center mb-4">
                <MapPinIcon className="w-5 h-5 text-dark-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-green-800 mb-2">Constituency Office</h3>
              <p className="text-sm text-gray-500 mb-2">Local voter assistance</p>
              <p className="text-dark-green-600 font-semibold">290 Offices</p>
            </div>

            {/* Support Card 4 */}
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="w-11 h-11 rounded-xl bg-dark-green-100 flex items-center justify-center mb-4">
                <UsersIcon className="w-5 h-5 text-dark-green-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-green-800 mb-2">Ward Support Desk</h3>
              <p className="text-sm text-gray-500 mb-2">Polling station guidance</p>
              <p className="text-dark-green-600 font-semibold">1,450+ Desks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-dark-green-700 via-dark-green-800 to-dark-green-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Learn More?
          </h2>
          <p className="text-xl text-dark-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Continue to the step-by-step guide and see how DeVote makes secure voting simple.
          </p>
          <button
            onClick={handleHowItWorksClick}
            className="px-8 py-4 bg-white text-dark-green-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
          >
            How It Works
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
