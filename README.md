# DeVote National - Professional National-Grade Election Management Platform

## 🇰🇪 Blockchain-Based Voting System for National Elections

DeVote National is a professional, production-ready election management platform built on Ethereum blockchain technology. Designed for government election commissions, electoral bodies, and democratic institutions seeking transparent, auditable, and secure voting systems.

---

## 🏛️ Key Features

### Role-Based Access Control (RBAC)
- **Super Admin** - Full system control
- **National Election Commissioner** - National-level election management
- **County Returning Officer** - County-level administration
- **Constituency Officer** - Constituency-level management
- **Ward Officer** - Ward-level operations
- **Auditor** - Read-only audit access
- **Observer** - Election monitoring access
- **Technical Support** - System maintenance

### Multi-Position Voting
Support for 6 elective positions:
1. President (National)
2. Governor (County)
3. Senator (County)
4. Woman Representative (County)
5. Member of Parliament (Constituency)
6. MCA (Ward)

### Security Features
- **Multi-Signature Control** - Critical actions require multiple approvals
- **Audit Trail** - Immutable blockchain-based activity logging
- **Ballot Secrecy** - Vote choice privacy preservation
- **Input Sanitization** - XSS and injection attack prevention
- **Rate Limiting** - Protection against abuse
- **Session Management** - Secure user sessions

### Election Management
- Real-time results dashboard
- Geographic-based voter registration
- Candidate management by position
- Bulk voter registration
- Incident and dispute management
- Election status monitoring

---

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity ^0.8.20** - Smart contract development
- **Hardhat** - Development environment
- **Ethers.js v6** - Blockchain interaction
- **Sepolia Testnet** - Testing network

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Firebase** - Backend services
- **Web3/Ethers.js** - Wallet connectivity

### Development
- **Node.js** - Runtime environment
- **npm** - Package management
- **Git** - Version control

---

## 📁 Project Structure

```
devote-national/
├── contracts/
│   ├── DeVoteNational.sol    # Main election contract with RBAC
│   ├── voting.sol            # Voting logic
│   └── Inbox.sol             # Utility contract
├── devote-ui/
│   └── src/
│       ├── components/       # React components
│       │   ├── NationalResultsCenter.js
│       │   ├── AdminPanel.js
│       │   ├── WalletConnect.js
│       │   └── ...
│       ├── hooks/            # Custom React hooks
│       │   ├── useRBAC.js
│       │   ├── useAuditTrail.js
│       │   ├── useMultiSig.js
│       │   ├── useIncidentManagement.js
│       │   ├── useElection.js
│       │   └── useContract.js
│       ├── config/
│       │   ├── index.js      # Main config with ABI
│       │   └── constants.js  # Constants and enums
│       ├── utils/
│       │   ├── security.js   # Security utilities
│       │   └── ...
│       ├── services/         # Firebase services
│       ├── pages/            # Page components
│       └── App.js            # Main application
├── scripts/
│   └── deploy.js             # Deployment script
├── test/                     # Test files
├── hardhat.config.js         # Hardhat configuration
└── package.json              # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v16+ and npm
- MetaMask browser extension
- Sepolia testnet ETH

### Installation

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm run ui:install

# Or install everything at once
npm run install:all
```

### Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update environment variables:
```env
# Contract Address (update after deployment)
REACT_APP_CONTRACT_ADDRESS=0x...

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### Deployment

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia

# Update config.js with deployed contract address
```

### Running the Application

```bash
# Start development server
npm run ui:start

# Build for production
npm run ui:build

# Run tests
npm run ui:test
```

---

## 📋 Usage Guide

### For Voters

1. **Connect Wallet**: Click "Sign In to Vote" and connect MetaMask
2. **Register**: Complete voter registration with your details
3. **Wait for Approval**: Election officials will verify your registration
4. **Vote**: Once approved and election starts, cast your vote for each position
5. **View Results**: Check real-time results on the Results page

### For Election Officials

1. **Login**: Connect your official wallet
2. **Access Admin Panel**: Navigate to Admin Dashboard
3. **Manage Voters**: Approve/reject voter registrations
4. **Manage Candidates**: Add candidates for each position
5. **Monitor Election**: View audit logs and incident reports

### For Auditors

1. **Login**: Connect your auditor wallet
2. **View Audit Trail**: Access complete activity logs
3. **Verify Chain Integrity**: Confirm audit log chain validity
4. **Export Reports**: Download audit data for analysis

---

## 🔒 Security Considerations

### Smart Contract Security
- Reentrancy protection
- Access control modifiers
- Input validation
- Event emissions for transparency
- Chain-linked audit logs

### Frontend Security
- Input sanitization
- XSS prevention
- Rate limiting
- Session management
- Wallet address validation

### Operational Security
- Multi-signature requirements for critical actions
- Role-based access control
- Geographic scope restrictions
- Incident reporting system

---

## 📊 Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   MetaMask      │
│                 │    │                 │
│  ┌───────────┐  │    └────────┬────────┘
│  │ Components│  │             │
│  └─────┬─────┘  │             │
│        │        │             │
│  ┌─────▼─────┐  │             │
│  │   Hooks   │◄─┼─────────────┤
│  └─────┬─────┘  │             │
│        │        │             │
│  ┌─────▼─────┐  │             │
│  │  Config   │  │             │
│  └─────┬─────┘  │             │
└────────┼────────┘             │
         │                       │
         │     ┌─────────────────┘
         │     │
         ▼     ▼
┌─────────────────┐
│  Ethers.js      │
│  Provider       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│  Sepolia        │    │    Firebase     │
│  Network        │    │    (Off-chain)  │
└─────────────────┘    └─────────────────┘
```

---

## 📄 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed system architecture
- [SECURITY.md](./SECURITY.md) - Security policies and procedures
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions

---

## 🧪 Testing

```bash
# Run contract tests
npm test

# Run frontend tests
npm run ui:test

# Run integration tests
npm run test:voting
```

---

## 🌐 Live Deployment & Hosting

- **Frontend Hosting**: Hosted and deployed on [Netlify](https://www.netlify.com/)
- **Smart Contract**: Deployed on Sepolia Ethereum Testnet
- **GitHub Repository**: [Cliff9617/blockchainvotingsytem2](https://github.com/Cliff9617/blockchainvotingsytem2)

---

## 🤝 Collaboration & Contributors

Developed in collaboration with:
- **Cliff9617** ([GitHub Profile](https://github.com/Cliff9617)) - Lead Architect & Core Developer
- **JB7-creator** ([GitHub Profile](https://github.com/JB7-creator)) - Collaborator & Contributor

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License - see LICENSE file for details

---

## 📞 Support

For technical support and inquiries:
- GitHub Issues: [Report bugs](https://github.com/Cliff9617/blockchainvotingsytem2/issues)
- Documentation: [Read the docs](./README.md)

---

## ⚠️ Disclaimer

This system is designed for use on testnets (Sepolia). For production deployment on mainnet, additional security audits, legal compliance checks, and regulatory approvals are required.

---

## 🙏 Acknowledgments

Built with ❤️ for democratic institutions worldwide.

*Transparency • Integrity • Democracy*