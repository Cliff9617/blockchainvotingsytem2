# Blockchain Voting System - Setup and Deployment Guide

This guide will help you set up and run the complete Blockchain Voting System with proper network configuration.

## 🚀 Quick Start

### 1. Start Hardhat Local Network

```bash
# In the project root directory
npx hardhat node
```

This will start the Hardhat local blockchain on:
- **RPC URL**: http://127.0.0.1:8545
- **Chain ID**: 31337 (0x7A69 in hexadecimal)
- **Default Accounts**: 20 pre-funded accounts available

### 2. Deploy the Contract

In a new terminal window:

```bash
# Deploy to the local Hardhat network
npx hardhat run deploy.js --network hardhat
```

Expected output:
```
Deploying Voting contract to Hardhat network...
✅ Voting contract deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📋 Contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔗 Network: Hardhat Local (Chain ID: 31337)
🌐 RPC URL: http://127.0.0.1:8545
👑 Contract admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 3. Start the React Frontend

```bash
# Navigate to the UI directory
cd ui

# Install dependencies (if not already installed)
npm install

# Start the development server
npm start
```

The app will open at http://localhost:3000

## 🔧 MetaMask Configuration

### Automatic Network Setup

The updated App.js will automatically:

1. **Detect Network**: Check if you're connected to the correct network (Chain ID: 31337)
2. **Switch Network**: Automatically switch to Hardhat Local if connected to another network
3. **Add Network**: If Hardhat Local is not in your MetaMask, it will automatically add it
4. **Verify Contract**: Check that the contract exists at the expected address

### Manual Network Setup (if needed)

If automatic setup fails, manually add the Hardhat network to MetaMask:

1. Open MetaMask
2. Click on the network dropdown
3. Select "Add Network"
4. Enter the following details:

```
Network Name: Hardhat Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

5. Click "Save"

### Import Test Account

To interact with the contract, import one of the test accounts from your local Hardhat node (run `npx hardhat node` to view test accounts):

**Test Account Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`

## 🎯 Key Features Fixed

### ✅ Network Validation
- Automatically detects and switches to Hardhat Local network
- Prevents connection to Ethereum Mainnet (Chain ID: 1)
- Validates contract deployment before allowing interactions

### ✅ Error Handling
- Prevents BAD_DATA decode errors
- Proper error messages for network issues
- Graceful handling of contract call failures

### ✅ Contract Verification
- Verifies contract exists at the expected address
- Checks contract code before creating ethers.js Contract instance
- Prevents calls to non-existent contracts

### ✅ Improved User Experience
- Clear status indicators
- Loading states during wallet connection
- Network status display
- Error messages for common issues

## 🛠 Technical Details

### Chain ID Mapping
- **Hardhat Local**: 31337 (0x7A69)
- **Ethereum Mainnet**: 1 (0x1) - **BLOCKED**
- **Sepolia Testnet**: 11155111 (0xaa36a7)

### Contract ABI
The ABI includes all necessary functions:
- `admin()` - Get contract admin address
- `candidatesCount()` - Get total number of candidates
- `candidates(uint256)` - Get candidate details
- `addCandidate(string)` - Add new candidate (admin only)
- `startElection()` - Start election (admin only)
- `endElection()` - End election (admin only)
- `vote(uint256)` - Cast vote

### Security Features
- Network validation prevents wrong chain interactions
- Contract verification prevents calls to non-existent contracts
- Admin-only functions properly restricted
- Election state validation

## 🔍 Troubleshooting

### "Contract not deployed on connected network"
- Ensure Hardhat node is running: `npx hardhat node`
- Verify contract is deployed: `npx hardhat run deploy.js --network hardhat`
- Check MetaMask is connected to Hardhat Local network

### "Failed to switch to Hardhat network"
- Manually add Hardhat Local network to MetaMask
- Ensure MetaMask is updated to latest version
- Try refreshing the page after adding the network

### "Connection rejected by user"
- Click "Connect Wallet" and approve in MetaMask
- Ensure MetaMask extension is enabled

### "Failed to load admin/candidates"
- Check that contract is properly deployed
- Verify network connection
- Check browser console for detailed error messages

## 📝 Usage Instructions

1. **Start Hardhat Node**: `npx hardhat node`
2. **Deploy Contract**: `npx hardhat run deploy.js --network hardhat`
3. **Start Frontend**: `cd ui && npm start`
4. **Connect Wallet**: Click "Connect Wallet" in the app
5. **Add Candidates**: Use admin panel to add candidates
6. **Start Election**: Admin starts the election
7. **Vote**: Users can vote for candidates
8. **End Election**: Admin ends the election to view results

## 🎨 Admin Features

- **Add Candidates**: Before election starts
- **Start/End Election**: Control election lifecycle
- **View Results**: Real-time voting results with charts

## 👥 User Features

- **View Candidates**: See all candidates and their vote counts
- **Vote**: Cast votes during active election
- **View Results**: See final results after election ends

## 🚨 Important Notes

- **Never use this on mainnet** - This is for educational/demo purposes only
- **Test with fake accounts** - Use the provided test accounts from Hardhat
- **Local development only** - Designed for localhost development
- **No production security** - Missing many production security features

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [MetaMask Developer Docs](https://docs.metamask.io/)
- [React Chart.js 2](https://react-chartjs-2.js.org/)

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all services are running (Hardhat node, frontend)
3. Check browser console for error details
4. Ensure MetaMask is configured correctly
5. Verify contract deployment was successful

Happy voting! 🗳️