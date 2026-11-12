# DeVote National - System Architecture

## Overview

DeVote National is a professional-grade, blockchain-based election management platform designed for national-scale deployments. The system combines Ethereum smart contracts for immutable vote recording, React frontend for user interaction, and Firebase for auxiliary data storage.

## System Components

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DeVote National                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐      │
│  │   React UI       │    │   Smart Contract │    │   Firebase       │      │
│  │   (Frontend)     │◄──►│   (Ethereum)     │◄──►│   (Backend)      │      │
│  │                  │    │                  │    │                  │      │
│  │  • Voting UI     │    │  • Vote Storage  │    │  • User Profiles │      │
│  │  • Results       │    │  • RBAC          │    │  • Audit Logs    │      │
│  │  • Admin Panel   │    │  • Multi-Sig     │    │  • Incidents     │      │
│  │  • Audit Viewer  │    │  • Audit Trail   │    │  • Documents     │      │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘      │
│           │                       │                       │                 │
│           └───────────────────────┴───────────────────────┘                 │
│                                   │                                          │
│                          ┌────────▼────────┐                                │
│                          │   MetaMask       │                                │
│                          │   (Wallet)       │                                │
│                          └─────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Smart Contract Architecture

### DeVoteNational.sol

The core smart contract implements:

#### 1. Role-Based Access Control (RBAC)

```
Role Hierarchy (ascending privilege):
├── None (0) - No role
├── TechnicalSupport (1) - System maintenance
├── Observer (2) - Read-only access
├── Auditor (3) - Audit log access
├── WardOfficer (4) - Ward-level management
├── ConstituencyOfficer (5) - Constituency-level management
├── CountyReturningOfficer (6) - County-level management
├── NationalElectionCommissioner (7) - National management
└── SuperAdmin (8) - Full system control
```

#### 2. Multi-Signature Control

Critical actions require multiple approvals:
- Start Election
- End Election
- Publish Results
- Emergency Pause
- Bulk Voter Approval
- Configuration Changes

#### 3. Audit Trail

Every action is logged with:
- Action type
- Actor address and role
- Timestamp
- Geographic scope
- Entity hash
- Previous log hash (chain integrity)

#### 4. Ballot Secrecy

- Vote choices stored privately
- Anonymous vote tokens prevent linking voters to choices
- Public verification without exposing vote content

## Frontend Architecture

### Folder Structure

```
devote-ui/src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Card, etc.)
│   ├── layout/         # Layout components (Navbar, Footer, etc.)
│   ├── voting/         # Voting-specific components
│   ├── admin/          # Admin panel components
│   ├── results/        # Results display components
│   └── audit/          # Audit trail components
├── pages/              # Application pages
│   ├── HomePage.js
│   ├── VotePage.js
│   ├── ResultsPage.js
│   ├── AdminPage.js
│   ├── AuditPage.js
│   └── ObserverPage.js
├── hooks/              # Custom React hooks
│   ├── useContract.js  # Contract interaction
│   ├── useElection.js  # Election state
│   ├── useAdmin.js     # Admin functions
│   └── useAuth.js      # Authentication
├── services/           # API services
│   ├── contractService.js
│   ├── firebaseService.js
│   └── auditService.js
├── utils/              # Utility functions
│   ├── constants.js    # Application constants
│   ├── helpers.js      # Helper functions
│   └── validation.js   # Input validation
├── context/            # React context providers
│   ├── ElectionContext.js
│   ├── AuthContext.js
│   └── NotificationContext.js
├── config.js           # Configuration
└── firebase.js         # Firebase initialization
```

### Key Components

#### ElectionContext
Provides global election state:
- Current election config
- User role and permissions
- Voting status
- Real-time results

#### useContract Hook
Handles all smart contract interactions:
- Contract initialization
- Transaction sending
- Event listening
- Error handling

## Security Architecture

### Smart Contract Security

1. **Access Control**: Role-based modifiers on all sensitive functions
2. **Reentrancy Protection**: Checks-Effects-Interactions pattern
3. **Input Validation**: All inputs validated before processing
4. **Event Emissions**: All state changes emit events
5. **Audit Trail**: Immutable log of all actions

### Frontend Security

1. **Input Sanitization**: All user inputs sanitized
2. **XSS Prevention**: React's built-in XSS protection
3. **Wallet Validation**: Address format validation
4. **Rate Limiting**: Client-side rate limiting
5. **Session Management**: Secure session handling

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Audit logs - read only for auditors
    match /auditLogs/{logId} {
      allow read: if isAuditor() || isAdmin();
      allow write: if false; // Immutable
    }
    
    // User profiles - own profile only
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Incidents - restricted access
    match /incidents/{incidentId} {
      allow read: if isOfficial() || isAuditor();
      allow create: if request.auth != null;
      allow update: if isOfficial();
    }
  }
}
```

## Data Flow

### Voting Flow

```
1. Voter connects wallet
2. System verifies voter registration
3. Voter generates secure vote token
4. Voter selects candidates for each position
5. Vote transaction submitted to contract
6. Contract validates and records vote
7. Vote token marked as used
8. Event emitted for real-time updates
9. Results updated automatically
```

### Admin Flow

```
1. Admin connects wallet
2. System verifies admin role
3. Admin performs action (add candidate, register voter, etc.)
4. For critical actions: multi-sig proposal created
5. Other commissioners approve proposal
6. Once threshold reached, action executed
7. Audit log entry created
8. Event emitted for UI updates
```

## Deployment Architecture

### Network Configuration

| Network | Purpose | Chain ID |
|---------|---------|----------|
| Sepolia | Development/Testing | 11155111 |
| Ethereum Mainnet | Production | 1 |

### Contract Addresses

| Environment | Address |
|-------------|---------|
| Sepolia (Dev) | Deploy per setup |
| Mainnet (Prod) | TBA |

## Scalability Considerations

### Current Limitations

1. **Gas Costs**: Each vote requires a transaction
2. **Throughput**: Limited by Ethereum block time
3. **Storage**: On-chain storage is expensive

### Future Improvements

1. **Layer 2 Solutions**: Polygon/Matic for lower costs
2. **Vote Batching**: Batch multiple votes
3. **Off-chain Voting**: Zero-knowledge proofs for privacy
4. **IPFS Storage**: Store large data off-chain

## Monitoring & Observability

### Key Metrics

- Total registered voters
- Voter turnout percentage
- Votes per position
- Transaction success rate
- Gas costs
- Active sessions

### Alerting

- Failed transactions
- Unusual voting patterns
- Multi-sig proposal expirations
- System errors

## Disaster Recovery

### Backup Strategy

1. **Smart Contract**: Immutable on blockchain
2. **Frontend**: Version controlled in Git
3. **Firebase**: Automated daily backups
4. **Configuration**: Stored in environment variables

### Recovery Procedures

1. **Contract Issues**: Deploy new contract, migrate data
2. **Frontend Issues**: Rollback to previous version
3. **Firebase Issues**: Restore from backup
4. **Network Issues**: Switch to backup RPC endpoint