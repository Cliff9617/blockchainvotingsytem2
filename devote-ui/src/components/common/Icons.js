import React from "react";

/**
 * Central SVG icon library (Heroicons-style outline paths).
 * Use these instead of emoji characters everywhere in the UI.
 * All icons inherit `currentColor` and size via className.
 */

const Svg = ({ className, strokeWidth = 2, children }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {children}
  </svg>
);

const P = ({ d, strokeWidth = 2 }) => (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth} d={d} />
);

export const CheckIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M5 13l4 4L19 7" strokeWidth={2.5} /></Svg>
);

export const CheckCircleIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>
);

export const XCircleIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>
);

export const XIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M6 18L18 6M6 6l12 12" /></Svg>
);

export const AlertTriangleIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></Svg>
);

export const ClockIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>
);

export const MapPinIcon = ({ className = "w-4 h-4" }) => (
  <Svg className={className}>
    <P d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <P d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </Svg>
);

export const ShieldCheckIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></Svg>
);

export const LockIcon = ({ className = "w-4 h-4" }) => (
  <Svg className={className}><P d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></Svg>
);

export const BallotBoxIcon = ({ className = "w-6 h-6" }) => (
  <Svg className={className}><P d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></Svg>
);

export const UsersIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></Svg>
);

export const BarChartIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></Svg>
);

export const AwardIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></Svg>
);

export const DownloadIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></Svg>
);

export const ChevronRightIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M9 5l7 7-7 7" /></Svg>
);

export const ChevronLeftIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M15 19l-7-7 7-7" /></Svg>
);

export const ChevronDownIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M19 9l-7 7-7-7" /></Svg>
);

export const GlobeIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </Svg>
);

export const EyeIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <P d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </Svg>
);

export const BoltIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M13 10V3L4 14h7v7l9-11h-7z" /></Svg>
);

export const IdCardIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c-1.306 0-2.417.835-2.83 2M9 14a6 6 0 00-4 2m10-2a6 6 0 014 2M9 17a6 6 0 00-3 2m6 0a6 6 0 00-3-2m6-2a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2" />
  </Svg>
);

export const BanIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></Svg>
);

export const SearchIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </Svg>
);

export const ReceiptIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3-2 2 2 2-2 2 2 2-2 2 2z" />
  </Svg>
);

export const BuildingIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </Svg>
);

export const PhoneIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></Svg>
);

export const PlayIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><P d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Svg>
);

export const StopIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <P d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
  </Svg>
);

export const LinkIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
    <P d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
  </Svg>
);

export const LinkSlashIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.02-4.457a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.1 1.1" /></Svg>
);

export const TrendingUpIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </Svg>
);

export const TrendingDownIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></Svg>
);

export const ScaleIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></Svg>
);

export const HandshakeIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></Svg>
);

export const DocumentTextIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </Svg>
);

export const ArrowRightIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </Svg>
);

export const RefreshIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </Svg>
);

export const MinusIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}><P d="M20 12H4" /></Svg>
);

export const InfoIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </Svg>
);

export const LayersIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </Svg>
);

export const CubeIcon = ({ className = "w-5 h-5" }) => (
  <Svg className={className}>
    <P d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </Svg>
);
