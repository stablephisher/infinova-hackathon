/**
 * Production-Ready Invoice Financing dApp Frontend
 * React + Tailwind CSS with premium fintech UI/UX
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import SupplierPanel from './components/SupplierPanel';
import InvestorPanel from './components/InvestorPanel';
import Analytics from './components/Analytics';
import WalletConnect from './components/WalletConnect';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('supplier');
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Check persisted wallet state
  useEffect(() => {
    const connected = localStorage.getItem('walletConnected');
    const address = localStorage.getItem('userAddress');
    if (connected && address) {
      setWalletConnected(true);
      setUserAddress(address);
    }
  }, []);

  // Firebase auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleWalletConnect = useCallback((address) => {
    setUserAddress(address);
    setWalletConnected(true);
    setShowWalletModal(false);
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('userAddress', address);
  }, []);

  const handleWalletDisconnect = useCallback(() => {
    setWalletConnected(false);
    setUserAddress('');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('userAddress');
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Firebase login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOutUser();
      handleWalletDisconnect();
    } catch (error) {
      console.error('Firebase logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'supplier', label: 'Supplier', icon: '📄', desc: 'Create & Tokenize' },
    { id: 'investor', label: 'Investor', icon: '💰', desc: 'Fund & Earn' },
    { id: 'analytics', label: 'Analytics', icon: '📊', desc: 'Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white overflow-x-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[15%] w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] bg-purple-500/8 rounded-full blur-[120px] animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-gray-950/70 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 text-lg">
                ⚡
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text leading-tight">InvoiceFlow</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-dot"></div>
                  <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">TestNet</span>
                </div>
              </div>
            </div>

            {/* Center: User info */}
            {!authLoading && firebaseUser && (
              <div className="hidden md:flex items-center gap-2 px-4 py-2 glass rounded-xl">
                {firebaseUser.photoURL && (
                  <img src={firebaseUser.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="text-sm text-gray-300 truncate max-w-[150px]">
                  {firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'}
                </span>
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!authLoading && !firebaseUser && (
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="btn-primary text-sm"
                >
                  {loading ? '...' : '🔐 Login'}
                </button>
              )}

              {firebaseUser && !walletConnected && (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 rounded-xl text-sm text-amber-300 font-medium hover:border-amber-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  🔗 Connect Wallet
                </button>
              )}

              {walletConnected && firebaseUser && (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot"></div>
                    <span className="text-xs text-emerald-300 font-mono">
                      {userAddress.slice(0, 4)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowWalletModal(true)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Wallet settings"
                  >
                    ⚙️
                  </button>
                </div>
              )}

              {firebaseUser && (
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="btn-ghost text-sm px-3 py-2"
                >
                  {loading ? '...' : 'Logout'}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          {firebaseUser && (
            <nav className="mt-4 flex gap-1 overflow-x-auto pb-px -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-5 py-3 font-medium text-sm transition-all duration-300 whitespace-nowrap rounded-t-xl ${
                    activeTab === tab.id
                      ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/3 border-b-2 border-transparent'
                  }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* ===== Wallet Connection Modal ===== */}
      {showWalletModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWalletModal(false)}></div>
          <div className="relative w-full max-w-md glass-strong rounded-3xl p-6 animate-scale-in shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">
                {walletConnected ? '🔗 Wallet' : '⛓️ Connect Wallet'}
              </h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <WalletConnect 
              onConnect={handleWalletConnect} 
              onDisconnect={handleWalletDisconnect} 
            />
          </div>
        </div>
      )}

      {/* ===== Main Content ===== */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 min-h-[70vh]">
        {/* Login Required */}
        {!firebaseUser && !authLoading && (
          <div className="py-16 text-center animate-fade-in">
            <div className="space-y-8 max-w-2xl mx-auto">
              {/* Hero */}
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-cyan-400 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30 animate-float">
                  ⚡
                </div>
                <h2 className="text-5xl font-extrabold gradient-text leading-tight">
                  InvoiceFlow
                </h2>
                <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                  Tokenized Invoice Financing on the Algorand Blockchain. Turn your invoices into liquid assets.
                </p>
              </div>

              {/* Login Card */}
              <div className="glass-strong p-8 rounded-3xl max-w-sm mx-auto animate-slide-up">
                <h3 className="text-xl font-bold text-white mb-2">Get Started</h3>
                <p className="text-sm text-gray-400 mb-6">Sign in to access the platform</p>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full btn-primary py-4 text-lg"
                >
                  {loading ? '🔄 Connecting...' : '✦ Login with Google'}
                </button>
                <p className="text-xs text-gray-500 mt-4">Secured with Firebase Authentication</p>
              </div>

              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
                {[
                  { icon: '🏦', title: 'Suppliers', desc: 'Tokenize invoices as ASAs on-chain', color: 'blue' },
                  { icon: '💎', title: 'Investors', desc: 'Fund invoices and earn returns', color: 'purple' },
                  { icon: '⚡', title: 'Algorand', desc: 'Fast, secure, carbon-negative', color: 'cyan' },
                ].map((f) => (
                  <div key={f.title} className={`p-5 bg-${f.color}-500/5 border border-${f.color}-500/20 rounded-2xl animate-fade-in hover:border-${f.color}-500/40 transition-all duration-300`}>
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h4 className="font-semibold text-white mb-1">{f.title}</h4>
                    <p className="text-sm text-gray-400">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wallet Not Connected Banner */}
        {firebaseUser && !walletConnected && (
          <div className="mb-8 animate-fade-in">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-full group p-6 bg-gradient-to-r from-amber-500/8 to-orange-500/8 border border-amber-500/20 rounded-2xl hover:border-amber-500/40 transition-all duration-500 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  ⛓️
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-amber-300 mb-0.5">Connect Your Wallet</h3>
                  <p className="text-sm text-gray-400">Link your Pera Wallet to start trading tokenized invoices</p>
                </div>
                <svg className="w-5 h-5 text-amber-400/50 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Connected Status */}
        {firebaseUser && walletConnected && (
          <div className="mb-6 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-fade-in">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-dot shadow-lg shadow-emerald-500/40"></div>
            <div className="flex-1">
              <span className="text-sm font-medium text-emerald-300">Ready to trade</span>
              <span className="text-xs text-gray-500 ml-3 font-mono">{userAddress.slice(0, 8)}...{userAddress.slice(-6)}</span>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {firebaseUser && (
          <div className={`transition-all duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <div key={activeTab} className="animate-fade-in">
              {activeTab === 'supplier' && <SupplierPanel userAddress={userAddress} />}
              {activeTab === 'investor' && <InvestorPanel userAddress={userAddress} />}
              {activeTab === 'analytics' && <Analytics />}
            </div>
          </div>
        )}
      </main>

      {/* ===== Footer ===== */}
      <footer className="border-t border-white/5 bg-gray-950/80 backdrop-blur-xl mt-16">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-sm">⚡</div>
                <h3 className="font-bold text-white">InvoiceFlow</h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Tokenized invoice financing on Algorand blockchain.
              </p>
            </div>
            {[
              { title: 'Product', items: ['Documentation', 'API Reference', 'Smart Contracts'] },
              { title: 'Support', items: ['Help Center', 'Report Issue', 'Feedback'] },
              { title: 'Community', items: ['Discord', 'GitHub', 'Twitter'] },
            ].map((section) => (
              <div key={section.title}>
                <h3 className="font-semibold text-gray-300 mb-3 text-sm">{section.title}</h3>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li key={item}>
                      <button className="text-sm text-gray-500 hover:text-blue-400 transition-colors">{item}</button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-600">&copy; 2026 InvoiceFlow. Built on Algorand.</p>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot"></div>
              All systems operational — TestNet
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
