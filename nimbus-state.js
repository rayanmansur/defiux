// nimbus-state.js — Nimbus super-app state
(function () {

  const PRICES = {
    USDC: 1, ETH: 3200, SOL: 165, BTC: 65000,
    ARB: 0.8, AAVE: 92, UNI: 7.2,
  };

  function fresh() {
    return {
      // Core balance — user's USD value in Nimbus
      cashBalance: 1000,       // undeployed cash (USD)
      pnl: 12.40,              // total P&L USD
      pnlPct: 1.24,

      // App positions
      hyperliquidBalance: 0,   // USDC on HL
      hyperliquidPositions: [], // { side, size, entry, mark, pnl }

      aaveSupplied: {},        // { USDC: 500, ... }
      aaveBorrowed: {},        // { USDC: 200, ... }

      // Yield
      aaveYieldEarned: 0,

      // Tx history
      txHistory: [],

      prices: PRICES,
      adminVisible: false,

      // Pending mock tx
      pendingTx: null,        // { description, progress }
      txSpeed: 2,             // seconds

      // Demo state
      depositModalApp: null,  // 'hl' | 'aave' | null
    };
  }

  let _state = fresh();
  let _listeners = new Set();

  function snap() {
    return {
      ..._state,
      aaveSupplied: { ..._state.aaveSupplied },
      aaveBorrowed: { ..._state.aaveBorrowed },
      hyperliquidPositions: [..._state.hyperliquidPositions],
      txHistory: [..._state.txHistory],
    };
  }

  function notify() {
    _listeners.forEach(fn => fn(snap()));
  }

  function totalPortfolioUsd(s) {
    const aaveVal = Object.entries(s.aaveSupplied).reduce((sum, [t, a]) => sum + (s.prices[t] || 1) * a, 0);
    return s.cashBalance + s.hyperliquidBalance + aaveVal;
  }

  window.NState = {
    get state() { return snap(); },
    get portfolioUsd() { return totalPortfolioUsd(_state); },

    subscribe(fn) { _listeners.add(fn); return () => _listeners.delete(fn); },

    setAdminVisible(v) { _state.adminVisible = v; notify(); },
    setCashBalance(v)  { _state.cashBalance = Math.max(0, parseFloat(v) || 0); notify(); },
    setHLBalance(v)    { _state.hyperliquidBalance = Math.max(0, parseFloat(v) || 0); notify(); },
    setTxSpeed(v)      { _state.txSpeed = Math.max(1, parseInt(v) || 2); notify(); },
    setPnl(usd, pct)   { _state.pnl = usd; _state.pnlPct = pct; notify(); },

    aaveSupply(token, amount) {
      _state.aaveSupplied[token] = (_state.aaveSupplied[token] || 0) + amount;
      notify();
    },
    aaveWithdraw(token, amount) {
      _state.aaveSupplied[token] = Math.max(0, (_state.aaveSupplied[token] || 0) - amount);
      notify();
    },
    aaveBorrow(token, amount) {
      _state.aaveBorrowed[token] = (_state.aaveBorrowed[token] || 0) + amount;
      _state.cashBalance += amount; // borrowed funds land as cash
      notify();
    },
    aaveRepay(token, amount) {
      _state.aaveBorrowed[token] = Math.max(0, (_state.aaveBorrowed[token] || 0) - amount);
      _state.cashBalance = Math.max(0, _state.cashBalance - amount);
      notify();
    },

    depositToHL(amount) {
      _state.cashBalance = Math.max(0, _state.cashBalance - amount);
      _state.hyperliquidBalance += amount;
      notify();
    },
    withdrawFromHL(amount) {
      _state.hyperliquidBalance = Math.max(0, _state.hyperliquidBalance - amount);
      _state.cashBalance += amount;
      notify();
    },

    addHistory(entry) {
      _state.txHistory.unshift({ ...entry, time: new Date().toLocaleTimeString() });
      if (_state.txHistory.length > 30) _state.txHistory.pop();
      notify();
    },

    async runTx(description, onComplete) {
      const ms = (_state.txSpeed || 2) * 1000;
      const start = Date.now();
      _state.pendingTx = { description, progress: 0 };
      notify();
      await new Promise(resolve => {
        const iv = setInterval(() => {
          const pct = Math.min(100, ((Date.now() - start) / ms) * 100);
          _state.pendingTx = { description, progress: pct };
          notify();
          if (pct >= 100) { clearInterval(iv); resolve(); }
        }, 60);
      });
      await onComplete();
      _state.pendingTx = null;
      notify();
    },

    applyPreset(id) {
      _state = fresh();
      if (id === 'fresh')       { _state.cashBalance = 1000; }
      else if (id === 'active') { _state.cashBalance = 500; _state.hyperliquidBalance = 300; _state.aaveSupplied = { USDC: 200 }; }
      else if (id === 'empty')  { _state.cashBalance = 0; }
      else if (id === 'rich')   { _state.cashBalance = 5000; }
      notify();
    },

    reset() { _state = fresh(); notify(); },
  };
})();
