// WalletPanel.jsx v2 — 6 chains, meme tokens, full swap flow
const { useState, useEffect } = React;

const W = {
  bg: '#1c1c24', card: '#252532', card2: '#2e2e3e',
  border: '#33334a', purple: '#ab9ff2', purpleDim: '#7b6fbf',
  text: '#ffffff', muted: '#8b8ba0', green: '#52e39e', red: '#f05252',
};

const CHAIN_META = {
  solana:   { name: 'Solana',   color: '#9945FF', gasToken: 'SOL',  short: 'S' },
  arbitrum: { name: 'Arbitrum', color: '#12AAFF', gasToken: 'ETH',  short: 'A' },
  ethereum: { name: 'Ethereum', color: '#627EEA', gasToken: 'ETH',  short: 'E' },
  base:     { name: 'Base',     color: '#0052FF', gasToken: 'ETH',  short: 'B' },
  optimism: { name: 'Optimism', color: '#FF0420', gasToken: 'ETH',  short: 'O' },
  polygon:  { name: 'Polygon',  color: '#8247E5', gasToken: 'MATIC',short: 'P' },
};

const TOKEN_META = {
  USDC:  { name: 'USD Coin',   color: '#2775CA', letter: 'U' },
  USDT:  { name: 'Tether',     color: '#26A17B', letter: 'T' },
  SOL:   { name: 'Solana',     color: '#9945FF', letter: 'S' },
  ETH:   { name: 'Ethereum',   color: '#627EEA', letter: 'E' },
  ARB:   { name: 'Arbitrum',   color: '#12AAFF', letter: 'A' },
  OP:    { name: 'Optimism',   color: '#FF0420', letter: 'O' },
  MATIC: { name: 'Polygon',    color: '#8247E5', letter: 'M' },
  BTC:   { name: 'Bitcoin',    color: '#F7931A', letter: '₿' },
  UNI:   { name: 'Uniswap',    color: '#FF007A', letter: 'U' },
  LINK:  { name: 'Chainlink',  color: '#2A5ADA', letter: 'L' },
  BONK:  { name: 'Bonk',       color: '#E07A35', letter: 'B' },
  WIF:   { name: 'dogwifhat',  color: '#C27B40', letter: 'W' },
  JTO:   { name: 'Jito',       color: '#6CB140', letter: 'J' },
  BRETT: { name: 'Brett',      color: '#4A90D9', letter: 'B' },
  QUICK: { name: 'QuickSwap',  color: '#5BB8F5', letter: 'Q' },
};

// All swappable assets across all chains
const SWAP_ASSETS = [
  { chain: 'solana',   token: 'USDC'  },
  { chain: 'solana',   token: 'SOL'   },
  { chain: 'solana',   token: 'BONK'  },
  { chain: 'solana',   token: 'WIF'   },
  { chain: 'solana',   token: 'JTO'   },
  { chain: 'arbitrum', token: 'USDC'  },
  { chain: 'arbitrum', token: 'ETH'   },
  { chain: 'arbitrum', token: 'ARB'   },
  { chain: 'ethereum', token: 'USDC'  },
  { chain: 'ethereum', token: 'ETH'   },
  { chain: 'ethereum', token: 'UNI'   },
  { chain: 'ethereum', token: 'LINK'  },
  { chain: 'base',     token: 'USDC'  },
  { chain: 'base',     token: 'ETH'   },
  { chain: 'base',     token: 'BRETT' },
  { chain: 'optimism', token: 'USDC'  },
  { chain: 'optimism', token: 'ETH'   },
  { chain: 'optimism', token: 'OP'    },
  { chain: 'polygon',  token: 'USDC'  },
  { chain: 'polygon',  token: 'MATIC' },
  { chain: 'polygon',  token: 'QUICK' },
];

// Tokens visible in wallet per chain (includes 0-balance decorative ones)
const CHAIN_TOKENS = {
  solana:   ['USDC', 'SOL', 'BONK', 'WIF', 'JTO'],
  arbitrum: ['USDC', 'ETH', 'ARB'],
  ethereum: ['USDC', 'ETH', 'UNI', 'LINK'],
  base:     ['USDC', 'ETH', 'BRETT'],
  optimism: ['USDC', 'ETH', 'OP'],
  polygon:  ['USDC', 'MATIC', 'QUICK'],
};

