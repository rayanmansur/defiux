// shared-state.js — global mock state + event bus (v2)
(function () {

  const PRICES = {
    USDC: 1, USDT: 1,
    SOL: 165, ETH: 3200, BTC: 65000,
    ARB: 0.8, OP: 1.1, MATIC: 0.5,
    BONK: 0.000018, WIF: 1.8, JTO: 2.4,
    UNI: 7.2, LINK: 13.5,
    BRETT: 0.12, QUICK: 0.05,
  };

  // Gas token per chain
  const GAS_TOKENS = {
    solana:   'SOL',
    arbitrum: 'ETH',
    ethereum: 'ETH',
    base:     'ETH',
    optimism: 'ETH',
    polygon:  'MATIC',
  };

  // Default tx confirmation speeds (seconds) per chain
  const DEFAULT_SPEEDS = {
    solana:   4,
    arbitrum: 6,
    ethereum: 14,
    base:     5,
    optimism: 4,
    polygon:  7,
  };

  function fresh() {
    return {
      balances: {
        solana:   { USDC: 15, SOL: 0, BONK: 0, WIF: 0, JTO: 0 },
        arbitrum: { USDC: 0, ETH: 0, ARB: 0 },
        ethereum: { USDC: 0, ETH: 0, UNI: 0, LINK: 0 },
        base:     { USDC: 0, ETH: 0, BRETT: 0 },
        optimism: { USDC: 0, ETH: 0, OP: 0 },
        polygon:  { USDC: 0, MATIC: 0, QUICK: 0 },
      },
      chainSpeeds: { ...DEFAULT_SPEEDS },
      coinbaseBalance: 0,   // USD cash held on Coinbase
      coinbaseHoldings: { SOL: 0, ETH: 0 }, // crypto bought on Coinbase not yet sent
      hyperliquidBalance: 0,
      walletConnected: false,
      pendingRequest: null,
      pendingTx: null,
      txHistory: [],
      prices: PRICES,
      gasTokens: GAS_TOKENS,
    };
  }

  let _state = fresh();
  let _listeners = new Set();

  function snap() {
    return {
      ..._state,
      balances: JSON.parse(JSON.stringify(_state.balances)),
      chainSpeeds: { ..._state.chainSpeeds },
      coinbaseHoldings: { ..._state.coinbaseHoldings },
    };
  }

  function notify() {
    const s = snap();
    _listeners.forEach(fn => fn(s));
  }

  window.AppState = {
    get state() { return snap(); },

    subscribe(fn) {
      _listeners.add(fn);
      return () => _listeners.delete(fn);
    },

    setBalance(chain, token, amount) {
      if (!_state.balances[chain]) return;
      _state.balances[chain][token] = Math.max(0, parseFloat(amount) || 0);
      notify();
    },

    addBalance(chain, token, delta) {
      if (!_state.balances[chain]) return;
      _state.balances[chain][token] = Math.max(0,
        (_state.balances[chain][token] || 0) + delta);
      notify();
    },

    setChainSpeed(chain, secs) {
      _state.chainSpeeds[chain] = Math.max(1, parseInt(secs) || 4);
      notify();
    },

    setCoinbaseBalance(val) {
      _state.coinbaseBalance = Math.max(0, parseFloat(val) || 0);
      notify();
    },

    addCoinbaseBalance(delta) {
      _state.coinbaseBalance = Math.max(0, _state.coinbaseBalance + delta);
      notify();
    },

    addCoinbaseHolding(token, amt) {
      _state.coinbaseHoldings[token] = (_state.coinbaseHoldings[token] || 0) + amt;
      notify();
    },

    sendCoinbaseToWallet(token, amt) {
      const have = _state.coinbaseHoldings[token] || 0;
      const actual = Math.min(have, amt);
      if (actual <= 0) return false;
      _state.coinbaseHoldings[token] -= actual;
      // Map token to its native chain
      const chainMap = { SOL: 'solana', ETH: 'arbitrum' };
      const chain = chainMap[token] || 'solana';
      _state.balances[chain][token] = (_state.balances[chain][token] || 0) + actual;
      notify();
      return true;
    },

    setConnected(val) {
      _state.walletConnected = val;
      notify();
    },

    setHyperliquidBalance(val) {
      _state.hyperliquidBalance = Math.max(0, parseFloat(val) || 0);
      notify();
    },

    requestConnect(dappName) {
      return new Promise((resolve, reject) => {
        _state.pendingRequest = {
          type: 'connect', dappName,
          onApprove: () => { _state.pendingRequest = null; _state.walletConnected = true; notify(); resolve(); },
          onReject:  () => { _state.pendingRequest = null; notify(); reject(new Error('rejected')); },
        };
        notify();
      });
    },

    requestSign(details) {
      return new Promise((resolve, reject) => {
        _state.pendingRequest = {
          type: 'sign', ...details,
          onApprove: () => { _state.pendingRequest = null; notify(); resolve(); },
          onReject:  () => { _state.pendingRequest = null; notify(); reject(new Error('rejected')); },
        };
        notify();
      });
    },

    async runTx(description, chain, onComplete) {
      const secs = _state.chainSpeeds[chain] || 5;
      const ms = secs * 1000;
      const start = Date.now();
      _state.pendingTx = { description, progress: 0 };
      notify();
      await new Promise(resolve => {
        const iv = setInterval(() => {
          const pct = Math.min(100, ((Date.now() - start) / ms) * 100);
          _state.pendingTx = { description, progress: pct };
          notify();
          if (pct >= 100) { clearInterval(iv); resolve(); }
        }, 80);
      });
      await onComplete();
      _state.pendingTx = null;
      notify();
    },

    addHistory(entry) {
      _state.txHistory.unshift({ ...entry, time: new Date().toLocaleTimeString() });
      if (_state.txHistory.length > 30) _state.txHistory.pop();
      notify();
    },

    // ── Presets ──────────────────────────────────────────────
    applyPreset(id) {
      _state = fresh();
      _state.balances.solana.USDC  = 0;
      _state.balances.solana.SOL   = 0;
      _state.balances.arbitrum.USDC= 0;
      _state.balances.arbitrum.ETH = 0;

      if (id === 'sol-usdc-nogas') {
        _state.balances.solana.USDC = 15;
      } else if (id === 'sol-usdc-gas') {
        _state.balances.solana.USDC = 15;
        _state.balances.solana.SOL  = 0.05;
      } else if (id === 'sol-gas-only') {
        _state.balances.solana.SOL  = 0.05;
      } else if (id === 'arb-usdc-nogas') {
        _state.balances.arbitrum.USDC = 15;
      } else if (id === 'arb-usdc-gas') {
        _state.balances.arbitrum.USDC = 15;
        _state.balances.arbitrum.ETH  = 0.002;
      }
      notify();
    },

    reset() {
      _state = fresh();
      notify();
    },
  };
})();
