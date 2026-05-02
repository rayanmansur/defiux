// shared-state-aave.js — extends shared state with Aave positions
(function () {

  const PRICES = {
    USDC: 1, USDT: 1,
    SOL: 165, ETH: 3200, BTC: 65000,
    ARB: 0.8, OP: 1.1, MATIC: 0.5,
    BONK: 0.000018, WIF: 1.8, JTO: 2.4,
    UNI: 7.2, LINK: 13.5,
    BRETT: 0.12, QUICK: 0.05,
    cbBTC: 65000, weETH: 3280, wstETH: 3750,
    EURC: 1.08, GHO: 1.0, cbETH: 3260,
    AAVE: 92, ezETH: 3290,
  };

  const GAS_TOKENS = {
    solana: 'SOL', arbitrum: 'ETH', ethereum: 'ETH',
    base: 'ETH', optimism: 'ETH', polygon: 'MATIC',
  };

  const DEFAULT_SPEEDS = {
    solana: 4, arbitrum: 6, ethereum: 14,
    base: 5, optimism: 4, polygon: 7,
  };

  function totalWalletUsd(balances) {
    return Object.entries(balances).reduce((sum, [, toks]) =>
      sum + Object.entries(toks).reduce((s, [tok, amt]) => s + (PRICES[tok] || 1) * amt, 0), 0);
  }

  function fresh() {
    const state = {
      balances: {
        solana:   { USDC: 15, SOL: 0, BONK: 0, WIF: 0, JTO: 0 },
        arbitrum: { USDC: 0, ETH: 0, ARB: 0 },
        ethereum: { USDC: 0, ETH: 0, UNI: 0, LINK: 0 },
        base:     { USDC: 0, ETH: 0, cbBTC: 0, weETH: 0, wstETH: 0, EURC: 0, cbETH: 0, GHO: 0, AAVE: 0, ezETH: 0, BRETT: 0 },
        optimism: { USDC: 0, ETH: 0, OP: 0 },
        polygon:  { USDC: 0, MATIC: 0, QUICK: 0 },
      },
      chainSpeeds: { ...DEFAULT_SPEEDS },
      coinbaseBalance: 0,
      coinbaseHoldings: { SOL: 0, ETH: 0 },
      hyperliquidBalance: 0,
      // Aave positions on Base
      aaveSupplied: {},   // { USDC: 10, weETH: 0.01, ... }
      aaveBorrowed: {},   // { USDC: 5, ... }
      walletConnected: false,
      pendingRequest: null,
      pendingTx: null,
      txHistory: [],
      prices: PRICES,
      gasTokens: GAS_TOKENS,
    };
    state.sessionStats = {
      fundsIntroducedUsd: totalWalletUsd(state.balances),
      bankAddedUsd: 0,
      fees: [],
    };
    return state;
  }

  let _state = fresh();
  let _listeners = new Set();

  function snap() {
    return {
      ..._state,
      balances: JSON.parse(JSON.stringify(_state.balances)),
      chainSpeeds: { ..._state.chainSpeeds },
      coinbaseHoldings: { ..._state.coinbaseHoldings },
      aaveSupplied: { ..._state.aaveSupplied },
      aaveBorrowed: { ..._state.aaveBorrowed },
      sessionStats: {
        ..._state.sessionStats,
        fees: [...(_state.sessionStats?.fees || [])],
      },
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
      if (delta > 0) {
        _state.sessionStats.bankAddedUsd += delta;
        _state.sessionStats.fundsIntroducedUsd += delta;
      }
      notify();
    },

    addCoinbaseHolding(token, amt) {
      _state.coinbaseHoldings[token] = (_state.coinbaseHoldings[token] || 0) + amt;
      notify();
    },

    sendCoinbaseToWallet(token, amt, receiveAmt) {
      const have = _state.coinbaseHoldings[token] || 0;
      const debit = Math.min(have, amt);
      const receive = Math.max(0, parseFloat(receiveAmt ?? debit) || 0);
      if (debit <= 0 || receive <= 0) return false;
      _state.coinbaseHoldings[token] -= debit;
      const chainMap = { SOL: 'solana', ETH: 'base' };
      const chain = chainMap[token] || 'base';
      _state.balances[chain][token] = (_state.balances[chain][token] || 0) + receive;
      notify();
      return true;
    },

    addFee(kind, label, amountUsd) {
      const amount = Math.max(0, parseFloat(amountUsd) || 0);
      if (amount <= 0) return;
      _state.sessionStats.fees.push({ kind, label, amountUsd: amount });
      notify();
    },

    setConnected(val) {
      _state.walletConnected = val;
      notify();
    },

    setHyperliquidBalance(val) {
      _state.hyperliquidBalance = Math.max(0, parseFloat(val) || 0);
      notify();
    },

    // Aave supply/borrow
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
      notify();
    },
    aaveRepay(token, amount) {
      _state.aaveBorrowed[token] = Math.max(0, (_state.aaveBorrowed[token] || 0) - amount);
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

    applyPreset(id) {
      _state = fresh();
      // reset all to zero first
      Object.keys(_state.balances).forEach(ch => {
        Object.keys(_state.balances[ch]).forEach(tok => { _state.balances[ch][tok] = 0; });
      });

      if (id === 'sol-usdc-nogas') {
        _state.balances.solana.USDC = 15;
      } else if (id === 'sol-usdc-gas') {
        _state.balances.solana.USDC = 15;
        _state.balances.solana.SOL  = 0.05;
      } else if (id === 'sol-gas-only') {
        _state.balances.solana.SOL  = 0.05;
      } else if (id === 'base-usdc-nogas') {
        _state.balances.base.USDC = 15;
      } else if (id === 'base-usdc-gas') {
        _state.balances.base.USDC = 15;
        _state.balances.base.ETH  = 0.002;
      } else if (id === 'arb-usdc-nogas') {
        _state.balances.arbitrum.USDC = 15;
      } else if (id === 'arb-usdc-gas') {
        _state.balances.arbitrum.USDC = 15;
        _state.balances.arbitrum.ETH  = 0.002;
      } else if (id === 'base-gas-only') {
        _state.balances.base.ETH  = 0.002;
      }
      notify();
    },

    reset() { _state = fresh(); notify(); },
  };
})();
