// Simple test to verify the wallet connection utility works
// This file can be imported and used to test the connection

import { connectWallet } from './connectWallet';

export const testConnection = async () => {
  console.log('Testing wallet connection...');
  
  try {
    const result = await connectWallet();
    
    if (result) {
      console.log(' Wallet connected successfully!');
      console.log('Connected address:', result.address);
      console.log('Contract instance created:', !!result.contract);
      return true;
    } else {
      console.log(' Wallet connection failed');
      return false;
    }
  } catch (error) {
    console.error(' Error testing connection:', error);
    return false;
  }
};

// Export for testing purposes
export { connectWallet };