function fmt(n, dec = 4) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  if (x < 0.0001) return '<0.0001';
  return x.toFixed(dec).replace(/\.?0+$/, '');
}
function fmtUsd(n) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '$0.00';
  if (x < 0.01) return '<$0.01';
  return '$' + x.toFixed(2);
}
function getbal(balances, chain, token) {
  return (balances[chain] && balances[chain][token]) || 0;
}
function usdVal(prices, token, amt) {
  return (prices[token] || 1) * amt;
}
function calcReceive(prices, fromToken, toToken, amt) {
  const slip = ['BONK','WIF','JTO','BRETT','QUICK'].includes(toToken) ? 0.03 : 0.01;
  return (amt * (prices[fromToken] || 1) * (1 - slip)) / (prices[toToken] || 1);
}
function getFee(toToken) {
  return ['BONK','WIF','JTO','BRETT','QUICK'].includes(toToken) ? 3 : 1;
}

// ── Small components ──────────────────────────────────────────
function TokIcon({ symbol, chain, size = 32 }) {
  const m = TOKEN_META[symbol] || { color: '#555', letter: symbol?.[0] || '?' };
  const ch = chain ? CHAIN_META[chain] : null;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: m.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.38, color: '#fff', fontWeight: 800,
      }}>{m.letter}</div>
      {ch && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: size * 0.38, height: size * 0.38, borderRadius: '50%',
          background: ch.color, border: '1.5px solid ' + W.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.18, color: '#fff', fontWeight: 800,
        }}>{ch.short}</div>
      )}
    </div>
  );
}

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="6.5" fill={W.purple} />
      <polyline points="3.5,6.5 5.5,8.5 9.5,4.5" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function BottomNav({ screen, onNav }) {
  return (
    <div style={{ display: 'flex', borderTop: '1px solid ' + W.border, background: W.bg, flexShrink: 0 }}>
      {[['home','⌂'],['swap','⇄'],['history','◷'],['search','⌕']].map(([id, icon]) => (
        <button key={id} onClick={() => onNav(id)} style={{
          flex: 1, padding: '13px 0', background: 'none', border: 'none', cursor: 'pointer',
          color: screen === id ? W.purple : W.muted, fontSize: 18,
        }}>{icon}</button>
      ))}
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────
function HomeScreen({ state }) {
  const [activeChain, setActiveChain] = useState('solana');
  const prices = state.prices;
  const bals = state.balances[activeChain] || {};
  const tokens = CHAIN_TOKENS[activeChain] || [];

  const totalUsd = Object.entries(state.balances).reduce((sum, [, toks]) =>
    sum + Object.entries(toks).reduce((s, [tok, amt]) => s + usdVal(prices, tok, amt), 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Balance + actions */}
      <div style={{ padding: '0 16px 14px', flexShrink: 0 }}>
        <div style={{ textAlign: 'center', padding: '10px 0 14px' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: W.text }}>{fmtUsd(totalUsd)}</div>
          <div style={{ fontSize: 12, color: W.green, marginTop: 2 }}>+$0.00  0.00%</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[['Send','↑','send'],['Swap','⇄','swap'],['Receive','↓','receive'],['Buy','+','buy']].map(([label,icon,id]) => (
            <button key={id} onClick={() => window._walletNav && window._walletNav(id)} style={{
              flex: 1, background: W.card, border: 'none', borderRadius: 12, cursor: 'pointer',
              padding: '10px 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', background: W.card2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: W.purple,
              }}>{icon}</div>
              <span style={{ fontSize: 11, color: W.muted }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, padding: '0 16px', borderBottom: '1px solid ' + W.border, flexShrink: 0 }}>
        {['Tokens','Perps','Collectibles'].map((t, i) => (
          <button key={t} style={{
            background: 'none', border: 'none', padding: '6px 12px 8px',
            color: i === 0 ? W.text : W.muted, fontWeight: i === 0 ? 700 : 400,
            fontSize: 13, cursor: 'pointer',
            borderBottom: i === 0 ? '2px solid ' + W.purple : '2px solid transparent',
          }}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', color: W.muted, fontSize: 18, paddingRight: 4, cursor: 'pointer' }}>···</div>
      </div>

      {/* Chain selector */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 14px', overflowX: 'auto', flexShrink: 0 }}>
        {Object.entries(CHAIN_META).map(([id, ch]) => (
          <button key={id} onClick={() => setActiveChain(id)} style={{
            padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: activeChain === id ? ch.color : W.card2,
            color: activeChain === id ? '#fff' : W.muted,
            fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>{ch.name}</button>
        ))}
      </div>

      {/* Token list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tokens
          .sort((a, b) => usdVal(state.prices, b, bals[b] || 0) - usdVal(state.prices, a, bals[a] || 0))
          .map(tok => {
          const amt = bals[tok] || 0;
          const usd = usdVal(prices, tok, amt);
          const m = TOKEN_META[tok] || { name: tok, color: '#555' };
          return (
            <div key={tok} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              background: W.card, borderRadius: 14, cursor: 'pointer',
            }}>
              <TokIcon symbol={tok} size={38} chain={activeChain} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: W.text, whiteSpace: 'nowrap' }}>{m.name}</span>
                  <Check />
                </div>
                <div style={{ fontSize: 11, color: W.muted }}>{fmt(amt, amt < 1 ? 6 : 4)} {tok}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {usd > 0 ? (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 600, color: W.text }}>{fmtUsd(usd)}</div>
                    <div style={{ fontSize: 11, color: W.green }}>+$0.00</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: W.muted }}>$0.00</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Asset Picker Modal ────────────────────────────────────────
function AssetPicker({ state, exclude, onSelect, onClose }) {
  const [q, setQ] = useState('');
  const filtered = SWAP_ASSETS.filter(a => {
    if (exclude && exclude.chain === a.chain && exclude.token === a.token) return false;
    if (q) return a.token.toLowerCase().includes(q.toLowerCase()) ||
                  a.chain.toLowerCase().includes(q.toLowerCase()) ||
                  (TOKEN_META[a.token]?.name || '').toLowerCase().includes(q.toLowerCase());
    return true;
  });

  return (
    <div style={{ position: 'absolute', inset: 0, background: W.bg, display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid ' + W.border }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: W.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>←</button>
        <span style={{ fontWeight: 700, color: W.text, flex: 1 }}>Select Token</span>
      </div>
      <div style={{ padding: '10px 14px' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tokens..."
          style={{ width: '100%', background: W.card, border: 'none', borderRadius: 10, padding: '8px 12px', color: W.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map(a => {
          const bal = getbal(state.balances, a.chain, a.token);
          const usd = usdVal(state.prices, a.token, bal);
          const m = TOKEN_META[a.token] || { name: a.token };
          const ch = CHAIN_META[a.chain];
          const isMeme = ['BONK','WIF','JTO','BRETT','QUICK'].includes(a.token);
          return (
            <button key={a.chain + a.token} onClick={() => onSelect(a)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
              background: W.card, borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <TokIcon symbol={a.token} size={36} chain={a.chain} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: W.text }}>{m.name}</span>
                  {isMeme && <span style={{ fontSize: 9, background: 'rgba(240,82,82,.2)', color: '#f09252', borderRadius: 4, padding: '1px 4px' }}>HIGH RISK</span>}
                </div>
                <div style={{ fontSize: 11, color: W.muted }}>{a.token} · <span style={{ color: ch?.color }}>{ch?.name}</span></div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 13, color: bal > 0 ? W.text : W.muted, fontWeight: bal > 0 ? 600 : 400 }}>{fmt(bal, 4)} {a.token}</div>
                <div style={{ fontSize: 11, color: W.muted }}>{fmtUsd(usd)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Swap Screen ───────────────────────────────────────────────
function SwapScreen({ state }) {
  const [from, setFrom]     = useState({ chain: 'solana', token: 'USDC' });
  const [to,   setTo]       = useState({ chain: 'arbitrum', token: 'USDC' });
  const [amount, setAmount] = useState('');
  const [picker, setPicker] = useState(null);
  const [status, setStatus] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const fromBal  = getbal(state.balances, from.chain, from.token);
  const numAmt   = parseFloat(amount) || 0;
  const receive  = numAmt > 0 ? calcReceive(state.prices, from.token, to.token, numAmt) : 0;
  const feePct   = getFee(to.token);
  const isBridge = from.chain !== to.chain;
  const fromCh   = CHAIN_META[from.chain];
  const toCh     = CHAIN_META[to.chain];

  // Validation
  let error = null;
  if (numAmt > 0) {
    if (numAmt > fromBal) {
      error = 'Insufficient balance';
    } else {
      const gasToken = state.gasTokens[from.chain];
      if (gasToken !== from.token && getbal(state.balances, from.chain, gasToken) <= 0) {
        error = `Insufficient ${gasToken} for gas`;
      }
    }
  }

  const canSwap = numAmt > 0 && !error;

  async function doSwap() {
    if (!canSwap) return;
    const label = from.token + '→' + to.token;
    setStatus('pending'); setErrMsg('');
    try {
      await AppState.runTx(
        `${isBridge ? 'Bridge' : 'Swap'}: ${numAmt} ${from.token} (${fromCh?.name}) → ${fmt(receive, 6)} ${to.token} (${toCh?.name})`,
        from.chain,
        async () => {
          const gasToken = state.gasTokens[from.chain];
          if (gasToken !== from.token) AppState.addBalance(from.chain, gasToken, -0.000005);
          AppState.addBalance(from.chain, from.token, -numAmt);
          AppState.addBalance(to.chain, to.token, receive);
          AppState.addHistory({ type: isBridge ? 'Bridge' : 'Swap', desc: `${numAmt} ${from.token} → ${fmt(receive,6)} ${to.token}`, status: 'Success' });
        }
      );
      setAmount('');
      setStatus('success');
      setTimeout(() => setStatus(null), 3000);
    } catch (e) {
      setStatus(null);
    }
  }

  if (picker) {
    return (
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AssetPicker
          state={state}
          exclude={picker === 'from' ? to : from}
          onSelect={a => { if (picker === 'from') setFrom(a); else setTo(a); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {isBridge && (
        <div style={{ background: 'rgba(171,159,242,.1)', border: '1px solid rgba(171,159,242,.25)', borderRadius: 10, padding: '8px 12px', fontSize: 11, color: W.purple, textAlign: 'center' }}>
          Cross-chain bridge · {fromCh?.name} → {toCh?.name}
        </div>
      )}

      {/* You Pay */}
      <div style={{ background: W.card, borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 11, color: W.muted, marginBottom: 8 }}>You Pay</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0"
            style={{ flex: 1, background: 'none', border: 'none', color: W.text, fontSize: 26, fontWeight: 700, outline: 'none', minWidth: 0 }} />
          <button onClick={() => setPicker('from')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: W.card2, border: 'none',
            borderRadius: 20, padding: '6px 10px', cursor: 'pointer', color: W.text, flexShrink: 0,
          }}>
            <TokIcon symbol={from.token} size={22} chain={from.chain} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{from.token}</span>
            <span style={{ color: W.muted, fontSize: 11 }}>∨</span>
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: W.muted }}>
          <span>{numAmt > 0 ? fmtUsd(usdVal(state.prices, from.token, numAmt)) : '$0.00'}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{fmt(fromBal, 4)} {from.token}</span>
            <button onClick={() => setAmount(String(fromBal * 0.5))} style={{ background: W.card2, border: 'none', borderRadius: 5, color: W.muted, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>50%</button>
            <button onClick={() => setAmount(String(fromBal))} style={{ background: W.card2, border: 'none', borderRadius: 5, color: W.muted, fontSize: 10, padding: '2px 6px', cursor: 'pointer' }}>Max</button>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
        <button onClick={() => { const t = from; setFrom(to); setTo(t); }} style={{
          width: 34, height: 34, borderRadius: '50%', background: W.purple, border: '3px solid ' + W.bg,
          cursor: 'pointer', color: '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>⇅</button>
      </div>

      {/* You Receive */}
      <div style={{ background: W.card, borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 11, color: W.muted, marginBottom: 8 }}>You Receive</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 26, fontWeight: 700, color: receive > 0 ? W.text : W.muted }}>
            {receive > 0 ? fmt(receive, 6) : '0'}
          </div>
          <button onClick={() => setPicker('to')} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: W.card2, border: 'none',
            borderRadius: 20, padding: '6px 10px', cursor: 'pointer', color: W.text, flexShrink: 0,
          }}>
            <TokIcon symbol={to.token} size={22} chain={to.chain} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>{to.token}</span>
            <span style={{ color: W.muted, fontSize: 11 }}>∨</span>
          </button>
        </div>
        <div style={{ fontSize: 11, color: W.muted, marginTop: 6 }}>
          {receive > 0 ? fmtUsd(usdVal(state.prices, to.token, receive)) : '$0.00'}
        </div>
      </div>

      {/* Fee breakdown */}
      {numAmt > 0 && (
        <div style={{ background: W.card, borderRadius: 14, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[
            ['Fee', `${feePct}%  (${fmtUsd(usdVal(state.prices, from.token, numAmt) * feePct / 100)})`],
            ['Network fee', fmtUsd(0.0021)],
            isBridge && ['Est. time', `~${state.chainSpeeds?.[from.chain] || 5}s`],
          ].filter(Boolean).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: W.muted }}>{k}</span>
              <span style={{ color: W.text }}>{v}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: W.muted, paddingTop: 4, borderTop: '1px solid ' + W.border }}>
            {feePct > 1 ? `${feePct}% fee applies to high-risk tokens` : 'Quote includes a 1% simulation fee'}
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(240,82,82,.1)', border: '1px solid rgba(240,82,82,.35)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#f09252' }}>
          ⚠ {error}
        </div>
      )}

      {status === 'success' && (
        <div style={{ background: 'rgba(82,227,158,.1)', border: '1px solid rgba(82,227,158,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: W.green, textAlign: 'center' }}>
          ✓ Transaction confirmed
        </div>
      )}

      <button onClick={doSwap} disabled={!canSwap} style={{
        marginTop: 'auto', padding: 16, borderRadius: 14, border: 'none',
        background: canSwap ? W.purple : W.card2, color: canSwap ? '#fff' : W.muted,
        fontSize: 15, fontWeight: 700, cursor: canSwap ? 'pointer' : 'not-allowed', transition: 'all .2s',
      }}>
        {!numAmt ? 'Enter an amount' : error ? error : isBridge ? 'Bridge Now' : 'Swap Now'}
      </button>
    </div>
  );
}

// ── Receive Screen ────────────────────────────────────────────
function ReceiveScreen() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', gap: 16 }}>
      <div style={{ color: W.text, fontWeight: 700, fontSize: 16 }}>Receive</div>
      <div style={{ width: 160, height: 160, background: '#fff', borderRadius: 12, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 100 100" width="140" height="140">
          {[[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]].map((row, r) =>
            row.map((v, c) => v ? <rect key={r*7+c} x={r*13+2} y={c*13+2} width="11" height="11" fill="#000"/> : null)
          )}
          {[...Array(16)].map((_,i) => <rect key={'d'+i} x={32+(i%4)*9} y={32+Math.floor(i/4)*9} width="7" height="7" fill={i%3===0?'#000':'transparent'} />)}
        </svg>
      </div>
      <div style={{ background: W.card, borderRadius: 10, padding: '10px 14px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: W.muted, marginBottom: 4 }}>Wallet Address</div>
        <div style={{ fontSize: 11, color: W.text, wordBreak: 'break-all', fontFamily: 'monospace' }}>SimWlt1...Def1798</div>
      </div>
    </div>
  );
}

// ── History Screen ────────────────────────────────────────────
function HistoryScreen({ state }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px' }}>
      <div style={{ color: W.text, fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Activity</div>
      {state.txHistory.length === 0 ? (
        <div style={{ color: W.muted, textAlign: 'center', paddingTop: 40, fontSize: 13 }}>No activity yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {state.txHistory.map((tx, i) => (
            <div key={i} style={{ background: W.card, borderRadius: 12, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: W.text }}>{tx.type}</div>
                <div style={{ fontSize: 11, color: W.muted }}>{tx.desc}</div>
                <div style={{ fontSize: 10, color: W.muted, marginTop: 2 }}>{tx.time}</div>
              </div>
              <div style={{ fontSize: 11, color: W.green }}>{tx.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pending tx overlay ────────────────────────────────────────
function PendingOverlay({ pendingTx }) {
  const pct = pendingTx?.progress || 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,30,.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 40 }}>
      <div style={{ position: 'relative', width: 80, height: 80 }}>
        <svg viewBox="0 0 80 80" width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke={W.border} strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={W.purple} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset .1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: W.purple, fontSize: 22 }}>⟳</div>
      </div>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div style={{ color: W.text, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Processing</div>
        <div style={{ color: W.muted, fontSize: 12, lineHeight: 1.5 }}>{pendingTx?.description}</div>
      </div>
      <div style={{ color: W.purple, fontSize: 13, fontWeight: 600 }}>{Math.round(pct)}%</div>
    </div>
  );
}

// ── Request overlay ───────────────────────────────────────────
function RequestOverlay({ request }) {
  const isSign = request.type === 'sign';
  return (
    <div style={{ position: 'absolute', inset: 0, background: W.bg, display: 'flex', flexDirection: 'column', zIndex: 60 }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid ' + W.border, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0d1420', border: '1.5px solid #1e4a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌊</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: W.text }}>{request.dappName || 'Hyperliquid'}</div>
          <div style={{ fontSize: 11, color: W.muted }}>app.hyperliquid.xyz</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: W.text }}>{isSign ? 'Sign Transaction' : 'Connect Wallet'}</div>
        {!isSign ? (
          <>
            <div style={{ fontSize: 13, color: W.muted, lineHeight: 1.6 }}>Hyperliquid is requesting to connect to your wallet to view your address and request transaction signatures.</div>
            <div style={{ background: W.card, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: W.muted, marginBottom: 6 }}>Permissions requested</div>
              {['View wallet address', 'Request transaction signatures', 'View token balances'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: W.text }}>
                  <span style={{ color: W.green }}>✓</span> {p}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div style={{ background: W.card, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                ['Action', request.action || 'Deposit'],
                request.amount && ['Amount', `${request.amount} ${request.token || 'USDC'}`],
                ['Network', 'Arbitrum'],
                ['Gas', '~0.0001 ETH'],
                ['Contract', 'Hyperliquid Bridge v2'],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: W.muted }}>{k}</span>
                  <span style={{ color: W.text, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid ' + W.border }}>
        <button onClick={request.onReject} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid ' + W.border, background: 'none', color: W.muted, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
        <button onClick={request.onApprove} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: W.purple, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{isSign ? 'Sign' : 'Connect'}</button>
      </div>
    </div>
  );
}

// ── Main WalletPanel ──────────────────────────────────────────
function WalletPanel() {
  const [state, setState] = useState(() => AppState.state);
  const [screen, setScreen] = useState('home');

  useEffect(() => AppState.subscribe(setState), []);
  window._walletNav = setScreen;

  const showBack = ['swap','send','receive','history'].includes(screen);

  return (
    <div style={{
      width: '100%', height: '100%', background: W.bg, display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#15151e', borderBottom: '1px solid ' + W.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>👻</span>
          <span style={{ color: W.text, fontWeight: 700, fontSize: 13 }}>Phantom</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.walletConnected ? W.green : W.muted }} />
          <span style={{ fontSize: 10, color: W.muted }}>{state.walletConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Account header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px 6px', background: '#15151e', borderBottom: '1px solid ' + W.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#ab9ff2,#7b6fbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>👻</div>
          <div>
            <div style={{ fontSize: 10, color: W.muted }}>@SimUser</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: W.text }}>Account 1</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', color: W.muted, fontSize: 15, cursor: 'pointer' }}>⊞</button>
          <button style={{ background: 'none', border: 'none', color: W.muted, fontSize: 15, cursor: 'pointer' }}>≡</button>
        </div>
      </div>

      {/* Sub-screen back header */}
      {showBack && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid ' + W.border, flexShrink: 0 }}>
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: W.muted, fontSize: 18, cursor: 'pointer' }}>←</button>
          <span style={{ color: W.text, fontWeight: 700, fontSize: 14, textTransform: 'capitalize' }}>{screen}</span>
        </div>
      )}

      {/* Screen content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        {screen === 'home'    && <HomeScreen    state={state} />}
        {screen === 'swap'    && <SwapScreen    state={state} />}
        {screen === 'send'    && <ReceiveScreen />}
        {screen === 'receive' && <ReceiveScreen />}
        {screen === 'history' && <HistoryScreen state={state} />}
        {screen === 'search'  && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: W.muted, fontSize: 13 }}>Search tokens</div>}
        {screen === 'buy'     && <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: W.muted, fontSize: 13, flexDirection: 'column', gap: 8 }}><span style={{ fontSize: 28 }}>🏦</span>Use Coinbase tab to fund your wallet</div>}

        {state.pendingTx      && <PendingOverlay  pendingTx={state.pendingTx} />}
        {state.pendingRequest && <RequestOverlay  request={state.pendingRequest} />}
      </div>

      <BottomNav screen={screen} onNav={setScreen} />
    </div>
  );
}

window.WalletPanel = WalletPanel;
