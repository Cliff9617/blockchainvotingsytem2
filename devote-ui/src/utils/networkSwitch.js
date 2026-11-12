import { ethers } from 'ethers';
import { SEPOLIA_NETWORK } from '../config';

// Re-export SEPOLIA_NETWORK from the single source of truth for backward compatibility
export { SEPOLIA_NETWORK };

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not detected");
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_NETWORK.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_NETWORK],
        });
        return true;
      } catch (addError) {
        throw new Error("Failed to add Sepolia network to MetaMask");
      }
    } else {
      throw new Error("Failed to switch to Sepolia network");
    }
  }
};

export const getCurrentNetwork = async () => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    return {
      chainId: network.chainId,
      name: network.name,
      isSepolia: network.chainId === parseInt(SEPOLIA_NETWORK.chainId, 16)
    };
  } catch (error) {
    console.error("Failed to get current network:", error);
    return null;
  }
};

export const ensureSepoliaNetwork = async () => {
  const network = await getCurrentNetwork();
  
  if (!network) {
    throw new Error("Unable to detect network");
  }

  if (!network.isSepolia) {
    await switchToSepolia();
    return true;
  }

  return false; // Already on Sepolia
};