// Main.jsx v2 — tab bar, admin panel behind Earn, updated presets
const { useState, useEffect } = React;

const A = {
  bg: '#0a0a0e', panel: '#13141a', border: '#1e2028',
  text: '#e8e8f0', muted: '#6b6b82', teal: '#00d4a8',
  purple: '#ab9ff2', green: '#00e8a2', red: '#f03060',
};

const CHAIN_SPEEDS_META = [
  { id: 'solana',   name: 'Solana',   color: '#9945FF' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#12AAFF' },
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'base',     name: 'Base',     color: '#0052FF' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'polygon',  name: 'Polygon',  color: '#8247E5' },
];

const PRESETS = [
  { id: 'sol-usdc-nogas', label: '15 USDC · Solana',           sub: 'No gas (default)' },
  { id: 'sol-usdc-gas',   label: '15 USDC · Solana + gas',     sub: '+ 0.05 SOL' },
  { id: 'sol-gas-only',   label: 'SOL gas only',               sub: '0.05 SOL, no USDC' },
  { id: 'arb-usdc-nogas', label: '15 USDC · Arbitrum',         sub: 'No ETH gas' },
  { id: 'arb-usdc-gas',   label: '15 USDC · Arbitrum + gas',   sub: '+ 0.002 ETH' },
];

// ── Admin Panel (behind Earn click) ───────────────────────────
function AdminPanel({ visible, onClose }) {
  const [state, setState] = useState(() => AppState.state);
  useEffect(() => AppState.subscribe(setState), []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 300,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: A.panel, border: '1px solid ' + A.border, borderRadius: 18,
        padding: 24, width: 580, maxHeight: '85vh', overflowY: 'auto',
        boxShadow: '0 12px 60px rgba(0,0,0,.8)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: A.text, fontWeight: 800, fontSize: 16 }}>Scenario Setup</div>
            <div style={{ color: A.muted, fontSize: 11, marginTop: 2 }}>Facilitator controls — not visible to user</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: A.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Presets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => AppState.applyPreset(p.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: A.bg, border: '1px solid ' + A.border, borderRadius: 10,
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ color: A.teal, fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ color: A.muted, fontSize: 11 }}>{p.sub}</div>
                </div>
                <span style={{ color: A.muted, fontSize: 16 }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual balances */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: A.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Manual Balances</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { chain: 'solana',   tokens: ['USDC','SOL']  },
              { chain: 'arbitrum', tokens: ['USDC','ETH']  },
              { chain: 'ethereum', tokens: ['USDC','ETH']  },
              { chain: 'base',     tokens: ['USDC','ETH']  },
              { chain: 'optimism', tokens: ['USDC','ETH']  },
              { chain: 'polygon',  tokens: ['USDC','MATIC']},
            ].map(({ chain, tokens }) => {
              const meta = CHAIN_SPEEDS_META.find(c => c.id === chain);
              return (
                <div key={chain} style={{ background: A.bg, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: meta?.color || A.text, marginBottom: 8 }}>{meta?.name || chain}</div>
                  {tokens.map(tok => (
                    <div key={tok} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: A.muted, marginBottom: 3 }}>{tok}</div>
                      <input
                        type="number" min="0"
                        step={tok === 'USDC' ? '1' : '0.001'}
                        value={(state.balances[chain] && state.balances[chain][tok]) ?? 0}
                        onChange={e => AppState.setBalance(chain, tok, e.target.value)}
                        style={{
                          width: '100%', background: A.panel, border: '1px solid ' + A.border,
                          borderRadius: 7, padding: '5px 8px', color: A.text, fontSize: 12,
                          outline: 'none', boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Per-chain tx speeds */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: A.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Transaction Speeds (seconds)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CHAIN_SPEEDS_META.map(ch => (
              <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 70, fontSize: 11, fontWeight: 600, color: ch.color, flexShrink: 0 }}>{ch.name}</div>
                <input
                  type="range" min="1" max="30" step="1"
                  value={state.chainSpeeds?.[ch.id] ?? 5}
                  onChange={e => AppState.setChainSpeed(ch.id, e.target.value)}
                  style={{ flex: 1, accentColor: ch.color }}
                />
                <div style={{ width: 32, textAlign: 'right', fontSize: 12, color: A.text, fontWeight: 600 }}>
                  {state.chainSpeeds?.[ch.id] ?? 5}s
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Misc */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div style={{ background: A.bg, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: A.muted, marginBottom: 6 }}>Hyperliquid Balance (USDC)</div>
            <input type="number" min="0"
              value={state.hyperliquidBalance || 0}
              onChange={e => AppState.setHyperliquidBalance(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: A.panel, border: '1px solid ' + A.border, borderRadius: 7, padding: '6px 8px', color: A.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ background: A.bg, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: A.muted, marginBottom: 6 }}>Coinbase Cash Balance (USD)</div>
            <input type="number" min="0"
              value={state.coinbaseBalance || 0}
              onChange={e => AppState.setCoinbaseBalance(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: A.panel, border: '1px solid ' + A.border, borderRadius: 7, padding: '6px 8px', color: A.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Status + reset */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid ' + A.border }}>
          <div style={{ fontSize: 11, color: A.muted }}>
            Wallet: <span style={{ color: state.walletConnected ? A.green : A.red }}>{state.walletConnected ? '● Connected' : '● Disconnected'}</span>
            {state.walletConnected && (
              <button onClick={() => AppState.setConnected(false)} style={{ marginLeft: 8, background: 'none', border: '1px solid ' + A.border, borderRadius: 5, padding: '2px 7px', color: A.muted, fontSize: 10, cursor: 'pointer' }}>Disconnect</button>
            )}
          </div>
          <button onClick={() => { AppState.reset(); }} style={{
            background: 'rgba(240,48,96,.1)', border: '1px solid rgba(240,48,96,.3)',
            borderRadius: 8, padding: '6px 14px', color: A.red, fontSize: 12,
            cursor: 'pointer', fontWeight: 600,
          }}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', background: '#08080c',
      borderBottom: '1px solid #1a1a24', padding: '0 0', flexShrink: 0, height: 38,
    }}>
      {[
        { id: 'hyperliquid', label: 'Hyperliquid', icon: '🌊' },
        { id: 'coinbase',    label: 'Coinbase',    icon: '🏦' },
      ].map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px',
          height: '100%', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          background: active === tab.id ? A.panel : 'transparent',
          color: active === tab.id ? A.text : A.muted,
          borderRight: '1px solid #1a1a24',
          borderBottom: active === tab.id ? '2px solid ' + A.teal : '2px solid transparent',
          transition: 'all .15s',
        }}>
          <span style={{ fontSize: 14 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 10, color: A.muted, paddingRight: 14 }}>DeFi UX Simulator</div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────
function App() {
  const [tab,        setTab]        = useState('hyperliquid');
  const [adminOpen,  setAdminOpen]  = useState(false);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh',
      background: A.bg, overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Browser-style tab bar */}
      <TabBar active={tab} onChange={setTab} />

      {/* Main content row */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* Left: active tab content */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {tab === 'hyperliquid' && <DAppPanel onEarnClick={() => setAdminOpen(true)} />}
          {tab === 'coinbase'    && <CoinbasePanel />}
        </div>

        {/* Right: persistent wallet */}
        <div style={{ width: 338, flexShrink: 0, borderLeft: '1px solid #1a1a24', background: '#1c1c24' }}>
          <WalletPanel />
        </div>
      </div>

      {/* Admin modal */}
      <AdminPanel visible={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
