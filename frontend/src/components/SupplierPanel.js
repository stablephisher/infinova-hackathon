/**
 * Supplier Panel Component
 * Create, tokenize, and manage invoices with premium UX
 */

import React, { useState, useEffect } from 'react';

function SupplierPanel({ userAddress }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    buyer_address: '',
    amount: '',
    due_date: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userAddress) {
      loadInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.buyer_address || !formData.amount || !formData.due_date) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.buyer_address.startsWith('A') || formData.buyer_address.length !== 58) {
      setError('Invalid Algorand address format (must start with A, 58 chars)');
      return;
    }

    if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      setError('Invalid amount — must be a positive number');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_address: userAddress,
          buyer_address: formData.buyer_address,
          amount: parseInt(parseFloat(formData.amount) * 1_000_000),
          due_date: formData.due_date,
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to create invoice');

      const data = await response.json();
      setSuccess(`Invoice created successfully! ID: ${data.invoice_id?.substring(0, 12)}...`);
      setFormData({ buyer_address: '', amount: '', due_date: '', description: '' });
      setShowForm(false);
      setTimeout(() => loadInvoices(), 1000);
    } catch (err) {
      setError(err.message || 'Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceRequest = async (invoiceId) => {
    setSuccess(`Financing request sent for invoice ${invoiceId.substring(0, 12)}...`);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending': return { badge: 'badge-warning', icon: '⏳', label: 'Pending' };
      case 'financed': return { badge: 'badge-info', icon: '💰', label: 'Financed' };
      case 'settled': return { badge: 'badge-success', icon: '✓', label: 'Settled' };
      default: return { badge: 'badge-info', icon: '•', label: status };
    }
  };

  // Stats
  const totalInvoices = invoices.length;
  const pendingCount = invoices.filter(i => i.status === 'pending').length;
  const totalVolume = invoices.reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-1">Supplier Dashboard</h2>
          <p className="text-gray-500 text-sm">Create and manage your tokenized invoices</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-lg">+</span> New Invoice
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Invoices', value: totalInvoices, icon: '📄', color: 'blue' },
          { label: 'Pending', value: pendingCount, icon: '⏳', color: 'amber' },
          { label: 'Total Volume', value: `${(totalVolume / 1_000_000).toFixed(1)} ALGO`, icon: '💎', color: 'cyan' },
        ].map((stat) => (
          <div key={stat.label} className="glass p-4 rounded-2xl text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
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

      {/* Create Invoice Form */}
      {showForm && (
        <div className="glass-strong p-6 rounded-2xl animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Create New Invoice</h3>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Buyer Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="buyer_address"
                placeholder="AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={formData.buyer_address}
                onChange={handleInputChange}
                className="input font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-600 mt-1">58-character Algorand address starting with A</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (ALGO) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  placeholder="100.000"
                  step="0.001"
                  min="0.001"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Due Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleInputChange}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                placeholder="Enter invoice details (optional)"
                value={formData.description}
                onChange={handleInputChange}
                className="input min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Creating...
                  </span>
                ) : 'Create Invoice'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary py-3 px-6"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Invoices List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Your Invoices</h3>
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
            <div className="text-5xl mb-4 opacity-30">📄</div>
            <p className="text-gray-400 font-medium mb-1">No invoices yet</p>
            <p className="text-sm text-gray-600">Create your first invoice to get started</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {invoices.map((invoice) => {
              const statusConfig = getStatusConfig(invoice.status);
              return (
                <div
                  key={invoice.id}
                  className="glass p-5 rounded-2xl hover:bg-white/[0.06] transition-all duration-300 animate-fade-in"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={statusConfig.badge}>
                          {statusConfig.icon} {statusConfig.label}
                        </span>
                        <span className="text-xs text-gray-600 font-mono truncate">
                          {invoice.id?.substring(0, 16)}...
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Amount</p>
                          <p className="text-blue-400 font-semibold">
                            {(invoice.amount / 1_000_000).toFixed(3)} ALGO
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Buyer</p>
                          <p className="text-gray-300 font-mono text-xs truncate">
                            {invoice.buyer_address?.slice(0, 8)}...
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Due Date</p>
                          <p className="text-gray-300 text-xs">
                            {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs mb-0.5">Days Left</p>
                          <p className="text-amber-400 text-xs font-medium">
                            {Math.max(0, Math.ceil((new Date(invoice.due_date) - new Date()) / (1000 * 60 * 60 * 24)))} days
                          </p>
                        </div>
                      </div>
                    </div>

                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => handleFinanceRequest(invoice.id)}
                        className="btn-primary text-sm whitespace-nowrap"
                      >
                        Request Finance
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SupplierPanel;