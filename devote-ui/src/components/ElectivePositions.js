import React from 'react';

// SVG icons for each elective position
const PresidentIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="19" width="20" height="2" rx="1"/>
    <rect x="6" y="11" width="2" height="8"/>
    <rect x="11" y="11" width="2" height="8"/>
    <rect x="16" y="11" width="2" height="8"/>
    <path d="M2 11h20"/>
    <path d="M12 3l9 8H3l9-8z"/>
  </svg>
);

const GovernorIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="10" width="18" height="11" rx="1"/>
    <path d="M6 10V7a6 6 0 0 1 12 0v3"/>
    <rect x="9" y="14" width="6" height="7"/>
  </svg>
);

const SenatorIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="8" y1="13" x2="16" y2="13"/>
    <line x1="8" y1="17" x2="16" y2="17"/>
  </svg>
);

const WomanRepIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="6" r="3"/>
    <path d="M12 9v3"/>
    <path d="M9 12h6"/>
    <path d="M12 12v8"/>
    <path d="M9 17h6"/>
  </svg>
);

const ParliamentIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/>
    <path d="M5 21V10l7-7 7 7v11"/>
    <rect x="9" y="14" width="6" height="7"/>
    <path d="M9 10h6"/>
  </svg>
);

const WardIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const POSITION_ICONS = {
  President: PresidentIcon,
  Governor: GovernorIcon,
  Senator: SenatorIcon,
  'Woman Representative': WomanRepIcon,
  'Member of Parliament': ParliamentIcon,
  'Member of County Assembly': WardIcon,
};

const PositionCard = ({ position, level, seats, delay }) => {
  const Icon = POSITION_ICONS[position] || PresidentIcon;
  return (
    <div
      className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-dark-green-500 to-dark-green-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 text-white">
        <Icon />
      </div>
      <h3 className="text-xl font-bold text-dark-green-800 mb-2">{position}</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {level}
        </span>
        <span className="text-sm font-semibold text-dark-green-600">
          {seats} {seats === '1' ? 'seat' : 'seats'}
        </span>
      </div>
    </div>
  );
};

const ElectivePositions = () => {
  const positions = [
    { position: 'President', level: 'National Level', seats: '1' },
    { position: 'Governor', level: 'County Level', seats: '47' },
    { position: 'Senator', level: 'County Level', seats: '47' },
    { position: 'Woman Representative', level: 'County Level', seats: '47' },
    { position: 'Member of Parliament', level: 'Constituency Level', seats: '290' },
    { position: 'Member of County Assembly', level: 'Ward Level', seats: '1,450' },
  ];

  return (
    <section id="positions" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
            6 Elective Positions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Every eligible Kenyan votes for six positions, from national to grassroots level.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {positions.map((pos, index) => (
            <PositionCard
              key={index}
              position={pos.position}
              level={pos.level}
              seats={pos.seats}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ElectivePositions;
