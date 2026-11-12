# DeVote National - Deployment Guide

## Production Deployment Instructions

This guide covers the complete deployment process for the DeVote National election management platform.

---

## 📋 Pre-Deployment Checklist

### Smart Contract Deployment
- [ ] Contracts compiled successfully
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Contract addresses documented

### Frontend Deployment
- [ ] Environment variables configured
- [ ] Contract ABI updated with deployed addresses
- [ ] Build completed without errors
- [ ] SEO metadata configured
- [ ] Analytics configured (if needed)

### Infrastructure
- [ ] Firebase project configured
- [ ] Firestore security rules deployed
- [ ] Storage buckets configured
- [ ] CDN configured (if needed)
- [ ] SSL certificates valid

---

## 🚀 Smart Contract Deployment

### 1. Configure Network

Update `hardhat.config.js` with your deployment network:

```javascript
module.exports = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
    // Add mainnet for production
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1,
    }
  },
  // ...
};
```

### 2. Set Environment Variables

Create `.env` file:

```env
# Deployment
PRIVATE_KEY=your_deployer_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org

# Contract addresses (update after deployment)
CONTRACT_ADDRESS=0x...
```

### 3. Deploy Contracts

```bash
# Compile
npm run compile

# Deploy to Sepolia (testnet)
npm run deploy:sepolia

# Deploy to Mainnet (production)
# npx hardhat run scripts/deploy.js --network mainnet
```

### 4. Verify Contracts

```bash
# Verify on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Or use the verification script
npx hardhat run scripts/verify.js --network sepolia
```

### 5. Initialize Election

After deployment, initialize the election:

```javascript
// In a script or via the admin panel
const tx = await contract.initializeElection(
  1,                    // electionId
  "General Election 2024",
  "2024-08-09",
  3                     // multiSigThreshold
);
await tx.wait();
```

---

## 🌐 Frontend Deployment

### 1. Update Configuration

Update `devote-ui/src/config/index.js`:

```javascript
export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "0xYourDeployedAddress";
```

### 2. Configure Environment Variables

Create `devote-ui/.env`:

```env
REACT_APP_CONTRACT_ADDRESS=0xYourDeployedAddress
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Build Application

```bash
cd devote-ui
npm run build
```

### 4. Deploy to Hosting

#### Option A: Vercel
```bash
npm install -g vercel
cd devote-ui
vercel --prod
```

#### Option B: Netlify
```bash
npm install -g netlify-cli
cd devote-ui
netlify deploy --prod
```

#### Option C: Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy --only hosting
```

#### Option D: AWS S3 + CloudFront
```bash
aws s3 sync devote-ui/build s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

---

## 🔥 Firebase Configuration

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project
3. Enable required services

### 2. Configure Firestore

Create these collections:
- `voters` - Voter registration data
- `candidates` - Candidate profiles
- `incidents` - Incident reports
- `audit_logs` - Off-chain audit data

### 3. Deploy Security Rules

Create `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Voters collection - only admins can write
    match /voters/{voterId} {
      allow read: if isAdmin(request.auth.token);
      allow write: if isAdmin(request.auth.token);
    }
    
    // Candidates - public read, admin write
    match /candidates/{candidateId} {
      allow read: if true;
      allow write: if isAdmin(request.auth.token);
    }
    
    // Incidents - authenticated users can create
    match /incidents/{incidentId} {
      allow read: if isAdmin(request.auth.token) || request.resource.data.reporter == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if isAdmin(request.auth.token);
    }
    
    // Audit logs - admin only
    match /audit_logs/{logId} {
      allow read, write: if isAdmin(request.auth.token);
    }
  }
  
  function isAdmin(token) {
    return token.admin == true;
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🔧 Post-Deployment Tasks

### 1. Assign Roles

Assign administrative roles to election officials:

```javascript
// Super Admin (deployer is automatically super admin)
// Assign National Commissioner
await contract.assignRole(
  commissionerAddress,
  7, // NationalElectionCommissioner
  "", "", ""
);

// Assign County Officers
await contract.assignRole(
  countyOfficerAddress,
  6, // CountyReturningOfficer
  "Nairobi", "", ""
);
```

### 2. Add Candidates

Add candidates for each position:

```javascript
// President (national)
await contract.addCandidate("John Doe", 0, "", "", "");

// Governor (county)
await contract.addCandidate("Jane Smith", 1, "Nairobi", "", "");

// Senator (county)
await contract.addCandidate("Bob Wilson", 2, "Nairobi", "", "");

// Woman Representative (county)
await contract.addCandidate("Alice Brown", 3, "Nairobi", "", "");

// MP (constituency)
await contract.addCandidate("Charlie Davis", 4, "Nairobi", "Westlands", "");

// MCA (ward)
await contract.addCandidate("Eve Johnson", 5, "Nairobi", "Westlands", "Parklands");
```

### 3. Start Election (Multi-Sig)

```javascript
// Create proposal to start election
await contract.createMultiSigProposal(0, "0x"); // StartElection

// Other commissioners approve
await contract.approveMultiSigProposal(proposalId);
```

---

## 📊 Monitoring Setup

### 1. Contract Monitoring

Set up alerts for:
- Large vote transactions
- Multi-sig proposals
- Role changes
- Election status changes

### 2. Frontend Monitoring

Configure:
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Uptime monitoring

### 3. Log Aggregation

Set up centralized logging for:
- API calls
- User actions
- System errors
- Security events

---

## 🔄 Maintenance Procedures

### Regular Tasks
- [ ] Monitor contract gas usage
- [ ] Review audit logs weekly
- [ ] Check incident reports daily
- [ ] Update frontend dependencies monthly
- [ ] Security patches applied promptly

### Emergency Procedures
1. **Pause Election**: Multi-sig emergency pause
2. **Investigate**: Review audit logs and incidents
3. **Resolve**: Fix issues and document
4. **Resume**: Multi-sig resume after resolution

---

## 📞 Support Contacts

### Technical Support
- GitHub Issues: [Report bugs](https://github.com/Cliff9617/Blockchain-voting-system/issues)
- Email: support@devote-elections.org

### Emergency Contacts
- Technical Lead: +254 XXX XXX XXX
- Security Team: security@devote-elections.org

---

## ✅ Deployment Verification

After deployment, verify:

1. **Contract Functions**
   - [ ] Can read election state
   - [ ] Can read candidates
   - [ ] Can read voter status
   - [ ] Admin functions work correctly

2. **Frontend**
   - [ ] Wallet connection works
   - [ ] Pages load correctly
   - [ ] Voting flow works
   - [ ] Results display correctly

3. **Security**
   - [ ] Role permissions enforced
   - [ ] Audit logs recording
   - [ ] Multi-sig working
   - [ ] No console errors

---

*Last updated: 2024*