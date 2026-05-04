// NimbusHome.jsx — Home screen: portfolio overview + app grid
const { useState, useEffect, useRef } = React;

const N = {
  bg:       '#0a0c12',
  glass:    'rgba(255,255,255,0.04)',
  glass2:   'rgba(255,255,255,0.08)',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.14)',
  text:     '#f0f2ff',
  muted:    '#7880a0',
  muted2:   '#a0a8c0',
  green:    '#2ecc8e',
  red:      '#e84060',
  blue:     '#4a8fff',
  purple:   '#9d6fff',
  teal:     '#00d4a8',
  gold:     '#f0c040',
  grad1:    'linear-gradient(135deg, #1a1040 0%, #0d1a30 100%)',
  gradHL:   'linear-gradient(135deg, #0d2040 0%, #1a3060 100%)',
  gradAave: 'linear-gradient(135deg, #1a0d30 0%, #2a1050 100%)',
};

function fmtUsd(n, dec = 2) {
  const x = parseFloat(n) || 0;
  if (x >= 1000) return '$' + (x / 1000).toFixed(2) + 'k';
  return '$' + x.toFixed(dec);
}
function fmtLarge(n) {
  const x = parseFloat(n) || 0;
  if (x >= 1000) return '$' + (x / 1000).toFixed(2) + 'k';
  return '$' + x.toFixed(2);
}

// ── Glassmorphism card ────────────────────────────────────────
function GlassCard({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: N.glass,
      border: '1px solid ' + N.border2,
      borderRadius: 20,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      ...style,
    }}>{children}</div>
  );
}

