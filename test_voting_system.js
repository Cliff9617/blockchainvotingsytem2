const { ethers } = require("ethers");

// Configuration
const HARDHAT_RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x4c983064bd5a6E903bfCF755cF1789f30ea449Be";

const contractABI = [
  {
    inputs: [],
    name: "admin",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startElection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "endElection",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "_name", type: "string" }],
    name: "addCandidate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_candidateId", type: "uint256" }],
    name: "vote",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "candidatesCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "candidates",
    outputs: [
      { internalType: "string", name: "name", type: "string" },
      { internalType: "uint256", name: "voteCount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
];

async function testVotingSystem() {
  console.log("🧪 Testing Voting System...\n");

  try {
    // 1. Connect to Hardhat network
    console.log("1. Connecting to Hardhat network...");
    const provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`   ✅ Connected to chain: ${network.chainId} (0x${network.chainId.toString(16)})`);
    
    if (network.chainId !== 31337) {
      throw new Error(`Wrong network! Expected 31337, got ${network.chainId}`);
    }

    // 2. Check contract exists
    console.log("2. Verifying contract deployment...");
    const contractCode = await provider.getCode(CONTRACT_ADDRESS);
    if (!contractCode || contractCode === "0x") {
      throw new Error(`Contract not found at ${CONTRACT_ADDRESS}`);
    }
    console.log(`   ✅ Contract found at ${CONTRACT_ADDRESS}`);

    // 3. Create contract instance
    console.log("3. Creating contract instance...");
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
    console.log("   ✅ Contract instance created");

    // 4. Test admin() function
    console.log("4. Testing admin() function...");
    const admin = await contract.admin();
    console.log(`   ✅ Admin: ${admin}`);

    // 5. Test candidatesCount() function
    console.log("5. Testing candidatesCount() function...");
    const count = await contract.candidatesCount();
    console.log(`   ✅ Candidates count: ${count.toString()}`);

    // 6. Test candidates() function for existing candidates
    console.log("6. Testing candidates() function...");
    if (count > 0) {
      const candidate = await contract.candidates(1);
      console.log(`   ✅ First candidate: ${candidate.name} (votes: ${candidate.voteCount.toString()})`);
    } else {
      console.log("   ℹ️  No candidates yet");
    }

    // 7. Test election status
    console.log("7. Testing election status...");
    const started = await contract.electionStarted();
    const ended = await contract.electionEnded();
    console.log(`   ✅ Election started: ${started}, ended: ${ended}`);

    console.log("\n🎉 All tests passed! The voting system is working correctly.");
    console.log("\n📋 Summary:");
    console.log(`   - Network: Hardhat Local (Chain ID: ${network.chainId})`);
    console.log(`   - Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   - Admin: ${admin}`);
    console.log(`   - Candidates: ${count.toString()}`);
    console.log(`   - Election: ${started ? (ended ? "Ended" : "Active") : "Not Started"}`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("💡 Make sure:");
    console.error("   1. Hardhat node is running: npx hardhat node");
    console.error("   2. Contract is deployed: npx hardhat run deploy.js --network hardhat");
    console.error("   3. Using correct contract address");
    process.exit(1);
  }
}

// Run the test
testVotingSystem();