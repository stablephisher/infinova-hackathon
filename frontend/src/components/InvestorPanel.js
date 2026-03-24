/**
 * Investor Panel Component
 * Browse, fund invoices, and earn returns with premium UX
 */

import React, { useState, useEffect } from 'react';

function InvestorPanel({ userAddress }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [poolBalance, setPoolBalance] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [financingData, setFinancingData] = useState({
    amount: '',
    interest_rate: '',
  });

  useEffect(() => {
    if (userAddress) {
      loadInvoices();
      loadPoolBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices');
      const data = await response.json();
      setInvoices(
        (data.invoices || []).filter((inv) => inv.status === 'pending')
      );
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPoolBalance = async () => {
    if (!userAddress) return;
    try {
      const response = await fetch(`http://localhost:3001/api/pool/${userAddress}`);
      const data = await response.json();
      setPoolBalance(data.balance || 0);
    } catch (err) {
      console.error('Error loading pool balance:', err);
    }
  };

  const handleSelectInvoice = async (invoice) => {
    setSelectedInvoice(invoice);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: invoice.supplier_address,
          amount: invoice.amount,
          due_date_days: Math.ceil(
            (new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24)
          ),
          supplier_history_score: 0.7,
          supplier_credit_score: 75,
        }),
      });

      const data = await response.json();
      setRiskScore(data);
      setFinancingData({
        amount: Math.floor(invoice.amount * 0.9),
        interest_rate: (data.interest_rate_percent * 100).toFixed(2),
      });
    } catch (err) {
      setError('Failed to fetch risk score');
      console.error(err);
    }
  };

  const handleFinanceInvoice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!financingData.amount || !financingData.interest_rate) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);

      if (poolBalance < financingData.amount) {
        const depositResponse = await fetch('http://localhost:3001/api/pool/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            investor_address: userAddress,
            amount: financingData.amount,
          }),
        });
        if (!depositResponse.ok) throw new Error('Failed to deposit to pool');
      }

      const financeResponse = await fetch(
        `http://localhost:3001/api/invoices/${selectedInvoice.id}/finance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            financier_address: userAddress,
            interest_rate: parseInt(financingData.interest_rate) / 100,
          }),
        }
      );

      if (!financeResponse.ok) throw new Error('Failed to finance invoice');

      const data = await financeResponse.json();
      setSuccess(
        `Invoice financed! Settlement: ${(data.financing_details.settlement_amount / 1_000_000).toFixed(3)} ALGO`
      );

      setSelectedInvoice(null);
      setRiskScore(null);
      setTimeout(() => {
        loadInvoices();
        loadPoolBalance();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error financing invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/pool/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_address: userAddress,
          amount: parseInt(parseFloat(depositAmount) * 1_000_000),
        }),
      });
      if (!response.ok) throw new Error('Failed to deposit');

      setSuccess(`Deposited ${depositAmount} ALGO to your pool`);
      setShowDepositModal(false);
      setDepositAmount('');
      loadPoolBalance();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'Low': return 'emerald';
      case 'Medium': return 'amber';
      case 'High': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold gradient-text mb-1">Investor Dashboard</h2>
        <p className="text-gray-500 text-sm">Browse invoices, assess risk, and fund for returns</p>
      </div>

      {/* Pool Balance Card */}
      <div className="relative overflow-hidden glass-strong p-6 rounded-2xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-2xl"></div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-gray-500 text-sm mb-1">Liquidity Pool Balance</p>
            <h3 className="text-4xl font-bold gradient-text">
              {(poolBalance / 1_000_000).toFixed(3)} <span className="text-lg text-gray-400">ALGO</span>
            </h3>
          </div>
          <button
            onClick={() => setShowDepositModal(true)}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <span>+</span> Add Funds
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl flex items-start gap-3 animate-scale-in">
          <span className="text-red-400">✕</span>
          <p className="text-sm text-red-300 flex-1">{error}</p>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3 animate-scale-in">
          <span className="text-emerald-400">✓</span>
          <p className="text-sm text-emerald-300 flex-1">{success}</p>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-300">×</button>
        </div>
      )}

      {/* ===== Deposit Modal ===== */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-strong p-6 rounded-3xl max-w-sm w-full animate-scale-in shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Deposit to Pool</h3>
              <button onClick={() => setShowDepositModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleDeposit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (ALGO)</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="input text-lg"
                  placeholder="0.000"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-3 disabled:opacity-50">
                  {loading ? 'Depositing...' : 'Deposit'}
                </button>
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn-secondary py-3 px-6">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== Finance Invoice Modal ===== */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass-strong p-6 rounded-3xl max-w-md w-full animate-scale-in shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-white">Finance Invoice</h3>
              <button
                onClick={() => { setSelectedInvoice(null); setRiskScore(null); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Invoice Info */}
            <div className="space-y-3 bg-gray-800/40 p-4 rounded-xl mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice ID</span>
                <span className="font-mono text-gray-300 text-xs">{selectedInvoice.id?.substring(0, 16)}...</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="text-blue-400 font-bold">{(selectedInvoice.amount / 1_000_000).toFixed(3)} ALGO</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date</span>
                <span className="text-gray-300">{new Date(selectedInvoice.due_date).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Risk Score */}
            {riskScore && (
              <div className={`p-4 rounded-xl mb-5 bg-${getRiskColor(riskScore.risk_level)}-500/10 border border-${getRiskColor(riskScore.risk_level)}-500/25`}>
                <h4 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                  <span>🔍</span> Risk Assessment
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Risk Level</p>
                    <span className={`badge badge-${riskScore.risk_level === 'Low' ? 'success' : riskScore.risk_level === 'Medium' ? 'warning' : 'danger'}`}>
                      {riskScore.risk_level}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Score</p>
                    <p className="text-white font-bold">{(riskScore.risk_score * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Suggested Rate</p>
                    <p className="text-emerald-400 font-bold">{(riskScore.interest_rate_percent * 100).toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Max Funding</p>
                    <p className="text-white font-bold text-sm">
                      {(riskScore.recommended_funding_amount / 1_000_000).toFixed(3)} ALGO
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Financing Form */}
            <form onSubmit={handleFinanceInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Financing Amount (ALGO)</label>
                <input
                  type="number"
                  step="0.001"
                  value={financingData.amount ? (financingData.amount / 1_000_000).toFixed(3) : ''}
                  onChange={(e) =>
                    setFinancingData({
                      ...financingData,
                      amount: parseInt(parseFloat(e.target.value) * 1_000_000),
                    })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="50"
                  value={financingData.interest_rate}
                  onChange={(e) =>
                    setFinancingData({
                      ...financingData,
                      interest_rate: e.target.value,
                    })
                  }
                  className="input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Processing...
                  </span>
                ) : '💰 Finance Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===== Invoices Grid ===== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Available Invoices</h3>
          <button onClick={loadInvoices} disabled={loading} className="btn-ghost text-xs px-3 py-1.5">
            {loading ? '...' : '↻ Refresh'}
          </button>
        </div>

        {loading && invoices.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-sm">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center glass rounded-2xl">
            <div className="text-5xl mb-4 opacity-30">💰</div>
            <p className="text-gray-400 font-medium mb-1">No invoices available</p>
            <p className="text-sm text-gray-600">Check back soon for new financing opportunities</p>
          </div>
        ) : (
          <div className="responsive-grid stagger-children">
            {invoices.map((invoice) => {
              const daysLeft = Math.max(0, Math.ceil((new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24)));
              return (
                <div
                  key={invoice.id}
                  className="card-hover group animate-fade-in"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-gray-600 truncate max-w-[60%]">
                      {invoice.id?.substring(0, 16)}...
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      daysLeft <= 7 ? 'bg-red-500/15 text-red-400' :
                      daysLeft <= 30 ? 'bg-amber-500/15 text-amber-400' :
                      'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {daysLeft}d left
                    </span>
                  </div>

                  <div className="space-y-3 text-sm mb-5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Amount</span>
                      <span className="text-blue-400 font-bold text-lg">
                        {(invoice.amount / 1_000_000).toFixed(3)} <span className="text-xs text-gray-500">ALGO</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due Date</span>
                      <span className="text-gray-300">{new Date(invoice.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectInvoice(invoice)}
                    className="w-full btn-primary text-sm group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all"
                  >
                    View & Finance →
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default InvestorPanel;