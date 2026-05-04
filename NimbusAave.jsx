// NimbusAave.jsx — Aave inside Nimbus (side-by-side supply + borrow, no wallet/gas)
const { useState, useEffect } = React;

const AAVE_SUPPLY = [
  { token: 'USDC',   apy: 30.23, collateral: true,  color: '#2775CA', letter: 'U', price: 1 },
  { token: 'AAVE',   apy: 0.00,  collateral: true,  color: '#B6509E', letter: 'A', price: 92 },
  { token: 'cbBTC',  apy: 0.02,  collateral: true,  color: '#F7931A', letter: '₿', price: 65000 },
  { token: 'weETH',  apy: 0.01,  collateral: true,  color: '#627EEA', letter: 'W', price: 3280 },
  { token: 'wstETH', apy: 0.01,  collateral: true,  color: '#00A3FF', letter: 'W', price: 3750 },
  { token: 'EURC',   apy: 2.57,  collateral: true,  color: '#2775CA', letter: 'E', price: 1.08 },
];

const AAVE_BORROW = [
  { token: 'USDC',  apy: 4.38, color: '#2775CA', letter: 'U', price: 1 },
  { token: 'EURC',  apy: 4.97, color: '#2775CA', letter: 'E', price: 1.08 },
  { token: 'cbBTC', apy: 0.75, color: '#F7931A', letter: '₿', price: 65000 },
];

function fmt(n, dec = 4) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  return x.toFixed(dec).replace(/\.?0+$/, '');
}

function TokCircle({ color, letter, size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, color: '#fff', fontWeight: 800, flexShrink: 0 }}>
      {letter}
    </div>
  );
}