// ── Portfolio overview ────────────────────────────────────────
function PortfolioCard({ state }) {
  const total = NState.portfolioUsd;
  const pnl = state.pnl || 0;
  const pnlPct = state.pnlPct || 0;
  const isPos = pnl >= 0;

  // Positions breakdown
  const hlBal   = state.hyperliquidBalance || 0;
  const aaveVal = Object.entries(state.aaveSupplied || {}).reduce((s, [t, a]) => s + (state.prices[t] || 1) * a, 0);
  const cash    = state.cashBalance || 0;
  const denom   = total || 1;

  const bars = [
    { label: 'Cash',         value: cash,   pct: cash/denom,   color: N.teal  },
    { label: 'Hyperliquid',  value: hlBal,  pct: hlBal/denom,  color: '#4a9eff' },
    { label: 'Aave',         value: aaveVal,pct: aaveVal/denom, color: '#b6509e' },
  ].filter(b => b.value > 0);

  // Yield
  const yieldPerYear = aaveVal * 0.3023;
  const yieldPerDay  = yieldPerYear / 365;

  return (
    <GlassCard style={{ padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(100,80,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -40, left: 40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,168,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, color: N.muted, marginBottom: 6, letterSpacing: '.06em', textTransform: 'uppercase' }}>Total Portfolio</div>
          <div style={{ fontSize: 44, fontWeight: 800, color: N.text, letterSpacing: '-1px', lineHeight: 1 }}>
            {fmtLarge(total)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{
              fontSize: 13, fontWeight: 600,
              color: isPos ? N.green : N.red,
              background: isPos ? 'rgba(46,204,142,.12)' : 'rgba(232,64,96,.12)',
              padding: '3px 10px', borderRadius: 20,
            }}>
              {isPos ? '+' : ''}{fmtUsd(pnl)} ({isPos ? '+' : ''}{pnlPct.toFixed(2)}%)
            </span>
            <span style={{ fontSize: 11, color: N.muted }}>all time</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: N.muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.06em' }}>Yield / day</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: N.green }}>
            {yieldPerDay > 0 ? '+' + fmtUsd(yieldPerDay) : '$0.00'}
          </div>
          <div style={{ fontSize: 11, color: N.muted, marginTop: 2 }}>{yieldPerYear > 0 ? fmtUsd(yieldPerYear) + '/yr' : 'Deploy to earn'}</div>
        </div>
      </div>

      {/* Allocation bar */}
      {bars.length > 0 && (
        <div>
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 6, gap: 1, marginBottom: 12 }}>
            {bars.map(b => (
              <div key={b.label} style={{ flex: b.pct, background: b.color, minWidth: 4, transition: 'flex .4s ease' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {bars.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color }} />
                <span style={{ fontSize: 11, color: N.muted2 }}>{b.label}</span>
                <span style={{ fontSize: 11, color: N.text, fontWeight: 600 }}>{fmtUsd(b.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions */}
      {(hlBal > 0 || aaveVal > 0) && (
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid ' + N.border, display: 'flex', gap: 16 }}>
          {hlBal > 0 && (
            <div style={{ flex: 1, background: N.glass2, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: N.muted, marginBottom: 4 }}>HYPERLIQUID</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.text }}>{fmtUsd(hlBal)}</div>
              <div style={{ fontSize: 10, color: N.muted }}>Available to trade</div>
            </div>
          )}
          {aaveVal > 0 && (
            <div style={{ flex: 1, background: N.glass2, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: N.muted, marginBottom: 4 }}>AAVE · BASE</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.text }}>{fmtUsd(aaveVal)}</div>
              <div style={{ fontSize: 11, color: N.green }}>+30.23% APY</div>
            </div>
          )}
          {cash > 0 && (
            <div style={{ flex: 1, background: N.glass2, borderRadius: 12, padding: '10px 14px' }}>
              <div style={{ fontSize: 10, color: N.muted, marginBottom: 4 }}>AVAILABLE CASH</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.text }}>{fmtUsd(cash)}</div>
              <div style={{ fontSize: 10, color: N.muted }}>Ready to deploy</div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ── App tile ──────────────────────────────────────────────────
function AppTile({ app, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={app.live ? onClick : undefined}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: app.live
          ? (hov ? 'rgba(255,255,255,0.1)' : N.glass)
          : 'rgba(255,255,255,0.02)',
        border: '1px solid ' + (app.live ? (hov ? N.border2 : N.border) : 'rgba(255,255,255,0.04)'),
        borderRadius: 20, padding: '22px 16px', cursor: app.live ? 'pointer' : 'default',
        transition: 'all .2s ease', textAlign: 'center',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        transform: hov && app.live ? 'translateY(-2px)' : 'none',
        boxShadow: hov && app.live ? '0 8px 32px rgba(0,0,0,.4)' : 'none',
        opacity: app.live ? 1 : 0.45,
        position: 'relative', overflow: 'hidden',
      }}>
      {/* Background gradient */}
      {app.live && (
        <div style={{ position: 'absolute', inset: 0, background: app.grad, opacity: 0.3, borderRadius: 20 }} />
      )}
      <div style={{ position: 'relative' }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, borderRadius: 16, background: app.iconBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, margin: '0 auto 10px', boxShadow: app.live ? '0 4px 16px rgba(0,0,0,.3)' : 'none',
        }}>{app.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: app.live ? N.text : N.muted, marginBottom: 3 }}>{app.name}</div>
        <div style={{ fontSize: 10, color: N.muted }}>{app.desc}</div>
        {!app.live && (
          <div style={{ marginTop: 8, fontSize: 9, background: 'rgba(255,255,255,.06)', color: N.muted, borderRadius: 20, padding: '2px 8px', display: 'inline-block', letterSpacing: '.06em', textTransform: 'uppercase' }}>Soon</div>
        )}
        {app.live && app.badge && (
          <div style={{ marginTop: 8, fontSize: 9, background: 'rgba(46,204,142,.15)', color: N.green, borderRadius: 20, padding: '2px 8px', display: 'inline-block', letterSpacing: '.04em' }}>{app.badge}</div>
        )}
      </div>
    </div>
  );
}

const APPS = [
  { id: 'hl',      name: 'Hyperliquid', desc: 'Perp trading',      icon: '🌊', iconBg: 'linear-gradient(135deg,#0d2040,#1a4080)', grad: 'linear-gradient(135deg,#0d2040,#1a4080)', live: true,  badge: 'Live' },
  { id: 'aave',    name: 'Aave',        desc: 'Supply & Borrow',   icon: '🏦', iconBg: 'linear-gradient(135deg,#2a0d40,#4a1060)', grad: 'linear-gradient(135deg,#2a0d40,#4a1060)', live: true,  badge: '30.23% APY' },
  { id: 'uniswap', name: 'Uniswap',     desc: 'Spot trading',      icon: '🦄', iconBg: 'linear-gradient(135deg,#3d0a2a,#6a1050)', grad: '', live: false },
  { id: 'gmx',     name: 'GMX',         desc: 'Leverage trading',  icon: '🔵', iconBg: 'linear-gradient(135deg,#0a2040,#1a3060)', grad: '', live: false },
  { id: 'pendle',  name: 'Pendle',      desc: 'Yield trading',     icon: '📈', iconBg: 'linear-gradient(135deg,#1a2a0d,#2a4010)', grad: '', live: false },
  { id: 'lido',    name: 'Lido',        desc: 'Liquid staking',    icon: '🔷', iconBg: 'linear-gradient(135deg,#0d1a40,#1a2a60)', grad: '', live: false },
];

// ── Deposit Modal (fiat + crypto) ─────────────────────────────
function DepositModal({ onClose }) {
  const [tab, setTab]     = useState('bank');
  const [amount, setAmount] = useState('');
  const [phase, setPhase]   = useState('idle');

  async function doDeposit() {
    const num = parseFloat(amount) || 0;
    if (num <= 0) return;
    setPhase('processing');
    await new Promise(r => setTimeout(r, 2500));
    NState.setCashBalance(NState.state.cashBalance + num);
    NState.addHistory({ type: 'Deposit', desc: `+${fmtUsd(num)} via ${tab === 'bank' ? 'Bank Transfer' : 'Crypto'}`, status: 'Success' });
    setPhase('done');
    setTimeout(onClose, 800);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(6px)' }}>
      <div style={{ background: '#13151f', border: '1px solid ' + N.border2, borderRadius: 20, padding: 28, width: 400, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: N.text, fontWeight: 800, fontSize: 18 }}>Add Funds</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: N.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', background: N.glass, borderRadius: 12, padding: 4 }}>
          {[['bank','Bank Transfer'],['crypto','Crypto Deposit']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: tab === id ? 'rgba(255,255,255,.1)' : 'none',
              color: tab === id ? N.text : N.muted,
            }}>{label}</button>
          ))}
        </div>

        {tab === 'bank' ? (
          <>
            <div style={{ background: N.glass, border: '1px solid ' + N.border, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 11, color: N.muted, marginBottom: 8 }}>Amount (USD)</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 22, color: N.muted, fontWeight: 700, marginRight: 6 }}>$</span>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  style={{ flex: 1, background: 'none', border: 'none', color: N.text, fontSize: 26, fontWeight: 700, outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[100,500,1000,5000].map(v => (
                <button key={v} onClick={() => setAmount(String(v))} style={{
                  flex: 1, padding: '8px', borderRadius: 8, border: '1px solid ' + N.border,
                  background: parseFloat(amount) === v ? N.glass2 : 'none',
                  color: parseFloat(amount) === v ? N.text : N.muted, fontSize: 12, cursor: 'pointer',
                }}>${v >= 1000 ? (v/1000)+'k' : v}</button>
              ))}
            </div>
            <div style={{ background: N.glass, borderRadius: 12, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Method','Bank Account ···4521'],['Fee','$0.00'],['Arrives','Instant']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: N.muted }}>{k}</span><span style={{ color: N.text, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: N.glass, border: '1px solid ' + N.border, borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: N.muted, marginBottom: 12 }}>Send USDC to your Nimbus address</div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 12, display: 'inline-block', marginBottom: 12 }}>
              <svg viewBox="0 0 80 80" width="80" height="80">
                {[[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]].map((row,r) =>
                  row.map((v,c) => v ? <rect key={r*7+c} x={r*11+2} y={c*11+2} width="9" height="9" fill="#000"/> : null)
                )}
              </svg>
            </div>
            <div style={{ fontSize: 10, color: N.muted, fontFamily: 'monospace' }}>0xNimbus...1a2b3c</div>
            <div style={{ fontSize: 10, color: N.muted, marginTop: 6 }}>Supports: USDC on any EVM chain</div>
          </div>
        )}

        {phase === 'processing' && <div style={{ background: 'rgba(74,143,255,.08)', border: '1px solid rgba(74,143,255,.2)', borderRadius: 10, padding: 12, fontSize: 12, color: N.blue, textAlign: 'center' }}>⏳ Processing...</div>}

        {tab === 'bank' && (
          <button onClick={doDeposit} disabled={!amount || phase === 'processing'} style={{
            padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: amount && phase === 'idle' ? 'linear-gradient(135deg,#4a8fff,#9d6fff)' : N.glass2,
            color: amount && phase === 'idle' ? '#fff' : N.muted, fontSize: 14, fontWeight: 700,
          }}>{phase === 'processing' ? 'Processing...' : `Deposit ${amount ? fmtUsd(parseFloat(amount)) : ''}`}</button>
        )}
      </div>
    </div>
  );
}

