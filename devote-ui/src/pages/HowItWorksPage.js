import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  CheckIcon,
  BuildingIcon,
  CheckCircleIcon,
  GlobeIcon,
  EyeIcon,
  LockIcon,
  BanIcon,
  BoltIcon,
} from '../components/common/Icons';

const HowItWorksPage = ({ onConnectWallet, isConnected, account, onNavigate }) => {
  const [openFaq, setOpenFaq] = useState(null);

  const handleHowItWorksClick = () => {
    if (onNavigate) {
      onNavigate('home');
    }
    setTimeout(() => {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "Do I need blockchain knowledge to vote?",
      answer: "No. The system handles the blockchain process in the background. You only connect your wallet, choose your candidate, and confirm."
    },
    {
      question: "Why do I need MetaMask?",
      answer: "MetaMask signs your voting transaction securely and connects you to the blockchain network."
    },
    {
      question: "Can someone vote twice?",
      answer: "No. The smart contract checks whether a voter has already voted before accepting another vote."
    },
    {
      question: "How do I know my vote was counted?",
      answer: "After confirmation, your vote is recorded on the blockchain and the results update automatically."
    },
    {
      question: "Why can I only see candidates from my area?",
      answer: "Region-based ballots ensure voters only vote for positions and candidates linked to their registered area."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Register as a Voter",
      description: "An election administrator verifies and registers eligible voters before voting begins.",
      checklist: [
        "Provide required voter details",
        "Confirm county, constituency, ward, and polling station",
        "Registration is verified by the admin",
        "Only approved voters can vote"
      ]
    },
    {
      number: "02",
      title: "Connect Your Wallet",
      description: "Open DeVote on your phone or computer and connect your MetaMask wallet.",
      checklist: [
        "Works directly in the browser",
        "Connect using MetaMask",
        "Switch to the correct blockchain network",
        "Your wallet helps sign your vote securely"
      ]
    },
    {
      number: "03",
      title: "Verify Your Eligibility",
      description: "The system checks whether your wallet is registered, verified, and allowed to vote.",
      checklist: [
        "Confirms voter registration",
        "Confirms election is active",
        "Confirms you have not already voted",
        "Shows only eligible voting options"
      ]
    },
    {
      number: "04",
      title: "Cast Your Vote",
      description: "Select your preferred candidate and confirm the transaction using your wallet.",
      checklist: [
        "Choose one candidate",
        "Confirm your vote",
        "Blockchain prevents double voting",
        "Vote is recorded permanently"
      ]
    },
    {
      number: "05",
      title: "Receive Confirmation",
      description: "After voting, the system shows confirmation and updates the results automatically.",
      checklist: [
        "Vote confirmed on-chain",
        "Results update in real time",
        "Vote cannot be edited or deleted",
        "Final winner is displayed after election ends"
      ]
    }
  ];

  const positions = [
    { position: "President", level: "National", seats: "1 seat" },
    { position: "Governor", level: "County", seats: "47 seats" },
    { position: "Senator", level: "County", seats: "47 seats" },
    { position: "Woman Representative", level: "County", seats: "47 seats" },
    { position: "Member of Parliament", level: "Constituency", seats: "290 seats" },
    { position: "Member of County Assembly", level: "Ward", seats: "1,450 seats" }
  ];

  const safetyFeatures = [
    { title: "One Vote Per Person", Icon: CheckCircleIcon },
    { title: "Votes Locked to Your Area", Icon: GlobeIcon },
    { title: "Open and Transparent Results", Icon: EyeIcon },
    { title: "Private Voter Details", Icon: LockIcon },
    { title: "No Proxy Voting", Icon: BanIcon },
    { title: "Instant Tamper-Proof Results", Icon: BoltIcon }
  ];

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
              Simple Guide
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              How Does <span className="text-green-300">DeVote</span> Work?
            </h1>

            <p className="text-lg md:text-xl text-dark-green-100 max-w-3xl mx-auto leading-relaxed mb-8">
              DeVote is a secure, transparent, and simple blockchain-powered voting system. You do not need to be a blockchain expert — if you can use a phone or computer, you can vote.
            </p>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              {["No downloads needed", "Works on mobile and desktop", "Available nationwide"].map((label) => (
                <span key={label} className="inline-flex items-center gap-1.5 text-sm text-dark-green-100">
                  <CheckIcon className="w-4 h-4 text-green-300" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
              Step-by-Step Guide
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              Voting in 5 Easy Steps
            </h2>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-dark-green-200 transform md:-translate-x-1/2"></div>

            {steps.map((step, index) => (
              <div key={index} className={`relative flex flex-col md:flex-row gap-8 mb-12 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                {/* Step number */}
                <div className="absolute left-8 md:left-1/2 w-16 h-16 rounded-full bg-dark-green-600 flex items-center justify-center transform -translate-x-1/2 z-10 shadow-lg">
                  <span className="text-white font-bold text-xl">{step.number}</span>
                </div>

                {/* Content */}
                <div className={`ml-24 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'}`}>
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-xl font-bold text-dark-green-800 mb-3">{step.title}</h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                    <ul className="space-y-2">
                      {step.checklist.map((item, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-600">
                          <CheckIcon className="w-3.5 h-3.5 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="hidden md:block md:w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ballot Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
              The Ballot
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              What Are You Voting For?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              DeVote can support Kenya's six elective positions, from national leadership to ward representation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {positions.map((pos, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                  <BuildingIcon className="w-6 h-6 text-dark-green-600" />
                </div>
                <h3 className="text-xl font-bold text-dark-green-800 mb-2">{pos.position}</h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {pos.level}
                  </span>
                  <span className="text-sm font-semibold text-dark-green-600">
                    {pos.seats}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-wide uppercase text-dark-green-600 mb-6">
              Safety & Fairness
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              How Is Your Vote Kept Safe?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safetyFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="w-12 h-12 rounded-xl bg-dark-green-50 flex items-center justify-center mb-5">
                  <feature.Icon className="w-6 h-6 text-dark-green-600" />
                </div>
                <h3 className="text-xl font-bold text-dark-green-800">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-dark-green-800 pr-4">{faq.question}</span>
                  <span className={`transform transition-transform duration-200 text-dark-green-600 ${openFaq === index ? 'rotate-180' : ''}`}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-dark-green-700 via-dark-green-800 to-dark-green-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Vote?
          </h2>
          <p className="text-xl text-dark-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Connect your wallet and proceed to the voting page when the election is active.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onConnectWallet}
              className="px-8 py-4 bg-white text-dark-green-700 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:bg-gray-50 transition-all duration-300 transform hover:-translate-y-1"
            >
              Sign In to Vote
            </button>
            <button
              onClick={handleHowItWorksClick}
              className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-300"
            >
              View Live Results
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorksPage;