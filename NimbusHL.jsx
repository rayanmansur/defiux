// NimbusHL.jsx — Hyperliquid inside Nimbus (simplified 2-step deposit + trading UI)
const { useState, useEffect, useRef, useMemo } = React;

// Reuse N, GlassCard, fmtUsd from NimbusHome

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
  const pr = pmax - pmin, vmax = Math.max(...candles.map(c => c.v));
  const cw = W / candles.length;
  const px = p => pad.t + H * (1 - (p - pmin) / pr);
  const vx = v => 38 * (v / vmax);

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {[0,1,2,3,4,5].map(i => {
        const p = pmin + (pr * i / 5);
        return <g key={i}>
          <line x1={pad.l} x2={pad.l+W} y1={px(p)} y2={px(p)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={pad.l+W+4} y={px(p)+4} fill="rgba(255,255,255,0.3)" fontSize="9">{Math.round(p).toLocaleString()}</text>
        </g>;
      })}
      {candles.map((c, i) => {
        const x = pad.l + i * cw, mid = x + cw * 0.5;
        const up = c.c >= c.o, col = up ? '#2ecc8e' : '#e84060';
        const by = px(Math.max(c.o, c.c)), bh = Math.max(1, Math.abs(px(c.o) - px(c.c)));
        return <g key={i}>
          <line x1={mid} x2={mid} y1={px(c.h)} y2={px(c.l)} stroke={col} strokeWidth="1" />
          <rect x={x+cw*0.15} width={cw*0.7} y={by} height={bh} fill={col} opacity="0.9" />
          <rect x={x+cw*0.1} width={cw*0.8} y={height-pad.b-vx(c.v)} height={vx(c.v)} fill={col} opacity="0.25" />
        </g>;
      })}
      <line x1={pad.l} x2={pad.l+W} y1={px(last.c)} y2={px(last.c)} stroke={last.c>=last.o?'#2ecc8e':'#e84060'} strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
      <rect x={pad.l+W} y={px(last.c)-8} width={54} height={16} rx="3" fill={last.c>=last.o?'#2ecc8e':'#e84060'} />
      <text x={pad.l+W+4} y={px(last.c)+5} fill="#000" fontSize="9" fontWeight="700">{Math.round(last.c).toLocaleString()}</text>
    </svg>
  );
}