// ── Home Screen ───────────────────────────────────────────────
function NimbusHome({ state, onOpenApp, onAdmin }) {
  const [showDeposit, setShowDeposit] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: N.text, letterSpacing: '-0.5px' }}>
            Good morning 👋
          </div>
          <div style={{ fontSize: 13, color: N.muted, marginTop: 2 }}>Your DeFi, simplified.</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowDeposit(true)} style={{
            padding: '9px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#4a8fff,#9d6fff)', color: '#fff', fontSize: 13, fontWeight: 700,
          }}>+ Add Funds</button>
          <button style={{ padding: '9px 16px', borderRadius: 12, border: '1px solid ' + N.border2, background: N.glass, color: N.muted2, fontSize: 13, cursor: 'pointer' }}>↗ Withdraw</button>
        </div>
      </div>

      {/* Portfolio card */}
      <PortfolioCard state={state} />

      {/* Apps section */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: N.text }}>Apps</div>
          <div style={{ fontSize: 12, color: N.muted, marginTop: 2 }}>DeFi protocols, simplified</div>
        </div>
        <button onClick={() => onAdmin()} style={{ background: 'none', border: '1px solid ' + N.border, borderRadius: 8, padding: '4px 12px', color: N.muted, fontSize: 11, cursor: 'pointer' }}>⚙ Settings</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {APPS.map(app => (
          <AppTile key={app.id} app={app} onClick={() => onOpenApp(app.id)} />
        ))}
      </div>

      {/* Recent activity */}
      {state.txHistory.length > 0 && (
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: N.text, marginBottom: 14 }}>Recent Activity</div>
          <GlassCard style={{ padding: '8px 0' }}>
            {state.txHistory.slice(0, 5).map((tx, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: i < Math.min(4, state.txHistory.length - 1) ? '1px solid ' + N.border : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: N.text }}>{tx.type}</div>
                  <div style={{ fontSize: 11, color: N.muted }}>{tx.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: N.green }}>{tx.status}</div>
                  <div style={{ fontSize: 10, color: N.muted }}>{tx.time}</div>
                </div>
              </div>
            ))}
          </GlassCard>
        </div>
      )}

      {showDeposit && <DepositModal onClose={() => setShowDeposit(false)} />}
    </div>
  );
}

window.NimbusHome = NimbusHome;
window.GlassCard  = GlassCard;
window.N          = N;
window.fmtUsd     = fmtUsd;
