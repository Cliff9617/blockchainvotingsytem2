import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../config";

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Check if MetaMask is installed (with mobile fallback)
export const isMetaMaskInstalled = () => {
  if (window.ethereum && window.ethereum.isMetaMask) {
    return true;
  }

  // Allow mobile fallback for Android/iPhone
  if (isMobile) {
    return true;
  }

  return false;
};

// MetaMask deep link for mobile devices
const METAMASK_DEEP_LINK = "https://metamask.app.link/dapp/zippy-sunburst-d18a5b.netlify.app";

export const connectWallet = async () => {
  // If on mobile and MetaMask not detected, redirect to MetaMask browser
  if (isMobile && !window.ethereum) {
    console.log("Mobile device detected without MetaMask injection, redirecting to MetaMask browser...");
    window.location.href = METAMASK_DEEP_LINK;
    return null; // Will not reach here due to redirect
  }

  // For desktop or when ethereum is available on mobile
  if (!window.ethereum) {
    console.error("MetaMask not detected");
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    const address = await signer.getAddress();

    console.log("Wallet connected successfully:", address);

    return { provider, signer, contract, address };
  } catch (error) {
    console.error("Wallet connection failed:", error);
    return null;
  }
};