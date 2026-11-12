import React from 'react';
import { GlobeIcon, BuildingIcon, MapPinIcon, UsersIcon } from './common/Icons';

const StatCard = ({ Icon, value, label, delay }) => (
  <div
    className="bg-white rounded-2xl shadow-lg p-6 md:p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-dark-green-50 flex items-center justify-center">
      <Icon className="w-7 h-7 text-dark-green-600" />
    </div>
    <h3 className="text-4xl md:text-5xl font-bold text-dark-green-800 mb-2">{value}</h3>
    <p className="text-gray-600 font-medium">{label}</p>
  </div>
);

const ElectionStats = () => {
  const stats = [
    { Icon: GlobeIcon, value: '47', label: 'Counties' },
    { Icon: BuildingIcon, value: '290', label: 'Constituencies' },
    { Icon: MapPinIcon, value: '1,450', label: 'Wards' },
    { Icon: UsersIcon, value: '22M+', label: 'Registered Voters' },
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-green-800 mb-4">
            Nationwide Coverage
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            DeVote powers elections across every corner of Kenya, ensuring every vote counts from coast to lake.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              Icon={stat.Icon}
              value={stat.value}
              label={stat.label}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ElectionStats;