// ── Supply Modal ──────────────────────────────────────────────
function AaveSupplyModal({ asset, state, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [err,    setErr]    = useState('');
  const num    = parseFloat(amount) || 0;
  const cash   = state.cashBalance || 0;
  const maxAmt = cash / (asset.price || 1);

  async function submit() {
    setErr('');
    if (num <= 0) return;
    const usdCost = num * (asset.price || 1);
    if (usdCost > cash) { setErr('Insufficient Nimbus balance'); return; }
    setPhase('processing');
    await NState.runTx(`Supplying ${num} ${asset.token} to Aave`, async () => {
      NState.setCashBalance(state.cashBalance - usdCost);
      NState.aaveSupply(asset.token, num);
      NState.addHistory({ type: 'Supply', desc: `${num} ${asset.token} → Aave (${asset.apy.toFixed(2)}% APY)`, status: 'Success' });
    });
    onSuccess(num, asset.token);
  }

  const yieldPerYear = num * (asset.price || 1) * asset.apy / 100;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#130d1e', border: '1px solid rgba(182,80,158,.25)', borderRadius: 20, padding: 28, width: 400, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TokCircle color={asset.color} letter={asset.letter} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: N.text, fontWeight: 800, fontSize: 16 }}>Supply {asset.token}</div>
            <div style={{ color: N.muted, fontSize: 11 }}>Aave v3 · Base · {asset.apy.toFixed(2)}% APY</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: N.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: N.muted }}>Amount ({asset.token})</span>
            <span style={{ fontSize: 11, color: N.muted }}>Available: {fmtUsd(cash)} cash</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', color: N.text, fontSize: 24, fontWeight: 700, outline: 'none' }} />
            <button onClick={() => setAmount(String(maxAmt))} style={{ background: 'rgba(182,80,158,.15)', border: 'none', borderRadius: 7, color: '#b6509e', fontSize: 10, padding: '3px 8px', cursor: 'pointer', fontWeight: 700 }}>MAX</button>
          </div>
          <div style={{ fontSize: 11, color: N.muted, marginTop: 6 }}>≈ {fmtUsd(num * (asset.price || 1))}</div>
        </div>

        {num > 0 && (
          <div style={{ background: 'rgba(46,204,142,.08)', border: '1px solid rgba(46,204,142,.2)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, color: N.muted, fontWeight: 700 }}>YIELD PREVIEW</div>
            {[
              ['APY',        `${asset.apy.toFixed(2)}%`],
              ['Per day',    fmtUsd(yieldPerYear / 365)],
              ['Per year',   fmtUsd(yieldPerYear)],
              ['Collateral', asset.collateral ? '✓ Yes' : '— No'],
            ].map(([k,v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: N.muted }}>{k}</span>
                <span style={{ color: k === 'APY' ? N.green : N.text, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        )}

        {err && <div style={{ background: 'rgba(232,64,96,.1)', border: '1px solid rgba(232,64,96,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: N.red }}>{err}</div>}

        <button onClick={submit} disabled={num <= 0 || phase !== 'idle'} style={{
          padding: 14, borderRadius: 12, border: 'none',
          cursor: num > 0 && phase === 'idle' ? 'pointer' : 'not-allowed',
          background: num > 0 && phase === 'idle' ? 'linear-gradient(135deg,#b6509e,#2ebac6)' : 'rgba(255,255,255,.06)',
          color: num > 0 && phase === 'idle' ? '#fff' : N.muted, fontSize: 14, fontWeight: 700,
        }}>
          {phase === 'processing' ? 'Supplying...' : num <= 0 ? 'Enter Amount' : `Supply ${asset.token}`}
        </button>
      </div>
    </div>
  );
}

// ── Borrow Modal ──────────────────────────────────────────────
function AaveBorrowModal({ asset, state, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [err,    setErr]    = useState('');
  const num = parseFloat(amount) || 0;

  const suppliedUsd = Object.entries(state.aaveSupplied || {}).reduce((s,[t,a]) => s + (AAVE_SUPPLY.find(x=>x.token===t)?.price||1)*a, 0);
  const borrowedUsd = Object.entries(state.aaveBorrowed || {}).reduce((s,[t,a]) => s + (AAVE_BORROW.find(x=>x.token===t)?.price||1)*a, 0);
  const availUsd    = Math.max(0, suppliedUsd * 0.75 - borrowedUsd);
  const availToken  = availUsd / (asset.price || 1);

  async function submit() {
    setErr('');
    if (num <= 0) return;
    if (suppliedUsd === 0) { setErr('Supply collateral first to enable borrowing'); return; }
    if (num > availToken)  { setErr('Exceeds borrowing capacity (75% LTV)'); return; }
    setPhase('processing');
    await NState.runTx(`Borrowing ${num} ${asset.token} from Aave`, async () => {
      NState.aaveBorrow(asset.token, num);
      NState.addHistory({ type: 'Borrow', desc: `${num} ${asset.token} ← Aave (${asset.apy.toFixed(2)}% APY)`, status: 'Success' });
    });
    onDone();
  }

  const hf = suppliedUsd > 0 && borrowedUsd + num * (asset.price||1) > 0
    ? (suppliedUsd * 0.825 / (borrowedUsd + num * (asset.price||1))).toFixed(2) : '—';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#130d1e', border: '1px solid rgba(232,64,96,.2)', borderRadius: 20, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TokCircle color={asset.color} letter={asset.letter} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: N.text, fontWeight: 800, fontSize: 16 }}>Borrow {asset.token}</div>
            <div style={{ color: N.muted, fontSize: 11 }}>Variable rate · {asset.apy.toFixed(2)}% APY</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: N.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: N.muted }}>Amount</span>
            <span style={{ fontSize: 11, color: N.muted }}>Max: {fmt(availToken)} {asset.token}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', color: N.text, fontSize: 24, fontWeight: 700, outline: 'none' }} />
            <button onClick={() => setAmount(String(availToken * 0.8))} style={{ background: 'rgba(232,64,96,.12)', border: 'none', borderRadius: 7, color: N.red, fontSize: 10, padding: '3px 8px', cursor: 'pointer', fontWeight: 700 }}>80%</button>
          </div>
          <div style={{ fontSize: 11, color: N.muted, marginTop: 6 }}>≈ {fmtUsd(num * (asset.price || 1))}</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['Borrow APY',       `${asset.apy.toFixed(2)}%`],
            ['Health Factor',    hf],
            ['Collateral',       fmtUsd(suppliedUsd)],
            ['Available (75%)',  fmtUsd(availUsd)],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: N.muted }}>{k}</span>
              <span style={{ color: k==='Borrow APY' ? N.red : N.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {err && <div style={{ background: 'rgba(232,64,96,.1)', border: '1px solid rgba(232,64,96,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: N.red }}>{err}</div>}

        <button onClick={submit} disabled={num <= 0 || phase !== 'idle'} style={{
          padding: 14, borderRadius: 12, border: 'none',
          cursor: num > 0 && phase === 'idle' ? 'pointer' : 'not-allowed',
          background: num > 0 && phase === 'idle' ? 'linear-gradient(135deg,#e84060,#b6509e)' : 'rgba(255,255,255,.06)',
          color: num > 0 && phase === 'idle' ? '#fff' : N.muted, fontSize: 14, fontWeight: 700,
        }}>
          {phase === 'processing' ? 'Borrowing...' : num <= 0 ? 'Enter Amount' : `Borrow ${asset.token}`}
        </button>
      </div>
    </div>
  );
}

// ── Supply success modal ──────────────────────────────────────
function AaveSuccessModal({ amount, token, apy, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#130d1e', border: '1px solid rgba(46,204,142,.25)', borderRadius: 24, padding: 40, width: 400, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <div style={{ color: N.text, fontWeight: 800, fontSize: 22 }}>Supplied!</div>
        <div style={{ color: N.green, fontSize: 15, fontWeight: 600 }}>{fmt(amount)} {token} earning {apy}% APY</div>
        <div style={{ color: N.muted, fontSize: 13, lineHeight: 1.8 }}>
          Your funds are now earning yield on Aave.<br/>
          No wallets, no gas, no bridges required.
        </div>
        <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 14, fontSize: 12, color: N.muted, textAlign: 'left', lineHeight: 2 }}>
          <div style={{ color: N.green }}>✓ Funds deployed to Aave v3</div>
          <div style={{ color: N.green }}>✓ Earning {apy}% APY on {token}</div>
          <div style={{ color: N.green }}>✓ Withdraw anytime</div>
          <div style={{ color: N.muted, marginTop: 8 }}>No gas fees paid · No wallet needed · No bridges crossed</div>
        </div>
        <button onClick={onClose} style={{ padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#b6509e,#2ebac6)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Done</button>
      </div>
    </div>
  );
}

// ── Main Aave screen ──────────────────────────────────────────
function NimbusAave({ state, onBack }) {
  const [supplyModal,  setSupplyModal]  = useState(null);
  const [borrowModal,  setBorrowModal]  = useState(null);
  const [successModal, setSuccessModal] = useState(null);

  const supplied    = state.aaveSupplied || {};
  const borrowed    = state.aaveBorrowed || {};
  const supUsd      = Object.entries(supplied).reduce((s,[t,a]) => s+(AAVE_SUPPLY.find(x=>x.token===t)?.price||1)*a, 0);
  const borUsd      = Object.entries(borrowed).reduce((s,[t,a]) => s+(AAVE_BORROW.find(x=>x.token===t)?.price||1)*a, 0);
  const netUsd      = supUsd - borUsd;
  const yieldPerDay = supUsd * 0.3023 / 365;
  const hf          = supUsd > 0 && borUsd > 0 ? (supUsd * 0.825 / borUsd).toFixed(2) : '—';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0e1016', color: N.text, fontFamily: 'inherit' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 50, borderBottom: '1px solid rgba(255,255,255,.06)', flexShrink: 0, gap: 14 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: N.muted, cursor: 'pointer', fontSize: 16 }}>←</button>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#b6509e,#2ebac6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff' }}>A</div>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Aave</span>
        <span style={{ background: 'rgba(46,186,198,.15)', color: '#2ebac6', fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 700 }}>V3 BASE</span>
        <div style={{ flex: 1 }} />
        {/* Stats */}
        {[
          ['Net Worth', fmtUsd(netUsd)],
          ['Supplied',  fmtUsd(supUsd)],
          ['Borrowed',  fmtUsd(borUsd)],
          ['Yield/day', yieldPerDay > 0 ? '+' + fmtUsd(yieldPerDay) : '$0.00'],
          hf !== '—' && ['Health', hf],
        ].filter(Boolean).map(([k,v]) => (
          <div key={k} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: N.muted }}>{k}</div>
            <div style={{ fontSize: 12, color: k === 'Yield/day' ? N.green : k === 'Health' && parseFloat(v) < 1.5 ? N.red : N.text, fontWeight: 700 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Your positions row */}
        {(Object.keys(supplied).length > 0 || Object.keys(borrowed).length > 0) && (
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Your supplies */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: N.text, marginBottom: 14 }}>Your Supplies</div>
              {Object.entries(supplied).filter(([,a])=>a>0).map(([tok, amt]) => {
                const a = AAVE_SUPPLY.find(x=>x.token===tok)||{apy:0,color:'#555',letter:tok[0],price:1};
                return (
                  <div key={tok} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <TokCircle color={a.color} letter={a.letter} size={24} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: N.text }}>{tok}</div>
                      <div style={{ fontSize: 10, color: N.muted }}>{fmt(amt)} · {fmtUsd(amt * (a.price||1))}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: N.green, fontWeight: 700 }}>{a.apy.toFixed(2)}%</div>
                      <button onClick={() => {
                        NState.aaveWithdraw(tok, amt);
                        NState.setCashBalance(state.cashBalance + amt * (a.price||1));
                        NState.addHistory({ type: 'Withdraw', desc: `${amt} ${tok} ← Aave`, status: 'Success' });
                      }} style={{ fontSize: 10, background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, color: N.muted, cursor: 'pointer', padding: '1px 7px', marginTop: 2 }}>Withdraw</button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Your borrows */}
            {Object.keys(borrowed).length > 0 && (
              <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: N.text, marginBottom: 14, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Your Borrows</span>
                  {hf !== '—' && <span style={{ fontSize: 11, color: parseFloat(hf) < 1.5 ? N.red : N.green }}>HF {hf}</span>}
                </div>
                {Object.entries(borrowed).filter(([,a])=>a>0).map(([tok, amt]) => {
                  const a = AAVE_BORROW.find(x=>x.token===tok)||{apy:0,color:'#555',letter:tok[0],price:1};
                  return (
                    <div key={tok} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                      <TokCircle color={a.color} letter={a.letter} size={24} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: N.text }}>{tok}</div>
                        <div style={{ fontSize: 10, color: N.muted }}>{fmt(amt)} · {fmtUsd(amt * (a.price||1))}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: N.red, fontWeight: 700 }}>{a.apy.toFixed(2)}%</div>
                        <button onClick={() => {
                          NState.aaveRepay(tok, amt);
                          NState.addHistory({ type: 'Repay', desc: `${amt} ${tok} → Aave`, status: 'Success' });
                        }} style={{ fontSize: 10, background: 'none', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, color: N.muted, cursor: 'pointer', padding: '1px 7px', marginTop: 2 }}>Repay</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Supply + Borrow tables side by side */}
        <div style={{ display: 'flex', gap: 16 }}>
          {/* Supply */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: N.text, marginBottom: 14 }}>Assets to Supply</div>
            {supUsd === 0 && (
              <div style={{ background: 'rgba(46,204,142,.07)', border: '1px solid rgba(46,204,142,.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: N.green, marginBottom: 12 }}>
                💡 Supply assets to start earning yield.
              </div>
            )}
            {AAVE_SUPPLY.map(asset => {
              const userBal = state.cashBalance / (asset.price || 1);
              return (
                <div key={asset.token} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <TokCircle color={asset.color} letter={asset.letter} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: N.text }}>{asset.token}</div>
                    <div style={{ fontSize: 10, color: N.muted }}>Max: {fmt(userBal, 2)} {asset.token}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 13, color: N.green, fontWeight: asset.token==='USDC'?800:400 }}>{asset.apy.toFixed(2)}%</div>
                    <div style={{ fontSize: 9, color: N.muted }}>APY</div>
                  </div>
                  <button onClick={() => setSupplyModal(asset)} style={{
                    background: 'rgba(46,186,198,.12)', border: '1px solid rgba(46,186,198,.25)',
                    borderRadius: 8, padding: '5px 14px', color: '#2ebac6',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  }}>Supply</button>
                </div>
              );
            })}
          </div>

          {/* Borrow */}
          <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: N.text }}>Assets to Borrow</span>
              {supUsd === 0 && <span style={{ fontSize: 10, color: N.muted, background: 'rgba(255,255,255,.06)', borderRadius: 5, padding: '2px 7px' }}>Supply first</span>}
            </div>
            {supUsd === 0 && (
              <div style={{ background: 'rgba(46,186,198,.06)', border: '1px solid rgba(46,186,198,.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#2ebac6', marginBottom: 12 }}>
                ℹ Supply collateral to unlock borrowing.
              </div>
            )}
            {AAVE_BORROW.map(asset => {
              const supplyUsd2 = Object.entries(supplied).reduce((s,[t,a])=>s+(AAVE_SUPPLY.find(x=>x.token===t)?.price||1)*a,0);
              const borrowUsd2 = Object.entries(borrowed).reduce((s,[t,a])=>s+(AAVE_BORROW.find(x=>x.token===t)?.price||1)*a,0);
              const avail = Math.max(0, (supplyUsd2 * 0.75 - borrowUsd2) / (asset.price||1));
              return (
                <div key={asset.token} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <TokCircle color={asset.color} letter={asset.letter} size={28} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: N.text }}>{asset.token}</div>
                    <div style={{ fontSize: 10, color: N.muted }}>Available: {avail > 0 ? fmt(avail,2) : '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right', marginRight: 12 }}>
                    <div style={{ fontSize: 13, color: N.red }}>{asset.apy.toFixed(2)}%</div>
                    <div style={{ fontSize: 9, color: N.muted }}>APY</div>
                  </div>
                  <button onClick={() => setBorrowModal(asset)} style={{
                    background: supUsd > 0 ? 'rgba(232,64,96,.12)' : 'rgba(255,255,255,.04)',
                    border: supUsd > 0 ? '1px solid rgba(232,64,96,.25)' : '1px solid rgba(255,255,255,.08)',
                    borderRadius: 8, padding: '5px 14px',
                    color: supUsd > 0 ? N.red : N.muted,
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    opacity: supUsd > 0 ? 1 : 0.5,
                  }}>Borrow</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modals */}
      {supplyModal && (
        <AaveSupplyModal asset={supplyModal} state={state} onClose={() => setSupplyModal(null)}
          onSuccess={(amt, tok) => {
            setSupplyModal(null);
            setSuccessModal({ amount: amt, token: tok, apy: AAVE_SUPPLY.find(x=>x.token===tok)?.apy || 0 });
          }} />
      )}
      {borrowModal && (
        <AaveBorrowModal asset={borrowModal} state={state} onClose={() => setBorrowModal(null)} onDone={() => setBorrowModal(null)} />
      )}
      {successModal && (
        <AaveSuccessModal {...successModal} onClose={() => setSuccessModal(null)} />
      )}
      {state.pendingTx && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#130d1e', border: '1px solid rgba(182,80,158,.25)', borderRadius: 16, padding: 28, textAlign: 'center', minWidth: 260 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
            <div style={{ color: N.text, fontWeight: 700, marginBottom: 6 }}>Processing</div>
            <div style={{ color: N.muted, fontSize: 12, marginBottom: 14 }}>{state.pendingTx.description}</div>
            <div style={{ background: 'rgba(255,255,255,.06)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg,#b6509e,#2ebac6)', borderRadius: 20, width: state.pendingTx.progress + '%', transition: 'width .1s linear' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.NimbusAave = NimbusAave;
