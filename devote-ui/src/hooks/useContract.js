import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_NETWORK } from "../config";

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// MetaMask deep link for mobile devices
const METAMASK_DEEP_LINK = "https://metamask.app.link/dapp/zippy-sunburst-d18a5b.netlify.app";

const CONNECTION_TIMEOUT_MS = 15000; // 15 seconds timeout

const useContract = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const connectionTimeoutRef = useRef(null);

  const resetConnection = useCallback(() => {
    setAccount(null);
    setContract(null);
    setIsConnected(false);
    // Clear any pending timeout
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  const switchToSepolia = useCallback(async () => {
    console.log(" Attempting to switch to Sepolia network...");
    console.log("Expected chainId:", SEPOLIA_NETWORK.chainId);

    if (!window.ethereum) {
      console.error(" MetaMask not detected");
      throw new Error("MetaMask not detected");
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
      console.log(" Successfully switched to Sepolia network");
    } catch (switchError) {
      console.error(" Failed to switch to Sepolia:", switchError);
      if (switchError.code === 4902) {
        console.log(" Sepolia network not found, adding it...");
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [SEPOLIA_NETWORK],
          });
          console.log(" Successfully added Sepolia network");
        } catch (addError) {
          console.error(" Failed to add Sepolia network:", addError);
          throw new Error("Failed to add Sepolia network to MetaMask");
        }
      } else if (switchError.code === 4001) {
        // User rejected the request
        console.error(" User rejected network switch");
        throw new Error("Network switch rejected. Please switch to Sepolia manually.");
      } else {
        console.error(" Unknown error switching network:", switchError);
        throw new Error("Failed to switch to Sepolia network. Please switch manually.");
      }
    }
  }, []);

  const buildConnection = useCallback(async (selectedAccount) => {
    if (!window.ethereum) {
      throw new Error("MetaMask not detected");
    }

    if (!selectedAccount) {
      throw new Error("No account selected");
    }

    const provider = new ethers.BrowserProvider(window.ethereum, undefined, {
      // Ethers defaults to a 4000ms polling interval - that adds up to 4s of
      // dead wait after every transaction before tx.wait() resolves and events
      // (VoteCast) are delivered. 1000ms keeps confirmation snappy.
      pollingInterval: 1000,
    });
    const signer = await provider.getSigner(selectedAccount);
    const signerAddress = await signer.getAddress();

    console.log("window.ethereum.selectedAddress:", window.ethereum?.selectedAddress);
    console.log("selectedAccount:", selectedAccount);
    console.log("signer.getAddress():", signerAddress);

    const contractInstance = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );

    setAccount(selectedAccount);
    setContract(contractInstance);
    setIsConnected(true);
    setNetworkError("");

    return {
      provider,
      signer,
      contractInstance,
      signerAddress,
    };
  }, []);

  const connectWallet = useCallback(async () => {
    console.log(" Starting wallet connection...");

    // If on mobile and MetaMask not detected, redirect to MetaMask browser
    if (isMobile && !window.ethereum) {
      console.log(" Mobile device detected without MetaMask injection, redirecting to MetaMask browser...");
      window.location.href = METAMASK_DEEP_LINK;
      return; // Will not reach here due to redirect
    }

    if (!window.ethereum) {
      console.error(" MetaMask not detected");
      setNetworkError("MetaMask not detected. Please install MetaMask.");
      return;
    }

    setIsLoading(true);
    setNetworkError("");

    // Set up timeout to prevent infinite loading
    let timeoutId = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        console.error(" Wallet connection timed out after", CONNECTION_TIMEOUT_MS, "ms");
        reject(new Error("Connection timed out. Please unlock MetaMask and try again."));
      }, CONNECTION_TIMEOUT_MS);
    });

    try {
      // Race between the connection and timeout
      await Promise.race([
        (async () => {
          console.log(" Switching to Sepolia network...");
          await switchToSepolia();

          console.log(" Requesting accounts from MetaMask...");
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          console.log(" eth_requestAccounts result:", accounts);

          if (!accounts || accounts.length === 0) {
            throw new Error("No accounts found");
          }

          const selectedAccount = accounts[0];
          console.log(" Building connection for account:", selectedAccount);
          await buildConnection(selectedAccount);

          console.log(" Wallet connection complete");
          console.log(" Connected account stored in state:", selectedAccount);
          console.log(" Contract address:", CONTRACT_ADDRESS);
        })(),
        timeoutPromise
      ]);
    } catch (err) {
      console.error(" Connection error:", err);
      const errorMessage = err?.message || "Failed to connect wallet";
      setNetworkError(errorMessage);
      resetConnection();

      // Show user-friendly alert for specific errors
      if (err.code === 4001) {
        setNetworkError("Connection rejected. Please approve the MetaMask request.");
      } else if (err.message?.includes("timed out")) {
        setNetworkError("Connection timed out. Please unlock MetaMask and try again.");
      }
    } finally {
      // Always clear timeout and reset loading state
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Ensure isLoading is always reset, even if resetConnection was called
      setIsLoading(false);
    }
  }, [buildConnection, resetConnection, switchToSepolia]);

  const disconnectWallet = useCallback(() => {
    resetConnection();
    setNetworkError("");
  }, [resetConnection]);

  const handleAccountsChanged = useCallback(
    async (accounts) => {
      console.log("accountsChanged:", accounts);

      if (!accounts || accounts.length === 0) {
        console.log("No accounts found. Disconnecting.");
        disconnectWallet();
        return;
      }

      try {
        setIsLoading(true);
        setNetworkError("");

        const selectedAccount = accounts[0];
        await buildConnection(selectedAccount);

        console.log("Account changed to:", selectedAccount);
      } catch (err) {
        console.error("Failed to handle account change:", err);
        setNetworkError(err?.message || "Failed to switch account");
        resetConnection();
      } finally {
        setIsLoading(false);
      }
    },
    [buildConnection, disconnectWallet, resetConnection]
  );

  const handleChainChanged = useCallback(
    async (chainId) => {
      console.log("Chain changed to:", chainId);
      console.log("Expected Sepolia chain ID:", SEPOLIA_NETWORK.chainId);

      if (chainId !== SEPOLIA_NETWORK.chainId) {
        setNetworkError("Please switch back to Sepolia Testnet");
        resetConnection();
        return;
      }

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        console.log("eth_accounts after chain change:", accounts);

        if (accounts && accounts.length > 0) {
          await buildConnection(accounts[0]);
        } else {
          resetConnection();
        }

        setNetworkError("");
      } catch (err) {
        console.error("Failed after chain change:", err);
        setNetworkError(err?.message || "Failed to reconnect on Sepolia");
        resetConnection();
      }
    },
    [buildConnection, resetConnection]
  );

  useEffect(() => {
    if (!window.ethereum) return undefined;

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  return {
    account,
    contract,
    isConnected,
    isLoading,
    networkError,
    connectWallet,
    disconnectWallet,
  };
};

export default useContract;