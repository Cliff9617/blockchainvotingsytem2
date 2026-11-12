import React from 'react';
import { isMetaMaskInstalled } from '../utils/connectWallet';

// Mobile detection
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

const WalletConnect = ({ 
  account, 
  isConnected, 
  isLoading, 
  networkError, 
  connectWallet, 
  disconnectWallet 
}) => {
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleConnect = async () => {
    if (isLoading) return;
    await connectWallet();
  };

  const handleDisconnect = async () => {
    if (isLoading) return;
    await disconnectWallet();
  };

  // Determine if we should show MetaMask installation warning
  // On mobile, we don't show the warning as we'll redirect to MetaMask app
  const showMetaMaskWarning = !isMobile && !isMetaMaskInstalled() && !isConnected;
  
  // On mobile without ethereum, clicking connect will redirect to MetaMask browser
  const isMobileWithoutEthereum = isMobile && !window.ethereum && !isConnected;

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">🦊</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Wallet Connection</h2>
            <p className="text-gray-600">
              Connect your MetaMask wallet to participate in the election
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          {networkError && (
            <div className="px-4 py-2 bg-red-50 text-red-800 text-sm rounded-lg border border-red-200 max-w-xs text-center">
              <span className="font-medium">⚠️ {networkError}</span>
            </div>
          )}
          
          {isConnected ? (
            <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-green-900 text-lg">Connected</p>
                    <p className="text-green-700 font-mono text-sm">{formatAddress(account)}</p>
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading || (!isMobileWithoutEthereum && showMetaMaskWarning)}
              className="px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 text-lg shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🦊</span>
                  <span>Connect MetaMask</span>
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MetaMask not installed warning */}
      {showMetaMaskWarning && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-600 text-xl">⚠️</span>
            <div>
              <h4 className="font-medium text-yellow-800">MetaMask Not Detected</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Please install MetaMask browser extension to use this application.
              </p>
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-yellow-800 underline hover:text-yellow-900 mt-2 inline-block"
              >
                Download MetaMask →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && !showMetaMaskWarning && !isMobileWithoutEthereum && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">How to connect:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Make sure MetaMask is installed and unlocked</li>
            <li>2. Click "Connect MetaMask" button above</li>
            <li>3. Approve the connection request in MetaMask</li>
            <li>4. Switch to Sepolia Testnet if prompted</li>
          </ol>
        </div>
      )}

      {/* Mobile instructions */}
      {isMobileWithoutEthereum && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">📱 Mobile Users:</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Make sure you have MetaMask app installed</li>
            <li>2. Click "Connect MetaMask" button below</li>
            <li>3. You'll be redirected to MetaMask browser</li>
            <li>4. Approve the connection and switch to Sepolia Testnet</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
