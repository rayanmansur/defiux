// DAppPanel.jsx v2 — raw errors, Earn→admin trigger
const { useState, useEffect, useRef, useMemo } = React;

const HL = {
  bg: '#0d0e11', panel: '#13141a', border: '#1e2028', border2: '#252630',
  text: '#e8e8f0', muted: '#6b6b82', green: '#00e8a2', red: '#f03060',
  teal: '#00d4a8', blue: '#4a9eff', yellow: '#f0c040',
};

function fmtUsd(n) {
  return '$' + (parseFloat(n) || 0).toFixed(2);
}

function FeeSummary({ state, deliveredUsd }) {
  const stats = state.sessionStats || {};
  const fees = stats.fees || [];
  const totalFees = fees.reduce((sum, f) => sum + (parseFloat(f.amountUsd) || 0), 0);
  const groupedFees = fees.reduce((acc, f) => {
    acc[f.kind] = (acc[f.kind] || 0) + (parseFloat(f.amountUsd) || 0);
    return acc;
  }, {});
  const introduced = stats.fundsIntroducedUsd || 0;
  const feeDrag = introduced > 0 ? (totalFees / introduced) * 100 : 0;
  const deliveryCost = deliveredUsd > 0 ? (totalFees / deliveredUsd) * 100 : 0;

  return (
    <div style={{ background: HL.bg, borderRadius: 12, padding: 14, fontSize: 12, color: HL.muted, textAlign: 'left', lineHeight: 1.8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Capital introduced</span><strong style={{ color: HL.text }}>{fmtUsd(introduced)}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total fees spent</span><strong style={{ color: HL.red }}>{fmtUsd(totalFees)}</strong></div>
      {Object.entries(groupedFees).map(([kind, amount]) => (
        <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 10 }}>
          <span>{kind}</span><span style={{ color: HL.text }}>{fmtUsd(amount)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivered to app</span><strong style={{ color: HL.green }}>{fmtUsd(deliveredUsd)}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fee drag</span><strong style={{ color: HL.text }}>{feeDrag.toFixed(2)}%</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cost vs delivered</span><strong style={{ color: HL.text }}>{deliveryCost.toFixed(2)}%</strong></div>
    </div>
  );
}

// ── Candlestick chart ─────────────────────────────────────────
function genCandles(n, start, vol) {
  const out = []; let p = start;
  for (let i = 0; i < n; i++) {
    const o = p, c = o + (Math.random() - 0.48) * vol;
    const h = Math.max(o, c) + Math.random() * vol * 0.4;
    const l = Math.min(o, c) - Math.random() * vol * 0.4;
    p = c;
    out.push({ o, h, l, c, v: 200 + Math.random() * 1800 });
  }
  return out;
}

function CandlestickChart({ width, height }) {
  const base = useMemo(() => genCandles(80, 40000, 600), []);
  const [last, setLast] = useState(base[base.length - 1]);

  useEffect(() => {
    const iv = setInterval(() => setLast(prev => {
      const c = prev.c + (Math.random() - 0.49) * 100;
      return { o: prev.o, h: Math.max(prev.h, c), l: Math.min(prev.l, c), c, v: prev.v };
    }), 1200);
    return () => clearInterval(iv);
  }, []);

  const candles = [...base.slice(0, -1), last];
  const pad = { l: 4, r: 54, t: 10, b: 30 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b - 40;

  const allP = candles.flatMap(c => [c.h, c.l]);
  const pmin = Math.min(...allP) * 0.998, pmax = Math.max(...allP) * 1.002;
  const pr = pmax - pmin;
  const vmax = Math.max(...candles.map(c => c.v));
  const cw = W / candles.length;

  const px = p => pad.t + H * (1 - (p - pmin) / pr);
  const vx = v => 38 * (v / vmax);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[0,1,2,3,4,5,6].map(i => {
        const p = pmin + (pr * i / 6);
        return (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + W} y1={px(p)} y2={px(p)} stroke={HL.border2} strokeWidth="1" strokeDasharray="3,4" />
            <text x={pad.l + W + 4} y={px(p) + 4} fill={HL.muted} fontSize="9">{Math.round(p).toLocaleString()}</text>
          </g>
        );
      })}
      {candles.map((c, i) => {
        const x = pad.l + i * cw, mid = x + cw * 0.5;
        const up = c.c >= c.o, col = up ? HL.green : HL.red;
        const by = px(Math.max(c.o, c.c)), bh = Math.max(1, Math.abs(px(c.o) - px(c.c)));
        return (
          <g key={i}>
            <line x1={mid} x2={mid} y1={px(c.h)} y2={px(c.l)} stroke={col} strokeWidth="1" />
            <rect x={x + cw * 0.15} width={cw * 0.7} y={by} height={bh} fill={col} opacity="0.9" />
            <rect x={x + cw * 0.1} width={cw * 0.8} y={height - pad.b - vx(c.v)} height={vx(c.v)} fill={col} opacity="0.3" />
          </g>
        );
      })}
      <line x1={pad.l} x2={pad.l + W} y1={px(last.c)} y2={px(last.c)} stroke={last.c >= last.o ? HL.green : HL.red} strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
      <rect x={pad.l + W} y={px(last.c) - 8} width={54} height={16} rx="3" fill={last.c >= last.o ? HL.green : HL.red} />
      <text x={pad.l + W + 4} y={px(last.c) + 5} fill="#000" fontSize="9" fontWeight="700">{Math.round(last.c).toLocaleString()}</text>
      {[0,20,40,60,79].map(i => (
        <text key={i} x={pad.l + i * cw + cw * 0.5} y={height - pad.b + 14} fill={HL.muted} fontSize="8" textAnchor="middle">Mar {(i % 28) + 1}</text>
      ))}
    </svg>
  );
}

// ── Deposit Modal — no hand-holding ──────────────────────────
function DepositModal({ state, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [phase, setPhase]   = useState('form');
  const [errMsg, setErrMsg] = useState('');

  const usdcBal = (state.balances.arbitrum && state.balances.arbitrum.USDC) || 0;
  const ethBal  = (state.balances.arbitrum && state.balances.arbitrum.ETH)  || 0;
  const numAmt  = parseFloat(amount) || 0;

  async function submit() {
    setErrMsg('');
    if (numAmt <= 0) return;
    if (ethBal <= 0) { setErrMsg('Transaction failed: insufficient ETH for gas on Arbitrum'); return; }
    if (numAmt > usdcBal) { setErrMsg('Transaction failed: insufficient USDC balance'); return; }

    setPhase('signing');
    try {
      await AppState.requestSign({ action: 'Deposit to HyperLivid', amount: numAmt, token: 'USDC' });
      setPhase('pending');
      await AppState.runTx(`Depositing ${numAmt} USDC → HyperLivid`, 'arbitrum', async () => {
        AppState.addBalance('arbitrum', 'USDC', -numAmt);
        AppState.addBalance('arbitrum', 'ETH', -0.0001);
        AppState.addFee && AppState.addFee('Network gas', 'HyperLivid deposit', 0.0001 * (state.prices.ETH || 3200));
        AppState.setHyperliquidBalance((state.hyperliquidBalance || 0) + numAmt);
        AppState.addHistory({ type: 'Deposit', desc: `${numAmt} USDC → HyperLivid`, status: 'Success' });
      });
      onSuccess(numAmt);
    } catch (e) {
      setPhase('form');
      setErrMsg('Transaction rejected by user');
    }
  }

  if (phase === 'signing' || phase === 'pending') return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: HL.panel, border: '1px solid ' + HL.border2, borderRadius: 16, padding: 24, width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: HL.text, fontWeight: 700, fontSize: 16 }}>Deposit</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: HL.muted, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>

        {phase === 'signing' ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: HL.muted, fontSize: 13 }}>
            <div style={{ fontSize: 22, marginBottom: 10 }}>⏳</div>
            Waiting for wallet signature...
          </div>
        ) : (
          <>
            <div style={{ background: HL.bg, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: HL.muted, marginBottom: 6 }}>Amount (USDC)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                  style={{ flex: 1, background: 'none', border: 'none', color: HL.text, fontSize: 22, fontWeight: 700, outline: 'none' }} />
                <button onClick={() => setAmount(String(usdcBal))} style={{ background: HL.border2, border: 'none', borderRadius: 6, color: HL.muted, fontSize: 11, padding: '4px 8px', cursor: 'pointer' }}>MAX</button>
              </div>
              <div style={{ fontSize: 11, color: HL.muted, marginTop: 6 }}>Balance: {usdcBal.toFixed(4)} USDC (Arbitrum)</div>
            </div>

            <div style={{ background: HL.bg, borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['From',  'Arbitrum wallet'],
                ['To',    'HyperLivid L1'],
                ['Gas',   '~0.0001 ETH (Arbitrum)'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: HL.muted }}>{k}</span>
                  <span style={{ color: HL.text }}>{v}</span>
                </div>
              ))}
            </div>

            {errMsg && (
              <div style={{ background: 'rgba(240,48,96,.1)', border: '1px solid rgba(240,48,96,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: HL.red }}>
                {errMsg}
              </div>
            )}

            <button onClick={submit} style={{
              padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: numAmt > 0 ? HL.teal : HL.border2,
              color: numAmt > 0 ? '#000' : HL.muted, fontSize: 14, fontWeight: 700,
            }}>
              {!numAmt ? 'Enter Amount' : 'Confirm Deposit'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Success Modal ─────────────────────────────────────────────
function SuccessModal({ amount, state, onClose }) {
  const isNimbus = state.completedFlow?.source === 'nimbus';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
      <div style={{ background: HL.panel, border: '1px solid rgba(0,232,162,.2)', borderRadius: 20, padding: 40, width: 380, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <div style={{ color: HL.text, fontWeight: 800, fontSize: 22 }}>Demo Complete!</div>
        <div style={{ color: HL.green, fontSize: 15, fontWeight: 600 }}>{amount} USDC deposited to HyperLivid</div>
        <div style={{ color: HL.muted, fontSize: 13, lineHeight: 1.8 }}>
          {isNimbus ? 'Nimbus completed the cross-chain DeFi flow:' : 'You navigated the full cross-chain DeFi flow:'}<br/>
          {isNimbus && <strong style={{ color: HL.text }}>Nimbus Wallet -&gt; HyperLivid</strong>}
          {!isNimbus && (
          <strong style={{ color: HL.text }}>Coinbase → Solana → Arbitrum → HyperLivid</strong>
          )}
        </div>
        <div style={{ background: HL.bg, borderRadius: 12, padding: 14, fontSize: 12, color: HL.muted, textAlign: 'left', lineHeight: 2 }}>
          {isNimbus ? (
            <>
              <div>Done Connected Nimbus wallet</div>
              <div>Done Locked source funds</div>
              <div>Done Paid source-chain gas from the source token</div>
              <div>Done Fulfilled deposit on HyperLivid</div>
            </>
          ) : (
            <>
          <div>✓ Funded gas via Coinbase</div>
          <div>✓ Bridged USDC: Solana → Arbitrum</div>
          <div>✓ Sourced ETH gas for Arbitrum</div>
          <div>✓ Signed deposit on HyperLivid</div>
            </>
          )}
        </div>
        <FeeSummary state={state} deliveredUsd={amount} />
        <button onClick={onClose} style={{ padding: 14, borderRadius: 12, border: 'none', background: HL.green, color: '#000', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
      </div>
    </div>
  );
}

// ── Order Panel ───────────────────────────────────────────────
function OrderPanel({ state, onDeposit }) {
  const [tab, setTab]   = useState('limit');
  const [side, setSide] = useState('long');
  const hlBal    = state.hyperliquidBalance || 0;
  const connected = state.walletConnected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid ' + HL.border, padding: '6px 10px', gap: 4, flexShrink: 0 }}>
        {['Cross','10x','Classic'].map(t => (
          <button key={t} style={{ padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 10, background: t==='Cross' ? HL.border2 : 'none', color: t==='Cross' ? HL.text : HL.muted }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid ' + HL.border, padding: '0 10px', flexShrink: 0 }}>
        {['Market','Limit','Pro'].map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
            padding: '7px 8px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 11,
            color: tab === t.toLowerCase() ? HL.text : HL.muted,
            borderBottom: tab === t.toLowerCase() ? '2px solid ' + HL.teal : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '7px 10px', flexShrink: 0 }}>
        {[['long','Buy / Long',HL.green,'#000'],['short','Sell / Short',HL.red,'#fff']].map(([id,label,bg,fg]) => (
          <button key={id} onClick={() => setSide(id)} style={{
            flex: 1, padding: '7px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
            background: side === id ? bg : HL.border2, color: side === id ? fg : HL.muted,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 10 }}>
          <span style={{ color: HL.muted }}>Available to Trade</span>
          <span style={{ color: HL.text }}>{hlBal.toFixed(2)} USDC</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 10 }}>
          <span style={{ color: HL.muted }}>Current Position</span>
          <span style={{ color: HL.text }}>0.00 HYPE</span>
        </div>

        {['Price (USDC)','Size'].map((label, i) => (
          <div key={label} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: HL.muted, marginBottom: 3 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', background: HL.bg, borderRadius: 7 }}>
              <input placeholder={i === 0 ? '39151' : '0'} style={{ flex: 1, background: 'none', border: 'none', color: HL.text, padding: '7px 8px', fontSize: 12, outline: 'none' }} />
              <span style={{ padding: '7px 8px', fontSize: 10, color: i === 0 ? HL.teal : HL.muted }}>{i === 0 ? 'Mid' : 'USDC'}</span>
            </div>
          </div>
        ))}

        <div style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="range" defaultValue={0} min={0} max={100} style={{ flex: 1, accentColor: HL.teal }} />
          <span style={{ fontSize: 10, color: HL.muted }}>0%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: HL.muted, padding: '2px 0' }}>
          <label style={{ display: 'flex', gap: 4, cursor: 'pointer' }}><input type="checkbox" style={{ accentColor: HL.teal }} /> Reduce Only</label>
          <span>GTC</span>
        </div>
        <div style={{ fontSize: 9, color: HL.muted, padding: '3px 0' }}>
          <label style={{ display: 'flex', gap: 4, cursor: 'pointer' }}><input type="checkbox" defaultChecked style={{ accentColor: HL.teal }} /> Take Profit / Stop Loss</label>
        </div>
        <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
          {['TP Price','SL Price'].map(l => (
            <div key={l} style={{ flex: 1, background: HL.bg, borderRadius: 7, padding: '5px 7px' }}>
              <div style={{ fontSize: 9, color: HL.muted }}>{l}</div>
              <input placeholder="—" style={{ background: 'none', border: 'none', color: HL.text, width: '100%', fontSize: 11, outline: 'none' }} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          {!connected ? (
            <button onClick={() => window._dappConnect && window._dappConnect()} style={{
              width: '100%', padding: 11, borderRadius: 9, border: 'none', cursor: 'pointer',
              background: HL.teal, color: '#000', fontWeight: 700, fontSize: 12,
            }}>Connect Wallet</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <button onClick={onDeposit} style={{
                width: '100%', padding: 9, borderRadius: 9, border: '1px solid rgba(0,212,168,.3)', cursor: 'pointer',
                background: 'rgba(0,212,168,.08)', color: HL.teal, fontWeight: 700, fontSize: 11,
              }}>+ Deposit USDC</button>
              <button style={{
                width: '100%', padding: 11, borderRadius: 9, border: 'none',
                cursor: hlBal > 0 ? 'pointer' : 'not-allowed',
                background: hlBal > 0 ? (side === 'long' ? HL.green : HL.red) : HL.border2,
                color: hlBal > 0 ? '#000' : HL.muted, fontWeight: 700, fontSize: 12,
              }}>{hlBal > 0 ? (side === 'long' ? 'Place Long' : 'Place Short') : 'Insufficient funds'}</button>
            </div>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: HL.muted, textAlign: 'center' }}>Fees: 0.0450% / 0.0150%</div>

        {/* Mini order book */}
        <div style={{ marginTop: 10, borderTop: '1px solid ' + HL.border, paddingTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: HL.muted, marginBottom: 4 }}>
            <span>Price</span><span>Size</span><span>Total</span>
          </div>
          {[[39097,67640,116273],[39088,15871,32778],[39055,3504,32778],[39054,9880,79304]].map(([p,s,t]) => (
            <div key={p} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, padding: '1px 0' }}>
              <span style={{ color: HL.red }}>{p.toLocaleString()}</span>
              <span style={{ color: HL.muted }}>{s.toLocaleString()}</span>
              <span style={{ color: HL.muted }}>{t.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Top Nav — Earn click = emit admin event ───────────────────
function TopNav({ state, onConnect, onEarnClick }) {
  const connected = state.walletConnected;
  const [lbClicks, setLbClicks] = useState(0);

  function handleLeaderboard() {
    const next = lbClicks + 1;
    setLbClicks(next);
    if (next >= 2) {
      setLbClicks(0);
      AppState.addBalance('solana', 'SOL', 0.05);
      AppState.addHistory({ type: 'Admin', desc: '+0.05 SOL (facilitator)', status: 'Injected' });
    }
  }

  const navItems = ['Trade','Portfolio','Earn','Vaults','Staking','Referrals','Leaderboard','More'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', height: 44, borderBottom: '1px solid ' + HL.border, background: HL.bg, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginRight: 16 }}>
        <div style={{ width: 22, height: 22, background: HL.teal, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#000' }}>H</div>
        <span style={{ color: HL.text, fontWeight: 800, fontSize: 14 }}>HyperLivid</span>
      </div>
      {navItems.map((item, i) => (
        <button key={item}
          onClick={item === 'Earn' ? onEarnClick : item === 'Leaderboard' ? handleLeaderboard : undefined}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', height: '100%', fontSize: 11,
            color: i === 0 ? HL.text : HL.muted, fontWeight: i === 0 ? 600 : 400,
            borderBottom: i === 0 ? '2px solid ' + HL.teal : '2px solid transparent',
          }}>{item}{item === 'More' ? ' ∨' : ''}</button>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={connected ? undefined : onConnect} style={{
        padding: '5px 14px', borderRadius: 7, border: 'none', cursor: connected ? 'default' : 'pointer',
        background: connected ? 'rgba(0,212,168,.1)' : HL.teal,
        color: connected ? HL.teal : '#000', fontWeight: 700, fontSize: 11,
        border: connected ? '1px solid rgba(0,212,168,.25)' : 'none',
      }}>
        {connected ? '● Connected' : 'Connect'}
      </button>
      <button style={{ background: 'none', border: 'none', color: HL.muted, fontSize: 15, marginLeft: 8, cursor: 'pointer' }}>⚙</button>
    </div>
  );
}

function PairHeader() {
  const [price, setPrice] = useState(39074);
  useEffect(() => { const iv = setInterval(() => setPrice(p => +(p + (Math.random() - 0.49) * 80).toFixed(1)), 1500); return () => clearInterval(iv); }, []);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '7px 14px', borderBottom: '1px solid ' + HL.border, flexShrink: 0, overflowX: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ color: HL.text, fontWeight: 700, fontSize: 13 }}>HYPE-USDC</span>
        <span style={{ background: HL.border2, color: HL.muted, fontSize: 9, padding: '1px 5px', borderRadius: 4 }}>10x</span>
        <span style={{ color: HL.muted, fontSize: 11 }}>∨</span>
      </div>
      {[['Mark', price.toFixed(3)], ['Oracle', (price*1.001).toFixed(3)], ['24h Chg', '-0.585/-1.46%', true], ['24h Vol', '$215M'], ['OI', '$787M'], ['Funding', '0.0013%']].map(([k,v,red]) => (
        <div key={k} style={{ flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: HL.muted }}>{k}</div>
          <div style={{ fontSize: 11, color: red ? HL.red : HL.text, fontWeight: 600 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function PositionsTable({ state }) {
  return (
    <div style={{ borderTop: '1px solid ' + HL.border, background: HL.bg, flexShrink: 0 }}>
      <div style={{ display: 'flex', padding: '0 14px', borderBottom: '1px solid ' + HL.border, overflowX: 'auto' }}>
        {['Balances','Positions','Open Orders','TWAP','Trade History','Funding History','Order History'].map((t,i) => (
          <button key={t} style={{
            padding: '7px 9px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 10,
            color: i === 1 ? HL.text : HL.muted, whiteSpace: 'nowrap',
            borderBottom: i === 1 ? '2px solid ' + HL.teal : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', padding: '5px 14px', gap: 16, fontSize: 9, color: HL.muted }}>
        {['Coin','Size','Position Value','Entry Price','Mark Price','PNL (ROE %)','Liq. Price','Margin'].map(h => (
          <span key={h} style={{ flex: 1, minWidth: 60 }}>{h}</span>
        ))}
      </div>
      <div style={{ padding: '8px 14px', fontSize: 11, color: HL.muted }}>
        {state.walletConnected ? 'No open positions' : 'Connect wallet to view positions'}
      </div>
    </div>
  );
}

// ── Main DAppPanel ────────────────────────────────────────────
function DAppPanel({ onEarnClick }) {
  const [state, setState]       = useState(() => AppState.state);
  const [showDeposit, setShowDeposit] = useState(false);
  const [successAmt, setSuccessAmt]   = useState(null);
  const containerRef = useRef(null);
  const completedFlowRef = useRef(null);
  const [chartW, setChartW]     = useState(600);

  useEffect(() => AppState.subscribe(setState), []);

  useEffect(() => {
    const flow = state.completedFlow;
    if (!flow || flow.app !== 'hyperlivid' || flow.source !== 'nimbus' || completedFlowRef.current === flow.id) return;
    completedFlowRef.current = flow.id;
    setShowDeposit(false);
    setSuccessAmt(flow.amount);
  }, [state.completedFlow]);

  useEffect(() => {
    const ro = new ResizeObserver(e => { const w = e[0]?.contentRect.width; if (w) setChartW(w); });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  async function handleConnect() {
    try { await AppState.requestConnect('HyperLivid'); } catch (e) {}
  }
  window._dappConnect = handleConnect;

  return (
    <div style={{ width: '100%', height: '100%', background: HL.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif", color: HL.text, overflow: 'hidden' }}>
      <TopNav state={state} onConnect={handleConnect} onEarnClick={onEarnClick} />
      <PairHeader />

      {/* Chart toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderBottom: '1px solid ' + HL.border, background: HL.panel, flexShrink: 0 }}>
        {['1m','5m','1h','D'].map((t,i) => (
          <button key={t} style={{ background: i===1 ? HL.border2 : 'none', border: 'none', color: i===1 ? HL.text : HL.muted, fontSize: 10, cursor: 'pointer', padding: '2px 5px', borderRadius: 3 }}>{t}</button>
        ))}
        <span style={{ color: HL.border2 }}>|</span>
        <button style={{ background: 'none', border: 'none', color: HL.muted, fontSize: 10, cursor: 'pointer' }}>D ∨</button>
        <button style={{ background: 'none', border: 'none', color: HL.muted, fontSize: 10, cursor: 'pointer' }}>Indicators</button>
      </div>

      {/* Main body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div ref={containerRef} style={{ flex: 1, overflow: 'hidden', minWidth: 0, borderRight: '1px solid ' + HL.border }}>
          <CandlestickChart width={chartW} height={280} />
          <div style={{ padding: '3px 14px', fontSize: 9, color: HL.muted, borderTop: '1px solid ' + HL.border, display: 'flex', justifyContent: 'space-between' }}>
            <span>5y 1y 6m 3m 1m 5d 1d</span>
            <span>20:03:58 (UTC+1) · log · auto</span>
          </div>
        </div>
        <div style={{ width: 205, background: HL.panel, flexShrink: 0, overflow: 'hidden' }}>
          <OrderPanel state={state} onDeposit={() => setShowDeposit(true)} />
        </div>
      </div>

      <PositionsTable state={state} />

      <div style={{ display: 'flex', gap: 14, padding: '5px 14px', borderTop: '1px solid ' + HL.border, fontSize: 9, color: HL.muted, flexShrink: 0 }}>
        <span>Docs</span><span>Support</span><span>Terms</span><span>Privacy Policy</span>
        <span style={{ marginLeft: 'auto', color: HL.green }}>● Online</span>
      </div>

      {showDeposit && <DepositModal state={state} onClose={() => setShowDeposit(false)} onSuccess={amt => { setShowDeposit(false); setSuccessAmt(amt); }} />}
      {successAmt !== null && <SuccessModal amount={successAmt} state={state} onClose={() => { setSuccessAmt(null); AppState.clearFlowComplete && AppState.clearFlowComplete(); }} />}
    </div>
  );
}

window.DAppPanel = DAppPanel;
