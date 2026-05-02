// NimbusScenarioSetup.jsx - facilitator controls for Nimbus scenarios
const NS = {
  bg: '#0a0a0e',
  panel: '#13141a',
  border: '#1e2028',
  text: '#e8e8f0',
  muted: '#6b6b82',
  teal: '#35c8f0',
  green: '#58e0a8',
  red: '#f03060',
};

const NIMBUS_CHAIN_SPEEDS_META = [
  { id: 'solana', name: 'Solana', color: '#9945FF' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#12AAFF' },
  { id: 'ethereum', name: 'Ethereum', color: '#627EEA' },
  { id: 'base', name: 'Base', color: '#0052FF' },
  { id: 'optimism', name: 'Optimism', color: '#FF0420' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5' },
];

const NIMBUS_SETUP_BALANCES = [
  { chain: 'solana', tokens: ['USDC', 'SOL', 'BONK', 'WIF', 'JTO'] },
  { chain: 'arbitrum', tokens: ['USDC', 'ETH', 'ARB'] },
  { chain: 'ethereum', tokens: ['USDC', 'ETH', 'UNI', 'LINK'] },
  { chain: 'base', tokens: ['USDC', 'ETH', 'cbBTC', 'weETH', 'wstETH', 'EURC', 'cbETH', 'GHO', 'AAVE', 'ezETH', 'BRETT'] },
  { chain: 'optimism', tokens: ['USDC', 'ETH', 'OP'] },
  { chain: 'polygon', tokens: ['USDC', 'MATIC', 'QUICK'] },
];

const NIMBUS_PRESETS = [
  { id: 'sol-usdc-nogas', label: '15 USDC on Solana', sub: 'Default cross-chain starting point' },
  { id: 'sol-usdc-gas', label: '15 USDC + SOL gas', sub: 'Traditional comparison preset' },
  { id: 'arb-usdc-nogas', label: '15 USDC on Arbitrum', sub: 'HyperLivid direct source' },
  { id: 'base-usdc-nogas', label: '15 USDC on Base', sub: 'Waave direct source' },
];

function NimbusScenarioSetupPanel({ visible, onClose, app }) {
  const [state, setState] = React.useState(() => AppState.state);
  React.useEffect(() => AppState.subscribe(setState), []);

  if (!visible) return null;

  const hasAave = !!state.aaveSupplied;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: NS.panel, border: '1px solid ' + NS.border, borderRadius: 18, padding: 24, width: 620, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 12px 60px rgba(0,0,0,.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ color: NS.text, fontWeight: 800, fontSize: 16 }}>Scenario Setup</div>
            <div style={{ color: NS.muted, fontSize: 11, marginTop: 2 }}>Facilitator controls - Nimbus wallet</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: NS.muted, fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>x</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: NS.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Presets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NIMBUS_PRESETS.filter(p => app === 'prototype' ? true : hasAave ? !p.id.startsWith('arb-') : !p.id.startsWith('base-')).map(p => (
              <button key={p.id} onClick={() => AppState.applyPreset(p.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: NS.bg, border: '1px solid ' + NS.border, borderRadius: 10,
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ color: NS.teal, fontSize: 13, fontWeight: 700 }}>{p.label}</div>
                  <div style={{ color: NS.muted, fontSize: 11 }}>{p.sub}</div>
                </div>
                <span style={{ color: NS.muted, fontSize: 16 }}>-</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: NS.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Nimbus Wallet Balances</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {NIMBUS_SETUP_BALANCES.map(({ chain, tokens }) => {
              const meta = NIMBUS_CHAIN_SPEEDS_META.find(c => c.id === chain);
              return (
                <div key={chain} style={{ background: NS.bg, borderRadius: 10, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: meta?.color || NS.text, marginBottom: 8 }}>{meta?.name}</div>
                  {tokens.map(tok => (
                    <div key={tok} style={{ marginBottom: 6 }}>
                      <div style={{ fontSize: 10, color: NS.muted, marginBottom: 3 }}>{tok}</div>
                      <input
                        type="number"
                        min="0"
                        step={tok === 'USDC' || tok === 'EURC' || tok === 'GHO' ? '1' : '0.001'}
                        value={(state.balances[chain] && state.balances[chain][tok]) ?? 0}
                        onChange={e => AppState.setBalance(chain, tok, e.target.value)}
                        style={{ width: '100%', background: NS.panel, border: '1px solid ' + NS.border, borderRadius: 7, padding: '5px 8px', color: NS.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: NS.muted, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 10 }}>Transaction Speeds (seconds)</div>
          {NIMBUS_CHAIN_SPEEDS_META.map(ch => (
            <div key={ch.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 70, fontSize: 11, fontWeight: 700, color: ch.color, flexShrink: 0 }}>{ch.name}</div>
              <input type="range" min="1" max="30" step="1"
                value={state.chainSpeeds?.[ch.id] ?? 5}
                onChange={e => AppState.setChainSpeed(ch.id, e.target.value)}
                style={{ flex: 1, accentColor: ch.color }} />
              <div style={{ width: 32, textAlign: 'right', fontSize: 12, color: NS.text, fontWeight: 700 }}>{state.chainSpeeds?.[ch.id] ?? 5}s</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {!hasAave && (
            <div style={{ background: NS.bg, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: NS.muted, marginBottom: 6 }}>HyperLivid Balance (USDC)</div>
              <input type="number" min="0"
                value={state.hyperliquidBalance || 0}
                onChange={e => AppState.setHyperliquidBalance(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: NS.panel, border: '1px solid ' + NS.border, borderRadius: 7, padding: '6px 8px', color: NS.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
          {hasAave && (
            <div style={{ background: NS.bg, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, color: NS.muted, marginBottom: 6 }}>Waave Supplied USDC</div>
              <input type="number" min="0"
                value={(state.aaveSupplied && state.aaveSupplied.USDC) || 0}
                onChange={e => AppState.aaveSupply('USDC', (parseFloat(e.target.value) || 0) - ((state.aaveSupplied && state.aaveSupplied.USDC) || 0))}
                style={{ width: '100%', background: NS.panel, border: '1px solid ' + NS.border, borderRadius: 7, padding: '6px 8px', color: NS.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div style={{ background: NS.bg, borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 11, color: NS.muted, marginBottom: 6 }}>Coinbase Cash Balance (USD)</div>
            <input type="number" min="0"
              value={state.coinbaseBalance || 0}
              onChange={e => AppState.setCoinbaseBalance(parseFloat(e.target.value) || 0)}
              style={{ width: '100%', background: NS.panel, border: '1px solid ' + NS.border, borderRadius: 7, padding: '6px 8px', color: NS.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid ' + NS.border }}>
          <div style={{ fontSize: 11, color: NS.muted }}>
            Wallet: <span style={{ color: state.walletConnected ? NS.green : NS.red }}>{state.walletConnected ? 'Connected' : 'Disconnected'}</span>
            {state.walletConnected && (
              <button onClick={() => AppState.setConnected(false)} style={{ marginLeft: 8, background: 'none', border: '1px solid ' + NS.border, borderRadius: 5, padding: '2px 7px', color: NS.muted, fontSize: 10, cursor: 'pointer' }}>Disconnect</button>
            )}
          </div>
          <button onClick={() => AppState.reset()} style={{ background: 'rgba(240,48,96,.1)', border: '1px solid rgba(240,48,96,.3)', borderRadius: 8, padding: '6px 14px', color: NS.red, fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

window.NimbusScenarioSetupPanel = NimbusScenarioSetupPanel;