// ── Deposit/Withdraw modal ────────────────────────────────────
function HLFundModal({ state, mode, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [err,    setErr]    = useState('');

  const maxAmt = mode === 'deposit' ? state.cashBalance : state.hyperliquidBalance;
  const num    = parseFloat(amount) || 0;

  async function submit() {
    setErr('');
    if (num <= 0)      return;
    if (num > maxAmt)  { setErr('Insufficient balance'); return; }

    setPhase('processing');
    await NState.runTx(
      mode === 'deposit' ? `Depositing ${fmtUsd(num)} to Hyperliquid` : `Withdrawing ${fmtUsd(num)} from Hyperliquid`,
      async () => {
        if (mode === 'deposit') {
          NState.depositToHL(num);
          NState.addHistory({ type: 'Deposit', desc: `${fmtUsd(num)} → Hyperliquid`, status: 'Success' });
        } else {
          NState.withdrawFromHL(num);
          NState.addHistory({ type: 'Withdraw', desc: `${fmtUsd(num)} ← Hyperliquid`, status: 'Success' });
        }
      }
    );
    setPhase('done');
    setTimeout(() => onDone(), 600);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0d1020', border: '1px solid rgba(74,158,255,.25)', borderRadius: 20, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: N.text, fontWeight: 800, fontSize: 18 }}>{mode === 'deposit' ? 'Deposit to Hyperliquid' : 'Withdraw from Hyperliquid'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: N.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: N.muted }}>Amount (USDC)</span>
            <span style={{ fontSize: 11, color: N.muted }}>Available: {fmtUsd(maxAmt)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', color: N.text, fontSize: 26, fontWeight: 700, outline: 'none' }} />
            <button onClick={() => setAmount(String(maxAmt))} style={{ background: 'rgba(74,143,255,.15)', border: 'none', borderRadius: 7, color: N.blue, fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>MAX</button>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['From', mode === 'deposit' ? 'Nimbus Cash' : 'Hyperliquid'],
            ['To',   mode === 'deposit' ? 'Hyperliquid' : 'Nimbus Cash'],
            ['Fee',  '$0.00'],
            ['Time', 'Instant'],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: N.muted }}>{k}</span>
              <span style={{ color: N.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {err && <div style={{ background: 'rgba(232,64,96,.1)', border: '1px solid rgba(232,64,96,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: N.red }}>{err}</div>}
        {phase === 'processing' && <div style={{ textAlign: 'center', fontSize: 13, color: N.blue, padding: '8px 0' }}>⏳ Processing...</div>}

        <button onClick={submit} disabled={!num || phase !== 'idle'} style={{
          padding: 14, borderRadius: 12, border: 'none', cursor: num > 0 && phase === 'idle' ? 'pointer' : 'not-allowed',
          background: num > 0 && phase === 'idle' ? 'linear-gradient(135deg,#1a4080,#4a8fff)' : 'rgba(255,255,255,.06)',
          color: num > 0 && phase === 'idle' ? '#fff' : N.muted, fontSize: 14, fontWeight: 700,
        }}>{mode === 'deposit' ? 'Deposit' : 'Withdraw'}</button>
      </div>
    </div>
  );
}

// ── Order panel ───────────────────────────────────────────────
function HLOrderPanel({ state, onDeposit }) {
  const [tab,  setTab]  = useState('limit');
  const [side, setSide] = useState('long');
  const hlBal = state.hyperliquidBalance || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'rgba(255,255,255,.02)' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,.06)', padding: '0 10px', flexShrink: 0 }}>
        {['Market','Limit','Pro'].map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
            padding: '8px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 11,
            color: tab === t.toLowerCase() ? N.text : N.muted,
            borderBottom: tab === t.toLowerCase() ? '2px solid #4a9eff' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '8px 10px', flexShrink: 0 }}>
        {[['long','Buy / Long','#2ecc8e','#000'],['short','Sell / Short','#e84060','#fff']].map(([id,label,bg,fg]) => (
          <button key={id} onClick={() => setSide(id)} style={{
            flex: 1, padding: '7px', borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
            background: side === id ? bg : 'rgba(255,255,255,.06)', color: side === id ? fg : N.muted,
          }}>{label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 12px' }}>
        <div style={{ fontSize: 10, color: N.muted, padding: '4px 0' }}>Available: <span style={{ color: N.text, fontWeight: 600 }}>{fmtUsd(hlBal)}</span></div>
        {['Price (USDC)','Size'].map((label, i) => (
          <div key={label} style={{ marginTop: 8 }}>
            <div style={{ fontSize: 10, color: N.muted, marginBottom: 3 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.04)', borderRadius: 7 }}>
              <input placeholder={i === 0 ? '39151' : '0'} style={{ flex: 1, background: 'none', border: 'none', color: N.text, padding: '7px 8px', fontSize: 12, outline: 'none' }} />
              <span style={{ padding: '7px 8px', fontSize: 10, color: N.muted }}>USDC</span>
            </div>
          </div>
        ))}
        <div style={{ padding: '8px 0' }}>
          <input type="range" defaultValue={0} min={0} max={100} style={{ width: '100%', accentColor: '#4a9eff' }} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={onDeposit} style={{
            width: '100%', padding: 9, borderRadius: 9, border: '1px solid rgba(74,143,255,.3)', cursor: 'pointer',
            background: 'rgba(74,143,255,.08)', color: '#4a9eff', fontWeight: 700, fontSize: 11,
          }}>+ Add Funds</button>
          <button style={{
            width: '100%', padding: 11, borderRadius: 9, border: 'none',
            cursor: hlBal > 0 ? 'pointer' : 'not-allowed',
            background: hlBal > 0 ? (side === 'long' ? '#2ecc8e' : '#e84060') : 'rgba(255,255,255,.06)',
            color: hlBal > 0 ? '#000' : N.muted, fontWeight: 700, fontSize: 12,
          }}>{hlBal > 0 ? (side === 'long' ? 'Place Long' : 'Place Short') : 'Deposit to Trade'}</button>
        </div>
        <div style={{ marginTop: 8, fontSize: 9, color: N.muted, textAlign: 'center' }}>0.0450% / 0.0150%</div>
      </div>
    </div>
  );
}

// ── Main HL screen ────────────────────────────────────────────
function NimbusHL({ state, onBack }) {
  const [modal, setModal]   = useState(null); // 'deposit' | 'withdraw'
  const [chartW, setChartW] = useState(500);
  const ref = useRef(null);
  const [price, setPrice]   = useState(39074);

  useEffect(() => { const iv = setInterval(() => setPrice(p => +(p + (Math.random()-.49)*80).toFixed(1)), 1500); return ()=>clearInterval(iv); }, []);

  useEffect(() => {
    const ro = new ResizeObserver(e => { const w = e[0]?.contentRect.width; if (w) setChartW(w); });
    if (ref.current) ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const hlBal = state.hyperliquidBalance || 0;
  const cash  = state.cashBalance || 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0d0e11', color: N.text, fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 46, borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0, gap: 16 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: N.muted, cursor: 'pointer', fontSize: 16, padding: '4px 8px' }}>←</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 22, height: 22, background: '#4a9eff', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: '#000', fontSize: 12 }}>H</div>
          <span style={{ fontWeight: 800, fontSize: 14 }}>Hyperliquid</span>
        </div>
        <div style={{ fontSize: 12, color: '#2ecc8e', fontWeight: 700 }}>{price.toFixed(2)}</div>
        <span style={{ fontSize: 11, color: N.red }}>HYPE -1.46%</span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: N.muted }}>Balance: <span style={{ color: N.text, fontWeight: 700 }}>{fmtUsd(hlBal)}</span></div>
        <button onClick={() => setModal('deposit')} style={{ background: 'rgba(74,143,255,.12)', border: '1px solid rgba(74,143,255,.25)', borderRadius: 8, padding: '5px 14px', color: '#4a9eff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>+ Deposit</button>
        <button onClick={() => setModal('withdraw')} style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, padding: '5px 14px', color: N.muted2, fontSize: 11, cursor: 'pointer' }}>Withdraw</button>
      </div>

      {/* Pair header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '7px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0, overflowX: 'auto' }}>
        {[['HYPE-USDC',''],['Mark',price.toFixed(3)],['Oracle',(price*1.001).toFixed(3)],['24h Chg','-0.585/-1.46%'],['24h Vol','$215M'],['OI','$787M']].map(([k,v],i) => (
          <div key={k} style={{ flexShrink: 0 }}>
            {i === 0 ? <span style={{ color: N.text, fontWeight: 700, fontSize: 13 }}>{k} <span style={{ background: 'rgba(255,255,255,.1)', borderRadius: 4, fontSize: 9, padding: '1px 5px' }}>10x</span></span>
            : <><div style={{ fontSize: 9, color: N.muted }}>{k}</div><div style={{ fontSize: 11, color: i===3?N.red:N.text, fontWeight: 600 }}>{v}</div></>}
          </div>
        ))}
      </div>

      {/* Chart + Order panel */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div ref={ref} style={{ flex: 1, overflow: 'hidden', minWidth: 0, borderRight: '1px solid rgba(255,255,255,.06)' }}>
          <CandlestickChart width={chartW} height={280} />
          <div style={{ padding: '4px 14px', fontSize: 9, color: N.muted, borderTop: '1px solid rgba(255,255,255,.06)' }}>5y 1y 6m 3m 1m 5d 1d</div>
        </div>
        <div style={{ width: 200, flexShrink: 0 }}>
          <HLOrderPanel state={state} onDeposit={() => setModal('deposit')} />
        </div>
      </div>

      {/* Positions bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '8px 16px', fontSize: 11, color: N.muted, flexShrink: 0 }}>
        No open positions
      </div>

      {/* No-funds nudge */}
      {hlBal === 0 && cash > 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(13,14,17,.95)', border: '1px solid rgba(74,143,255,.25)', borderRadius: 16, padding: 28, textAlign: 'center', maxWidth: 320, zIndex: 10 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: N.text, marginBottom: 8 }}>Start Trading</div>
          <div style={{ fontSize: 12, color: N.muted, marginBottom: 18, lineHeight: 1.6 }}>Deposit from your Nimbus balance to start trading on Hyperliquid. No wallet, no gas, no bridges.</div>
          <button onClick={() => setModal('deposit')} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#1a4080,#4a8fff)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Deposit Now</button>
        </div>
      )}

      {modal && <HLFundModal state={state} mode={modal} onClose={() => setModal(null)} onDone={() => setModal(null)} />}
      {state.pendingTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#0d0e11', border: '1px solid rgba(74,143,255,.25)', borderRadius: 16, padding: 28, textAlign: 'center', minWidth: 260 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div style={{ color: N.text, fontWeight: 700, marginBottom: 6 }}>Processing</div>
            <div style={{ color: N.muted, fontSize: 12, marginBottom: 14 }}>{state.pendingTx.description}</div>
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#4a9eff,#9d6fff)', borderRadius: 20, width: state.pendingTx.progress + '%', transition: 'width .1s linear' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.NimbusHL = NimbusHL;
