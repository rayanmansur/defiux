// NimbusAdmin.jsx — hidden admin panel + root App
const { useState, useEffect } = React;

// ── Admin Panel ───────────────────────────────────────────────
function NimbusAdmin({ visible, onClose }) {
  const [state, setState] = useState(() => NState.state);
  useEffect(() => NState.subscribe(setState), []);
  if (!visible) return null;

  const aaveSupplied = state.aaveSupplied || {};

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#13151f', border: '1px solid rgba(255,255,255,.1)', borderRadius: 20, padding: 28, width: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 80px rgba(0,0,0,.8)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ color: '#f0f2ff', fontWeight: 800, fontSize: 17 }}>Scenario Setup</div>
            <div style={{ color: '#7880a0', fontSize: 11, marginTop: 2 }}>Facilitator controls</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7880a0', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Presets */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#7880a0', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Presets</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { id: 'fresh',  label: '$1,000 Cash',              sub: 'Default starting balance' },
              { id: 'active', label: 'Deployed portfolio',       sub: '$500 cash + $300 HL + $200 Aave' },
              { id: 'rich',   label: '$5,000 Cash',              sub: 'Wealthy user scenario' },
              { id: 'empty',  label: 'Empty account',            sub: 'No funds — test funding flow' },
            ].map(p => (
              <button key={p.id} onClick={() => NState.applyPreset(p.id)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10,
                padding: '10px 14px', cursor: 'pointer', textAlign: 'left',
              }}>
                <div>
                  <div style={{ color: '#00d4a8', fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ color: '#7880a0', fontSize: 11 }}>{p.sub}</div>
                </div>
                <span style={{ color: '#7880a0' }}>→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Manual balances */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#7880a0', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>Manual Balances</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Cash Balance (USD)',          val: state.cashBalance,           set: v => NState.setCashBalance(v) },
              { label: 'Hyperliquid Balance (USDC)',  val: state.hyperliquidBalance,     set: v => NState.setHLBalance(v) },
              { label: 'Aave Supplied USDC',          val: aaveSupplied.USDC || 0,      set: v => { NState.aaveWithdraw('USDC', aaveSupplied.USDC||0); NState.aaveSupply('USDC', parseFloat(v)||0); } },
            ].map(({ label, val, set }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 10, color: '#7880a0', marginBottom: 6 }}>{label}</div>
                <input type="number" min="0" value={val} onChange={e => set(e.target.value)}
                  style={{ width: '100%', background: '#0d0f1a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, padding: '6px 8px', color: '#f0f2ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Transaction speed */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: '#7880a0', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Transaction Speed</div>
            <span style={{ fontSize: 14, color: '#00d4a8', fontWeight: 700 }}>{state.txSpeed}s</span>
          </div>
          <input type="range" min="1" max="10" step="1" value={state.txSpeed}
            onChange={e => NState.setTxSpeed(e.target.value)}
            style={{ width: '100%', accentColor: '#00d4a8' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7880a0', marginTop: 4 }}>
            <span>1s (instant)</span><span>10s (realistic)</span>
          </div>
        </div>

        {/* P&L override */}
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 14, marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#7880a0', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 10 }}>P&amp;L Display</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'P&L (USD)', val: state.pnl, onChange: v => NState.setPnl(parseFloat(v)||0, state.pnlPct) },
              { label: 'P&L (%)',   val: state.pnlPct, onChange: v => NState.setPnl(state.pnl, parseFloat(v)||0) },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 10, color: '#7880a0', marginBottom: 4 }}>{f.label}</div>
                <input type="number" value={f.val} onChange={e => f.onChange(e.target.value)}
                  style={{ width: '100%', background: '#0d0f1a', border: '1px solid rgba(255,255,255,.08)', borderRadius: 7, padding: '6px 8px', color: '#f0f2ff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.07)' }}>
          <button onClick={() => NState.reset()} style={{ background: 'rgba(232,64,96,.1)', border: '1px solid rgba(232,64,96,.25)', borderRadius: 8, padding: '7px 18px', color: '#e84060', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Reset All</button>
        </div>
      </div>
    </div>
  );
}

// ── Browser URL bar ───────────────────────────────────────────
function BrowserBar({ activeApp, onHome }) {
  const urls = {
    home:  'nimbus.app',
    hl:    'nimbus.app/trade/hyperliquid',
    aave:  'nimbus.app/earn/aave',
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#0d0f1a', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0 }}>
      {/* Traffic lights */}
      <div style={{ display: 'flex', gap: 6 }}>
        {['#ff5f57','#febc2e','#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
      </div>
      {/* Nav */}
      <button onClick={onHome} style={{ background: 'none', border: 'none', color: activeApp !== 'home' ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.15)', cursor: activeApp !== 'home' ? 'pointer' : 'default', fontSize: 14, padding: '0 4px' }}>←</button>
      <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.15)', fontSize: 14, padding: '0 4px' }}>→</button>
      {/* URL bar */}
      <div style={{ flex: 1, background: 'rgba(255,255,255,.06)', borderRadius: 8, padding: '5px 12px', fontSize: 12, color: 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#2ecc8e', fontSize: 11 }}>🔒</span>
        <span>{urls[activeApp] || 'nimbus.app'}</span>
      </div>
      {/* Actions */}
      <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: 14, cursor: 'pointer' }}>⊕</button>
      <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.3)', fontSize: 16, cursor: 'pointer' }}>⋯</button>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────
function NimbusApp() {
  const [state,      setState]     = useState(() => NState.state);
  const [activeApp,  setActiveApp] = useState('home');
  const [adminOpen,  setAdminOpen] = useState(false);

  useEffect(() => NState.subscribe(setState), []);

  // Settings click = admin
  window._nimbusAdmin = () => setAdminOpen(true);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#06070d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Browser chrome wrapper */}
      <div style={{
        width: 'min(1200px, 98vw)', height: 'min(820px, 97vh)',
        display: 'flex', flexDirection: 'column',
        background: '#0a0c12', borderRadius: 14,
        boxShadow: '0 32px 120px rgba(0,0,0,.9), 0 0 0 1px rgba(255,255,255,.06)',
        overflow: 'hidden',
      }}>
        <BrowserBar activeApp={activeApp} onHome={() => setActiveApp('home')} />

        {/* App background with gradient */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', background: 'radial-gradient(ellipse at 20% 50%, rgba(100,80,200,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,212,168,0.05) 0%, transparent 50%), #0a0c12' }}>
          {activeApp === 'home' && <NimbusHome state={state} onOpenApp={id => setActiveApp(id)} onAdmin={() => setAdminOpen(true)} />}
          {activeApp === 'hl'   && <NimbusHL   state={state} onBack={() => setActiveApp('home')} />}
          {activeApp === 'aave' && <NimbusAave state={state} onBack={() => setActiveApp('home')} />}
        </div>
      </div>

      <NimbusAdmin visible={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NimbusApp />);
