/**
 * Analytics Component
 * Platform statistics, ROI tracking, and transaction logs with premium UI
 */

import React, { useState, useEffect, useRef } from 'react';

// Animated counter hook
function useAnimatedNumber(target, duration = 1000) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === undefined || target === null) return;
    
    const start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + (target - start) * eased);

      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return value;
}

function AnimatedStat({ value, suffix = '', decimals = 0, label, icon, color = 'blue', subtext }) {
  const animated = useAnimatedNumber(value, 1200);
  const colorMap = {
    blue: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
    green: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20',
    purple: 'from-purple-500/10 to-pink-500/10 border-purple-500/20',
    amber: 'from-amber-500/10 to-orange-500/10 border-amber-500/20',
  };
  const textColorMap = {
    blue: 'gradient-text',
    green: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
  };

  return (
    <div className={`relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${colorMap[color]} border backdrop-blur-sm`}>
      <div className="absolute top-3 right-3 text-2xl opacity-20">{icon}</div>
      <p className="text-gray-500 text-xs font-medium mb-2 uppercase tracking-wider">{label}</p>
      <h3 className={`text-2xl lg:text-3xl font-bold ${textColorMap[color]} mb-1`}>
        {animated.toFixed(decimals)}{suffix}
      </h3>
      {subtext && <p className="text-xs text-gray-600">{subtext}</p>}
    </div>
  );
}

function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const analyticsResponse = await fetch('http://localhost:3001/api/analytics');
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);

      const transactionsResponse = await fetch('http://localhost:3001/api/transactions?limit=20');
      const transactionsData = await transactionsResponse.json();
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeConfig = (type) => {
    switch (type) {
      case 'INVOICE_CREATED': return { icon: '📄', color: 'blue', label: 'Created' };
      case 'INVOICE_FINANCED': return { icon: '💰', color: 'emerald', label: 'Financed' };
      case 'RISK_SCORE': return { icon: '🔍', color: 'purple', label: 'Risk Score' };
      case 'POOL_DEPOSIT': return { icon: '💎', color: 'cyan', label: 'Deposit' };
      default: return { icon: '•', color: 'gray', label: type };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-1">Platform Analytics</h2>
          <p className="text-gray-500 text-sm">Monitor performance, volume, and ROI metrics</p>
        </div>
        <button onClick={loadAnalytics} disabled={loading} className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1.5">
          {loading ? (
            <span className="w-3 h-3 border border-gray-500 border-t-gray-300 rounded-full animate-spin"></span>
          ) : '↻'} Refresh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="p-16 text-center glass rounded-2xl">
          <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading analytics...</p>
        </div>
      ) : !analytics ? (
        <div className="p-16 text-center glass rounded-2xl">
          <div className="text-5xl mb-4 opacity-30">📊</div>
          <p className="text-gray-400 font-medium mb-1">Unable to load analytics</p>
          <p className="text-sm text-gray-600">Check if the backend server is running</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            <AnimatedStat
              label="Total Invoices"
              value={analytics.invoices.total}
              icon="📄"
              color="blue"
              subtext={`${analytics.invoices.pending} pending`}
            />
            <AnimatedStat
              label="Total Volume"
              value={analytics.volume.total / 1_000_000}
              suffix=" ALGO"
              decimals={2}
              icon="💎"
              color="green"
              subtext={`${(analytics.volume.financed / 1_000_000).toFixed(2)} financed`}
            />
            <AnimatedStat
              label="Liquidity Pool"
              value={analytics.pool.total_deposited / 1_000_000}
              suffix=" ALGO"
              decimals={2}
              icon="🏊"
              color="purple"
              subtext={`${analytics.pool.investor_count} investors`}
            />
            <AnimatedStat
              label="Avg Interest"
              value={analytics.roi.average_interest_rate * 100}
              suffix="%"
              decimals={2}
              icon="📈"
              color="amber"
              subtext="Annual yield"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-5">Invoice Status</h3>
              <div className="space-y-4">
                {[
                  { label: 'Pending', value: analytics.invoices.pending, color: 'bg-amber-500', textColor: 'text-amber-400' },
                  { label: 'Financed', value: analytics.invoices.financed, color: 'bg-blue-500', textColor: 'text-blue-400' },
                  { label: 'Settled', value: analytics.invoices.settled, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                ].map((item) => {
                  const pct = analytics.invoices.total > 0 ? (item.value / analytics.invoices.total) * 100 : 0;
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-gray-400">{item.label}</span>
                        <span className={`text-sm font-bold ${item.textColor}`}>{item.value}</span>
                      </div>
                      <div className="w-full bg-gray-800/60 rounded-full h-2 overflow-hidden">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Volume Distribution */}
            <div className="glass p-6 rounded-2xl">
              <h3 className="text-base font-bold text-white mb-5">Volume Breakdown</h3>
              <div className="space-y-4">
                {[
                  {
                    label: 'Available',
                    value: (analytics.volume.total - analytics.volume.financed) / 1_000_000,
                    pct: analytics.volume.total > 0 ? ((analytics.volume.total - analytics.volume.financed) / analytics.volume.total) * 100 : 0,
                    color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
                    textColor: 'text-blue-400',
                  },
                  {
                    label: 'Financed',
                    value: analytics.volume.financed / 1_000_000,
                    pct: analytics.volume.total > 0 ? (analytics.volume.financed / analytics.volume.total) * 100 : 0,
                    color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
                    textColor: 'text-emerald-400',
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm text-gray-400">{item.label}</span>
                      <span className={`text-sm font-bold ${item.textColor}`}>{item.value.toFixed(2)} ALGO</span>
                    </div>
                    <div className="w-full bg-gray-800/60 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${item.color} h-2 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${item.pct}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Performance Metrics inline */}
              <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Funded Ratio</p>
                  <p className="text-lg font-bold gradient-text">
                    {analytics.invoices.total > 0
                      ? ((analytics.invoices.financed / analytics.invoices.total) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Settlement</p>
                  <p className="text-lg font-bold text-emerald-400">
                    {analytics.invoices.financed > 0
                      ? ((analytics.invoices.settled / analytics.invoices.financed) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Avg Invoice</p>
                  <p className="text-lg font-bold text-blue-400">
                    {analytics.invoices.total > 0
                      ? (analytics.volume.total / analytics.invoices.total / 1_000_000).toFixed(2)
                      : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass p-6 rounded-2xl">
            <h3 className="text-base font-bold text-white mb-5">Recent Transactions</h3>

            {transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                <div className="text-4xl mb-3 opacity-20">📋</div>
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((txn, idx) => {
                  const config = getTypeConfig(txn.type);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="w-9 h-9 flex items-center justify-center bg-gray-800/60 rounded-xl text-base flex-shrink-0">
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`badge badge-info text-[10px] px-2 py-0.5`}>
                          {config.label}
                        </span>
                        <p className="text-sm text-gray-300 truncate mt-1">
                          {txn.type === 'INVOICE_CREATED'
                            ? `Invoice: ${txn.data.id?.substring(0, 16)}...`
                            : txn.type === 'INVOICE_FINANCED'
                            ? `Amount: ${(txn.data.amount / 1_000_000).toFixed(3)} ALGO`
                            : txn.type === 'RISK_SCORE'
                            ? `Risk: ${txn.data.risk_level}`
                            : JSON.stringify(txn.data).substring(0, 40)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 flex-shrink-0">
                        {new Date(txn.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;