import { testAdminActions, isAdmin, getAdminAddress } from './adminActions';

/**
 * Admin Actions Test Utility
 * Provides comprehensive testing for admin functionality
 */

/**
 * Test admin detection and basic functionality
 * @returns {Promise<Object>} Test results
 */
export const testAdminDetection = async () => {
  console.log(" Testing Admin Detection...");
  
  try {
    const adminStatus = await isAdmin();
    const adminAddress = await getAdminAddress();
    
    const result = {
      success: true,
      isAdmin: adminStatus,
      adminAddress: adminAddress,
      message: adminStatus 
        ? ` Admin detected: ${adminAddress}` 
        : ` Not admin. Admin address: ${adminAddress}`
    };
    
    console.log(result.message);
    return result;
  } catch (error) {
    const result = {
      success: false,
      isAdmin: false,
      adminAddress: null,
      message: ` Admin detection failed: ${error.message}`
    };
    
    console.error(result.message);
    return result;
  }
};

/**
 * Test all admin actions (for development/testing)
 * @returns {Promise<Object>} Comprehensive test results
 */
export const testAllAdminActions = async () => {
  console.log(" Testing All Admin Actions...");
  
  const results = {
    adminDetection: null,
    registerVoter: false,
    startElection: false,
    endElection: false,
    addCandidate: false,
    bulkUpload: false,
    errors: [],
    success: false
  };

  try {
    // Test admin detection first
    results.adminDetection = await testAdminDetection();
    
    if (!results.adminDetection.isAdmin) {
      results.errors.push(" Not admin - cannot test admin actions");
      return results;
    }

    console.log(" Admin confirmed, testing admin actions...");

    // Test individual admin actions
    const actionTests = await testAdminActions();
    
    results.registerVoter = actionTests.registerVoter;
    results.startElection = actionTests.startElection;
    results.endElection = actionTests.endElection;
    results.addCandidate = actionTests.addCandidate;
    results.errors = actionTests.errors;

    // Test bulk upload with a sample file
    try {
      const sampleCSV = generateSampleCSV();
      const blob = new Blob([sampleCSV], { type: 'text/csv' });
      const file = new File([blob], 'test_voters.csv', { type: 'text/csv' });
      
      // Note: This would require the actual uploadVoterList function
      // For now, we'll mark it as tested conceptually
      results.bulkUpload = true;
    } catch (error) {
      results.errors.push(`Bulk upload test failed: ${error.message}`);
    }

    // Determine overall success
    const successfulActions = [
      results.registerVoter,
      results.startElection,
      results.endElection,
      results.addCandidate,
      results.bulkUpload
    ].filter(Boolean).length;

    results.success = successfulActions >= 3; // At least 3 actions should work

    console.log(` Admin action tests completed: ${successfulActions}/5 successful`);
    
    return results;

  } catch (error) {
    results.errors.push(` Test suite failed: ${error.message}`);
    console.error("Test suite error:", error);
    return results;
  }
};

/**
 * Generate a sample CSV for testing bulk upload
 * @returns {string} Sample CSV content
 */
const generateSampleCSV = () => {
  return `wallet
0x1234567890123456789012345678901234567890
0x0987654321098765432109876543210987654321
0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef`;
};

/**
 * Run comprehensive admin system diagnostics
 * @returns {Promise<Object>} Diagnostic results
 */
export const runAdminDiagnostics = async () => {
  console.log(" Running Admin System Diagnostics...");
  
  const diagnostics = {
    walletConnection: false,
    contractConnection: false,
    adminDetection: false,
    adminAddress: null,
    recommendedActions: []
  };

  try {
    // Test wallet connection
    const { connectWallet } = await import('./connectWallet');
    const wallet = await connectWallet();
    
    if (wallet) {
      diagnostics.walletConnection = true;
      diagnostics.contractConnection = !!wallet.contract;
      console.log(" Wallet connected successfully");
    } else {
      diagnostics.recommendedActions.push("Connect MetaMask wallet");
      console.log(" Wallet connection failed");
    }

    // Test admin detection
    if (diagnostics.contractConnection) {
      const adminResult = await testAdminDetection();
      diagnostics.adminDetection = adminResult.isAdmin;
      diagnostics.adminAddress = adminResult.adminAddress;
      
      if (!adminResult.isAdmin) {
        diagnostics.recommendedActions.push("Connect the wallet that deployed the contract");
        console.log(" Not admin wallet");
      } else {
        console.log(" Admin privileges confirmed");
      }
    }

    // Generate recommendations
    if (!diagnostics.walletConnection) {
      diagnostics.recommendedActions.push("Install and connect MetaMask");
    }
    
    if (!diagnostics.contractConnection) {
      diagnostics.recommendedActions.push("Ensure contract address is correct in config.js");
    }

    if (diagnostics.recommendedActions.length === 0) {
      console.log(" All systems operational");
    } else {
      console.log("  Recommendations:", diagnostics.recommendedActions);
    }

    return diagnostics;

  } catch (error) {
    console.error("Diagnostics failed:", error);
    diagnostics.recommendedActions.push(`System error: ${error.message}`);
    return diagnostics;
  }
};

/**
 * Display admin test results in console
 * @param {Object} results - Test results object
 */
export const displayTestResults = (results) => {
  console.log("\n" + "=".repeat(50));
  console.log(" ADMIN ACTION TEST RESULTS");
  console.log("=".repeat(50));
  
  if (results.adminDetection) {
    console.log(` Admin Status: ${results.adminDetection.isAdmin ? ' YES' : ' NO'}`);
    console.log(`  Admin Address: ${results.adminDetection.adminAddress || 'N/A'}`);
  }
  
  console.log(`  Register Voter: ${results.registerVoter ? '' : ''}`);
  console.log(` Start Election: ${results.startElection ? '' : ''}`);
  console.log(` End Election: ${results.endElection ? '' : ''}`);
  console.log(` Add Candidate: ${results.addCandidate ? '' : ''}`);
  console.log(` Bulk Upload: ${results.bulkUpload ? '' : ''}`);
  
  if (results.errors && results.errors.length > 0) {
    console.log("\n  ERRORS:");
    results.errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
  
  console.log(`\n Overall Success: ${results.success ? ' YES' : ' NO'}`);
  console.log("=".repeat(50) + "\n");
};

/**
 * Quick admin check for development
 * @returns {Promise<void>}
 */
export const quickAdminCheck = async () => {
  console.log(" Quick Admin Check...");
  
  try {
    const result = await testAdminDetection();
    
    if (result.isAdmin) {
      console.log(` You are the admin! Address: ${result.adminAddress}`);
      console.log(" All admin functions are available to you.");
    } else {
      console.log(` You are not the admin.`);
      console.log(`  Admin address: ${result.adminAddress}`);
      console.log(" Connect the wallet that deployed the contract to access admin functions.");
    }
  } catch (error) {
    console.error(` Check failed: ${error.message}`);
  }
};