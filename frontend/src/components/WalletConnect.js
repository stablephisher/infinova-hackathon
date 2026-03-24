/**
 * Wallet Connection Component
 * Handles Pera Wallet connection using the @perawallet/connect SDK
 * with proper session management, reconnection, and premium UX
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

// Singleton Pera Wallet instance
const peraWallet = new PeraWalletConnect({
  chainId: 416002, // Algorand TestNet
});

function WalletConnect({ onConnect, onDisconnect }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const [error, setError] = useState('');
  const [connectedAddress, setConnectedAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const mountedRef = useRef(true);

  // Reconnect existing session on mount
  useEffect(() => {
    mountedRef.current = true;

    const reconnect = async () => {
      try {
        const accounts = await peraWallet.reconnectSession();
        if (accounts.length > 0 && mountedRef.current) {
          setConnectedAddress(accounts[0]);
          setStatus('connected');
          onConnect(accounts[0]);

          peraWallet.connector?.on('disconnect', handleDisconnectEvent);
        }
      } catch (err) {
        console.log('No existing Pera session to reconnect');
      }
    };

    reconnect();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDisconnectEvent = useCallback(() => {
    if (mountedRef.current) {
      setConnectedAddress('');
      setStatus('idle');
      setError('');
      if (onDisconnect) onDisconnect();
    }
  }, [onDisconnect]);

  const connectWallet = async () => {
    setStatus('connecting');
    setError('');

    try {
      const accounts = await peraWallet.connect();

      if (accounts && accounts.length > 0) {
        setConnectedAddress(accounts[0]);
        setStatus('connected');
        onConnect(accounts[0]);

        // Listen for disconnect from wallet side
        peraWallet.connector?.on('disconnect', handleDisconnectEvent);
      }
    } catch (err) {
      console.error('Pera Wallet connection error:', err);

      if (err?.data?.type === 'CONNECT_MODAL_CLOSED' || err?.message?.includes('cancelled')) {
        // User closed the modal — not a real error
        setStatus('idle');
      } else {
        setError(err.message || 'Failed to connect. Make sure Pera Wallet is installed.');
        setStatus('error');
      }
    }
  };

  const disconnectWallet = async () => {
    try {
      await peraWallet.disconnect();
    } catch (err) {
      console.log('Disconnect error:', err);
    }
    setConnectedAddress('');
    setStatus('idle');
    setError('');
    if (onDisconnect) onDisconnect();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(connectedAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const truncateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // === Connected State ===
  if (status === 'connected' && connectedAddress) {
    return (
      <div className="animate-fade-in space-y-4">
        <div className="p-5 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse-dot shadow-lg shadow-emerald-500/50"></div>
            <span className="text-emerald-300 font-semibold text-sm tracking-wide">WALLET CONNECTED</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-2.5 bg-gray-900/60 rounded-xl border border-gray-700/50 font-mono text-sm text-gray-200 truncate">
              {truncateAddress(connectedAddress)}
            </div>
            <button
              onClick={copyAddress}
              className="px-3 py-2.5 bg-gray-800/60 hover:bg-gray-700/60 border border-gray-600/50 rounded-xl text-sm transition-all duration-300 hover:scale-105 active:scale-95"
              title="Copy full address"
            >
              {copied ? '✓' : '📋'}
            </button>
            <button
              onClick={disconnectWallet}
              className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-sm text-red-400 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Disconnect
            </button>
          </div>
        </div>

        {/* Network indicator */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
          <span>Algorand TestNet</span>
        </div>
      </div>
    );
  }

  // === Idle / Connecting / Error State ===
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Error Alert */}
      {(status === 'error' || error) && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 text-sm flex items-start gap-3 animate-scale-in">
          <span className="text-lg mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-medium mb-1">Connection Failed</p>
            <p className="text-red-400/80 text-xs">{error}</p>
          </div>
          <button onClick={() => { setError(''); setStatus('idle'); }} className="text-red-400 hover:text-red-300 text-lg">×</button>
        </div>
      )}

      {/* Main Connect Button */}
      <button
        onClick={connectWallet}
        disabled={status === 'connecting'}
        className="group w-full relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 animate-gradient opacity-90 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div className="relative px-6 py-5 flex items-center justify-center gap-4">
          {status === 'connecting' ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span className="text-white font-bold text-lg">Connecting to Pera Wallet...</span>
            </>
          ) : (
            <>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300">
                🔗
              </div>
              <div className="text-left">
                <span className="text-white font-bold text-lg block">Connect Pera Wallet</span>
                <span className="text-white/60 text-xs">Scan QR code or open in mobile</span>
              </div>
              <svg className="w-5 h-5 text-white/60 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </div>
      </button>

      {/* Info Card */}
      <div className="p-5 glass rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
          <span>💡</span>
          <span>How to connect</span>
        </div>
        <ol className="space-y-2 text-sm text-gray-400">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Install <button onClick={() => window.open('https://perawallet.app', '_blank')} className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Pera Wallet</button> on your phone</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Click "Connect" and scan the QR code</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>Approve the connection in your wallet</span>
          </li>
        </ol>
        
        {/* Network badge */}
        <div className="pt-2 border-t border-gray-700/50 flex items-center gap-2 text-xs text-gray-500">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
          <span>Connecting to Algorand TestNet</span>
        </div>
      </div>
    </div>
  );
}

export default WalletConnect;
