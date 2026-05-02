// AavePanel.jsx — Base Market, supply + borrow, wallet-signed transactions
var { useState, useEffect, useRef } = React;

const AV = {
  bg:      '#0e1016',
  panel:   '#14161e',
  panel2:  '#1a1d28',
  border:  '#252836',
  border2: '#2e3248',
  text:    '#e8eaf0',
  muted:   '#6b7090',
  muted2:  '#9498b0',
  purple:  '#b6509e',
  blue:    '#2ebac6',
  blueDim: '#1a3a4a',
  green:   '#46bc8c',
  red:     '#e84142',
  yellow:  '#f0c040',
  base:    '#0052ff',
  grad:    'linear-gradient(135deg, #b6509e 0%, #2ebac6 100%)',
};

// ── Supply assets on Base ─────────────────────────────────────
const SUPPLY_ASSETS = [
  { token: 'USDC',   apy: 30.23, collateral: true,  color: '#2775CA', letter: 'U' },
  { token: 'cbBTC',  apy: 0.02, collateral: true,  color: '#F7931A', letter: '₿' },
  { token: 'weETH',  apy: 0.01, collateral: true,  color: '#627EEA', letter: 'W', extra: '3x' },
  { token: 'wstETH', apy: 0.01, collateral: true,  color: '#00A3FF', letter: 'W' },
  { token: 'EURC',   apy: 2.57, collateral: true,  color: '#2775CA', letter: 'E' },
  { token: 'cbETH',  apy: 0.07, collateral: true,  color: '#0052FF', letter: 'C' },
  { token: 'GHO',    apy: 3.28, collateral: false, color: '#8BC34A', letter: 'G' },
  { token: 'AAVE',   apy: 0.00, collateral: true,  color: '#B6509E', letter: 'A' },
  { token: 'ezETH',  apy: 0.00, collateral: true,  color: '#6DB33F', letter: 'Z' },
];

const BORROW_ASSETS = [
  { token: 'USDC',  apy: 4.38, color: '#2775CA', letter: 'U' },
  { token: 'cbBTC', apy: 0.75, color: '#F7931A', letter: '₿' },
  { token: 'EURC',  apy: 4.97, color: '#2775CA', letter: 'E' },
  { token: 'GHO',   apy: 4.31, color: '#8BC34A', letter: 'G' },
];

function fmt(n, dec = 4) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  if (x < 0.0001 && x > 0) return '<0.0001';
  return x.toFixed(dec).replace(/\.?0+$/, '');
}
function fmtUsd(n) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '$0.00';
  return '$' + x.toFixed(2);
}
function usdVal(prices, token, amt) {
  return (prices[token] || 1) * amt;
}

// ── Token icon ────────────────────────────────────────────────
function aaveTokenIconSrc(color, letter) {
  const label = String(letter || '?').slice(0, 2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${color}"/><circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"/><text x="32" y="38" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="${label.length > 1 ? 20 : 27}" font-weight="800" fill="white">${label}</text></svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

function AaveTokIcon({ color, letter, size = 28 }) {
  return (
    <img
      src={aaveTokenIconSrc(color, letter)}
      alt=""
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', flexShrink: 0 }}
    />
  );
}

// ── Supply Modal ──────────────────────────────────────────────
function SupplyModal({ asset, state, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('form'); // form | signing | pending | done
  const [err,    setErr]    = useState('');

  const walletBal = (state.balances.base && state.balances.base[asset.token]) || 0;
  const ethBal    = (state.balances.base && state.balances.base.ETH) || 0;
  const numAmt    = parseFloat(amount) || 0;

  async function submit() {
    setErr('');
    if (numAmt <= 0) return;
    if (!state.walletConnected) { setErr('Connect wallet before supplying'); return; }
    if (ethBal <= 0)       { setErr('Transaction failed: insufficient ETH for gas on Base'); return; }
    if (numAmt > walletBal){ setErr(`Transaction failed: insufficient ${asset.token} balance`); return; }

    setPhase('signing');
    try {
      await AppState.requestSign({
        action: `Supply ${asset.token} to Waave`,
        amount: numAmt,
        token: asset.token,
        protocol: 'Waave v3 · Base',
      });
      setPhase('pending');
      await AppState.runTx(`Supplying ${numAmt} ${asset.token} to Waave (Base)`, 'base', async () => {
        AppState.addBalance('base', asset.token, -numAmt);
        AppState.addBalance('base', 'ETH', -0.00008);
        AppState.addFee && AppState.addFee('Network gas', 'Waave supply', 0.00008 * (state.prices.ETH || 3200));
        AppState.aaveSupply(asset.token, numAmt);
        AppState.addHistory({ type: 'Supply', desc: `${numAmt} ${asset.token} → Waave Base`, status: 'Success' });
      });
      onSuccess(numAmt, asset.token);
    } catch (e) {
      setPhase('form');
      setErr('Transaction rejected');
    }
  }

  if (phase === 'signing' || phase === 'pending') return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: AV.panel, border: '1px solid ' + AV.border2, borderRadius: 18, padding: 28, width: 400, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AaveTokIcon color={asset.color} letter={asset.letter} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: AV.text, fontWeight: 700, fontSize: 16 }}>Supply {asset.token}</div>
            <div style={{ color: AV.muted, fontSize: 11 }}>Waave v3 · Base Market</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: AV.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        {/* Amount input */}
        <div style={{ background: AV.bg, borderRadius: 12, padding: 16, border: '1px solid ' + AV.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: AV.muted }}>Amount</span>
            <span style={{ fontSize: 11, color: AV.muted }}>Wallet: {fmt(walletBal)} {asset.token}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', color: AV.text, fontSize: 24, fontWeight: 700, outline: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
              <button onClick={() => setAmount(String(walletBal * 0.5))} style={{ background: AV.border2, border: 'none', borderRadius: 5, color: AV.muted2, fontSize: 10, padding: '2px 7px', cursor: 'pointer' }}>50%</button>
              <button onClick={() => setAmount(String(walletBal))} style={{ background: AV.border2, border: 'none', borderRadius: 5, color: AV.muted2, fontSize: 10, padding: '2px 7px', cursor: 'pointer' }}>MAX</button>
            </div>
          </div>
          <div style={{ fontSize: 11, color: AV.muted, marginTop: 6 }}>
            ≈ {fmtUsd(usdVal(state.prices, asset.token, numAmt))}
          </div>
        </div>

        {/* Tx overview */}
        <div style={{ background: AV.bg, borderRadius: 12, padding: 14, border: '1px solid ' + AV.border, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: AV.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Transaction overview</div>
          {[
            ['Supply APY',   `${asset.apy.toFixed(2)}%`],
            ['Collateral',   asset.collateral ? '✓ Yes' : '— No'],
            ['Network',      'Base'],
            ['Gas',          ethBal > 0 ? `~0.00008 ETH (${fmtUsd(0.00008 * 3200)})` : '0 ETH — required'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: AV.muted }}>{k}</span>
              <span style={{ color: v.includes('required') ? AV.red : v.includes('✓') ? AV.green : AV.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {err && (
          <div style={{ background: 'rgba(232,65,66,.1)', border: '1px solid rgba(232,65,66,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.red }}>
            {err}
          </div>
        )}

        {ethBal <= 0 && (
          <div style={{ background: 'rgba(240,192,64,.07)', border: '1px solid rgba(240,192,64,.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.yellow }}>
            ⚠ No ETH on Base for gas fees
          </div>
        )}

        <button onClick={submit} disabled={numAmt <= 0} style={{
          padding: 14, borderRadius: 12, border: 'none',
          cursor: numAmt > 0 ? 'pointer' : 'not-allowed',
          background: numAmt > 0 ? AV.grad : AV.border2,
          color: numAmt > 0 ? '#fff' : AV.muted,
          fontSize: 14, fontWeight: 700,
        }}>
          {numAmt <= 0 ? 'Enter Amount' : `Supply ${asset.token}`}
        </button>
      </div>
    </div>
  );
}

// ── Borrow Modal ──────────────────────────────────────────────
function BorrowModal({ asset, state, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('form');
  const [err,    setErr]    = useState('');

  const totalSuppliedUsd = Object.entries(state.aaveSupplied || {}).reduce((sum, [tok, amt]) =>
    sum + usdVal(state.prices, tok, amt), 0);
  const maxBorrowUsd = totalSuppliedUsd * 0.75; // 75% LTV
  const alreadyBorrowedUsd = Object.entries(state.aaveBorrowed || {}).reduce((sum, [tok, amt]) =>
    sum + usdVal(state.prices, tok, amt), 0);
  const availableBorrowUsd = Math.max(0, maxBorrowUsd - alreadyBorrowedUsd);
  const availableToken = availableBorrowUsd / (state.prices[asset.token] || 1);

  const ethBal = (state.balances.base && state.balances.base.ETH) || 0;
  const numAmt = parseFloat(amount) || 0;

  async function submit() {
    setErr('');
    if (numAmt <= 0) return;
    if (!state.walletConnected) { setErr('Connect wallet before borrowing'); return; }
    if (totalSuppliedUsd === 0) { setErr('Transaction failed: supply collateral first to enable borrowing'); return; }
    if (ethBal <= 0)            { setErr('Transaction failed: insufficient ETH for gas on Base'); return; }
    if (numAmt > availableToken){ setErr('Transaction failed: exceeds borrowing capacity'); return; }

    setPhase('signing');
    try {
      await AppState.requestSign({
        action: `Borrow ${asset.token} from Waave`,
        amount: numAmt,
        token: asset.token,
        protocol: 'Waave v3 · Base',
      });
      setPhase('pending');
      await AppState.runTx(`Borrowing ${numAmt} ${asset.token} from Waave (Base)`, 'base', async () => {
        AppState.addBalance('base', asset.token, numAmt);
        AppState.addBalance('base', 'ETH', -0.00008);
        AppState.addFee && AppState.addFee('Network gas', 'Waave borrow', 0.00008 * (state.prices.ETH || 3200));
        AppState.aaveBorrow(asset.token, numAmt);
        AppState.addHistory({ type: 'Borrow', desc: `${numAmt} ${asset.token} ← Waave Base`, status: 'Success' });
      });
      onSuccess(numAmt, asset.token);
    } catch (e) {
      setPhase('form');
      setErr('Transaction rejected');
    }
  }

  if (phase === 'signing' || phase === 'pending') return null;

  const healthFactor = totalSuppliedUsd > 0
    ? ((totalSuppliedUsd * 0.825) / Math.max(0.01, alreadyBorrowedUsd + numAmt * (state.prices[asset.token] || 1))).toFixed(2)
    : '—';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: AV.panel, border: '1px solid ' + AV.border2, borderRadius: 18, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AaveTokIcon color={asset.color} letter={asset.letter} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ color: AV.text, fontWeight: 700, fontSize: 16 }}>Borrow {asset.token}</div>
            <div style={{ color: AV.muted, fontSize: 11 }}>Variable rate · Waave v3 · Base</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: AV.muted, fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: AV.bg, borderRadius: 12, padding: 16, border: '1px solid ' + AV.border }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: AV.muted }}>Amount</span>
            <span style={{ fontSize: 11, color: AV.muted }}>Available: {fmt(availableToken)} {asset.token}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              style={{ flex: 1, background: 'none', border: 'none', color: AV.text, fontSize: 24, fontWeight: 700, outline: 'none' }} />
            <button onClick={() => setAmount(String(availableToken * 0.8))} style={{ background: AV.border2, border: 'none', borderRadius: 5, color: AV.muted2, fontSize: 10, padding: '3px 8px', cursor: 'pointer' }}>80%</button>
          </div>
          <div style={{ fontSize: 11, color: AV.muted, marginTop: 6 }}>≈ {fmtUsd(usdVal(state.prices, asset.token, numAmt))}</div>
        </div>

        <div style={{ background: AV.bg, borderRadius: 12, padding: 14, border: '1px solid ' + AV.border, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: AV.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Transaction overview</div>
          {[
            ['Borrow APY (variable)', `${asset.apy.toFixed(2)}%`],
            ['Health Factor',         healthFactor],
            ['Collateral supplied',   fmtUsd(totalSuppliedUsd)],
            ['Max borrow (75% LTV)',  fmtUsd(maxBorrowUsd)],
            ['Gas',                   ethBal > 0 ? `~0.00008 ETH` : '0 ETH — required'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: AV.muted }}>{k}</span>
              <span style={{ color: v.includes('required') ? AV.red : AV.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {err && (
          <div style={{ background: 'rgba(232,65,66,.1)', border: '1px solid rgba(232,65,66,.3)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.red }}>{err}</div>
        )}

        <button onClick={submit} disabled={numAmt <= 0} style={{
          padding: 14, borderRadius: 12, border: 'none',
          cursor: numAmt > 0 ? 'pointer' : 'not-allowed',
          background: numAmt > 0 ? AV.grad : AV.border2,
          color: numAmt > 0 ? '#fff' : AV.muted,
          fontSize: 14, fontWeight: 700,
        }}>
          {numAmt <= 0 ? 'Enter Amount' : `Borrow ${asset.token}`}
        </button>
      </div>
    </div>
  );
}

// ── Success Toast ─────────────────────────────────────────────
function SuccessToast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: AV.panel, border: '1px solid ' + AV.green + '55', borderRadius: 12,
      padding: '12px 24px', fontSize: 13, color: AV.green, fontWeight: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,.6)', zIndex: 200, whiteSpace: 'nowrap',
    }}>
      ✓ {msg}
    </div>
  );
}

// ── Supply Success Modal ───────────────────────────────────────
function AaveFeeSummary({ state, deliveredUsd }) {
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
    <div style={{ background: AV.bg, borderRadius: 12, padding: 14, fontSize: 12, color: AV.muted, textAlign: 'left', lineHeight: 1.8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Capital introduced</span><strong style={{ color: AV.text }}>{fmtUsd(introduced)}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total fees spent</span><strong style={{ color: AV.red }}>{fmtUsd(totalFees)}</strong></div>
      {Object.entries(groupedFees).map(([kind, amount]) => (
        <div key={kind} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 10 }}>
          <span>{kind}</span><span style={{ color: AV.text }}>{fmtUsd(amount)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Supplied to Waave</span><strong style={{ color: AV.green }}>{fmtUsd(deliveredUsd)}</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fee drag</span><strong style={{ color: AV.text }}>{feeDrag.toFixed(2)}%</strong></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cost vs supplied</span><strong style={{ color: AV.text }}>{deliveryCost.toFixed(2)}%</strong></div>
    </div>
  );
}

function SupplySuccessModal({ amount, token, state, onClose }) {
  const deliveredUsd = usdVal(state.prices, token, parseFloat(amount) || 0);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
      <div style={{
        background: AV.panel, border: '1px solid rgba(70,188,140,.25)', borderRadius: 20,
        padding: 40, width: 400, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 56 }}>🎉</div>
        <div style={{ color: AV.text, fontWeight: 800, fontSize: 22 }}>Demo Complete!</div>
        <div style={{ color: AV.green, fontSize: 15, fontWeight: 600 }}>
          {typeof amount === 'number' ? amount.toFixed(4) : amount} {token} supplied to Waave
        </div>
        <div style={{ color: AV.muted, fontSize: 13, lineHeight: 1.8 }}>
          You navigated the full cross-chain DeFi flow:<br/>
          <strong style={{ color: AV.text }}>Coinbase → Wallet → Base → Waave</strong>
        </div>
        <div style={{ background: AV.bg, borderRadius: 12, padding: 14, fontSize: 12, color: AV.muted, textAlign: 'left', lineHeight: 2 }}>
          <div>✓ Funded gas via Coinbase</div>
          <div>✓ Bridged assets to Base network</div>
          <div>✓ Connected wallet to Waave</div>
          <div>✓ Signed supply transaction</div>
          <div>✓ Earning {AV.green && ''}{SUPPLY_ASSETS.find(a=>a.token===token)?.apy?.toFixed(2) || '—'}% APY on Waave</div>
        </div>
        <AaveFeeSummary state={state} deliveredUsd={deliveredUsd} />
        <button onClick={onClose} style={{
          padding: 14, borderRadius: 12, border: 'none',
          background: AV.grad, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>Close Demo</button>
      </div>
    </div>
  );
}

// ── Dashboard stats ───────────────────────────────────────────
function DashStats({ state }) {
  const supplied = state.aaveSupplied || {};
  const borrowed = state.aaveBorrowed || {};
  const baseWalletUsd = Object.entries(state.balances.base || {}).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
  const suppliedUsd = Object.entries(supplied).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
  const borrowedUsd = Object.entries(borrowed).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
  const netWorth = baseWalletUsd + suppliedUsd - borrowedUsd;
  const supplyApy = Object.entries(supplied).reduce((s, [t, a]) => {
    const asset = SUPPLY_ASSETS.find(x => x.token === t);
    return s + (asset ? asset.apy / 100 * usdVal(state.prices, t, a) : 0);
  }, 0);
  const borrowApy = Object.entries(borrowed).reduce((s, [t, a]) => {
    const asset = BORROW_ASSETS.find(x => x.token === t);
    return s + (asset ? asset.apy / 100 * usdVal(state.prices, t, a) : 0);
  }, 0);
  const netApy = netWorth > 0 ? ((supplyApy - borrowApy) / netWorth * 100) : 0;

  return (
    <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
      {/* Market header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: AV.base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff' }}>B</div>
        <span style={{ color: AV.text, fontWeight: 700, fontSize: 18 }}>Base Market</span>
        <span style={{ background: 'rgba(46,186,198,.15)', color: AV.blue, fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, border: '1px solid rgba(46,186,198,.3)' }}>V3</span>
        <span style={{ color: AV.muted, fontSize: 14 }}>∨</span>
        <div style={{ flex: 1 }} />
        <button style={{ background: 'none', border: '1px solid ' + AV.border2, borderRadius: 8, padding: '5px 14px', color: AV.muted2, fontSize: 11, cursor: 'pointer' }}>View Transactions</button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
        {[
          ['Net worth', fmtUsd(netWorth)],
          ['Net APY', netWorth !== 0 ? `${netApy.toFixed(2)}%` : '—'],
          ['Available rewards', '$0.00'],
        ].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: AV.muted }}>{k}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: AV.text, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Your Supplies panel ───────────────────────────────────────
function YourSupplies({ state, onWithdraw }) {
  const supplied = state.aaveSupplied || {};
  const entries  = Object.entries(supplied).filter(([, a]) => a > 0);
  const totalUsd = entries.reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);

  return (
    <div style={{ background: AV.panel, border: '1px solid ' + AV.border, borderRadius: 14, padding: 20, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: AV.text, fontWeight: 700, fontSize: 14 }}>Your supplies</span>
        {totalUsd > 0 && <span style={{ color: AV.muted, fontSize: 11 }}>{fmtUsd(totalUsd)} total</span>}
      </div>

      {entries.length === 0 ? (
        <div style={{ color: AV.muted, fontSize: 13, padding: '8px 0' }}>Nothing supplied yet</div>
      ) : (
        <>
          <div style={{ display: 'flex', fontSize: 10, color: AV.muted, paddingBottom: 8, borderBottom: '1px solid ' + AV.border, gap: 0 }}>
            <span style={{ flex: 2 }}>Asset</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Balance</span>
            <span style={{ flex: 1, textAlign: 'right' }}>APY</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Collateral</span>
            <span style={{ width: 80 }}></span>
          </div>
          {entries.map(([tok, amt]) => {
            const asset = SUPPLY_ASSETS.find(a => a.token === tok) || { apy: 0, collateral: false, color: '#555', letter: tok[0] };
            return (
              <div key={tok} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid ' + AV.border }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AaveTokIcon color={asset.color} letter={asset.letter} size={26} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: AV.text }}>{tok}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: AV.text }}>{fmt(amt, 4)}</div>
                  <div style={{ fontSize: 10, color: AV.muted }}>{fmtUsd(usdVal(state.prices, tok, amt))}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: AV.green }}>{asset.apy.toFixed(2)}%</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  {asset.collateral ? <span style={{ color: AV.green, fontSize: 16 }}>✓</span> : <span style={{ color: AV.muted }}>—</span>}
                </div>
                <div style={{ width: 80, display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                  <button onClick={() => onWithdraw(tok, amt)} style={{
                    background: AV.border2, border: 'none', borderRadius: 6, padding: '4px 10px',
                    color: AV.muted2, fontSize: 11, cursor: 'pointer',
                  }}>Withdraw</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Your Borrows panel ────────────────────────────────────────
function YourBorrows({ state }) {
  const borrowed = state.aaveBorrowed || {};
  const entries  = Object.entries(borrowed).filter(([, a]) => a > 0);
  const supplied = state.aaveSupplied || {};
  const supUsd   = Object.entries(supplied).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
  const borUsd   = entries.reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
  const hf       = supUsd > 0 && borUsd > 0 ? (supUsd * 0.825 / borUsd).toFixed(2) : '—';

  return (
    <div style={{ background: AV.panel, border: '1px solid ' + AV.border, borderRadius: 14, padding: 20, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: AV.text, fontWeight: 700, fontSize: 14 }}>Your borrows</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hf !== '—' && <span style={{ fontSize: 11, color: parseFloat(hf) < 1.5 ? AV.red : AV.green }}>HF {hf}</span>}
          <span style={{ background: AV.border2, color: AV.muted, fontSize: 10, padding: '2px 7px', borderRadius: 4 }}>E-Mode DISABLED</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div style={{ color: AV.muted, fontSize: 13, padding: '8px 0' }}>Nothing borrowed yet</div>
      ) : (
        <>
          <div style={{ display: 'flex', fontSize: 10, color: AV.muted, paddingBottom: 8, borderBottom: '1px solid ' + AV.border }}>
            <span style={{ flex: 2 }}>Asset</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Debt</span>
            <span style={{ flex: 1, textAlign: 'right' }}>APY</span>
            <span style={{ width: 80 }}></span>
          </div>
          {entries.map(([tok, amt]) => {
            const asset = BORROW_ASSETS.find(a => a.token === tok) || { apy: 0, color: '#555', letter: tok[0] };
            return (
              <div key={tok} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid ' + AV.border }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AaveTokIcon color={asset.color} letter={asset.letter} size={26} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: AV.text }}>{tok}</span>
                </div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: AV.text }}>{fmt(amt, 4)}</div>
                  <div style={{ fontSize: 10, color: AV.muted }}>{fmtUsd(usdVal(state.prices, tok, amt))}</div>
                </div>
                <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: AV.red }}>{asset.apy.toFixed(2)}%</div>
                <div style={{ width: 80, display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                  <button style={{ background: AV.border2, border: 'none', borderRadius: 6, padding: '4px 10px', color: AV.muted2, fontSize: 11, cursor: 'pointer' }}>Repay</button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

// ── Assets to Supply table ────────────────────────────────────
function AssetsToSupply({ state, onSupply }) {
  const baseBals   = state.balances.base || {};
  const connected  = state.walletConnected;
  const hasBaseAssets = Object.values(baseBals).some(v => v > 0);

  return (
    <div style={{ background: AV.panel, border: '1px solid ' + AV.border, borderRadius: 14, padding: 20, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: AV.text, fontWeight: 700, fontSize: 14 }}>Assets to supply</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: AV.border2, border: 'none', borderRadius: 6, padding: '4px 10px', color: AV.muted2, fontSize: 11, cursor: 'pointer' }}>All Categories ∨</button>
          <button style={{ background: 'none', border: 'none', color: AV.muted, fontSize: 11, cursor: 'pointer' }}>Hide —</button>
        </div>
      </div>

      {!connected && (
        <div style={{ background: 'rgba(46,186,198,.08)', border: '1px solid rgba(46,186,198,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.blue, marginBottom: 12 }}>
          ℹ Connect your wallet to supply assets.
        </div>
      )}

      {connected && !hasBaseAssets && (
        <div style={{ background: 'rgba(46,186,198,.08)', border: '1px solid rgba(46,186,198,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.blue, marginBottom: 12 }}>
          ℹ Your Base wallet is empty. Bridge or transfer assets to supply.
        </div>
      )}

      <div style={{ display: 'flex', fontSize: 10, color: AV.muted, paddingBottom: 8, borderBottom: '1px solid ' + AV.border }}>
        <span style={{ flex: 2 }}>Assets</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Wallet balance</span>
        <span style={{ flex: 1, textAlign: 'right' }}>APY</span>
        <span style={{ flex: 1, textAlign: 'center' }}>Can be collateral</span>
        <span style={{ width: 100 }}></span>
      </div>

      {SUPPLY_ASSETS.map(asset => {
        const bal     = baseBals[asset.token] || 0;
        const canAct  = connected;
        return (
          <div key={asset.token} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid ' + AV.border }}>
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AaveTokIcon color={asset.color} letter={asset.letter} size={28} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: AV.text }}>{asset.token}</div>
                {asset.extra && <div style={{ fontSize: 10, color: AV.blue }}>{asset.extra} ⓘ</div>}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: bal > 0 ? AV.text : AV.muted }}>{bal > 0 ? fmt(bal, 4) : '—'}</div>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: AV.green, fontWeight: asset.token === 'USDC' ? 700 : 400 }}>{asset.apy < 0.01 ? '< 0.01' : asset.apy.toFixed(2)}%</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              {asset.collateral ? <span style={{ color: AV.green, fontSize: 16 }}>✓</span> : <span style={{ color: AV.muted, fontSize: 14 }}>—</span>}
            </div>
            <div style={{ width: 100, display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
              <button
                disabled={!canAct}
                onClick={() => canAct && onSupply(asset)}
                style={{
                  background: canAct ? 'rgba(46,186,198,.12)' : AV.border2,
                  border: canAct ? '1px solid rgba(46,186,198,.3)' : 'none',
                  borderRadius: 7, padding: '5px 12px',
                  color: canAct ? AV.blue : AV.muted,
                  fontSize: 11, fontWeight: 600,
                  cursor: canAct ? 'pointer' : 'not-allowed',
                  opacity: canAct ? 1 : 0.5,
                }}>Supply</button>
              <button style={{ background: 'none', border: 'none', color: AV.muted, cursor: 'pointer', fontSize: 14, padding: '0 4px' }}>···</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Assets to Borrow table ────────────────────────────────────
function AssetsToBorrow({ state, onBorrow }) {
  const supplied = state.aaveSupplied || {};
  const connected = state.walletConnected;
  const hasCollateral = Object.values(supplied).some(v => v > 0);

  return (
    <div style={{ background: AV.panel, border: '1px solid ' + AV.border, borderRadius: 14, padding: 20, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ color: AV.text, fontWeight: 700, fontSize: 14 }}>Assets to borrow</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: AV.border2, border: 'none', borderRadius: 6, padding: '4px 10px', color: AV.muted2, fontSize: 11, cursor: 'pointer' }}>All Categories ∨</button>
          <button style={{ background: 'none', border: 'none', color: AV.muted, fontSize: 11, cursor: 'pointer' }}>Hide —</button>
        </div>
      </div>

      {!connected && (
        <div style={{ background: 'rgba(46,186,198,.08)', border: '1px solid rgba(46,186,198,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.blue, marginBottom: 12 }}>
          Connect your wallet to borrow assets.
        </div>
      )}

      {connected && !hasCollateral && (
        <div style={{ background: 'rgba(46,186,198,.08)', border: '1px solid rgba(46,186,198,.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: AV.blue, marginBottom: 12 }}>
          ℹ To borrow you need to supply any asset to be used as collateral.
        </div>
      )}

      <div style={{ display: 'flex', fontSize: 10, color: AV.muted, paddingBottom: 8, borderBottom: '1px solid ' + AV.border }}>
        <span style={{ flex: 2 }}>Asset</span>
        <span style={{ flex: 1, textAlign: 'right' }}>Available ⓘ</span>
        <span style={{ flex: 1, textAlign: 'right' }}>APY, variable ⓘ</span>
        <span style={{ width: 120 }}></span>
      </div>

      {BORROW_ASSETS.map(asset => {
        const supplied2 = state.aaveSupplied || {};
        const supUsd = Object.entries(supplied2).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
        const borUsd = Object.entries(state.aaveBorrowed || {}).reduce((s, [t, a]) => s + usdVal(state.prices, t, a), 0);
        const avail  = Math.max(0, (supUsd * 0.75 - borUsd) / (state.prices[asset.token] || 1));
        const canAct = connected && hasCollateral && avail > 0;
        return (
          <div key={asset.token} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid ' + AV.border }}>
            <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AaveTokIcon color={asset.color} letter={asset.letter} size={28} />
              <span style={{ fontSize: 13, fontWeight: 600, color: AV.text }}>{asset.token}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: avail > 0 ? AV.text : AV.muted }}>{avail > 0 ? fmt(avail, 4) : '—'}</div>
            <div style={{ flex: 1, textAlign: 'right', fontSize: 13, color: AV.red }}>{asset.apy.toFixed(2)}%</div>
            <div style={{ width: 120, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button disabled={!canAct} onClick={() => canAct && onBorrow(asset)} style={{
                background: canAct ? 'rgba(232,65,66,.12)' : AV.border2,
                border: canAct ? '1px solid rgba(232,65,66,.3)' : 'none',
                borderRadius: 7, padding: '5px 12px',
                color: canAct ? AV.red : AV.muted,
                fontSize: 11, fontWeight: 600, cursor: canAct ? 'pointer' : 'not-allowed',
                opacity: canAct ? 1 : 0.5,
              }}>Borrow</button>
              <button style={{ background: AV.border2, border: 'none', borderRadius: 7, padding: '5px 10px', color: AV.muted2, fontSize: 11, cursor: 'pointer' }}>Details</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Top Nav ───────────────────────────────────────────────────
function AaveTopNav({ state, onConnect, onMarketsClick }) {
  const connected = state.walletConnected;
  const [govClicks, setGovClicks] = useState(0);

  function handleGov() {
    const next = govClicks + 1;
    setGovClicks(next);
    if (next >= 2) {
      setGovClicks(0);
      AppState.setBalance('base', 'ETH', (state.balances.base?.ETH || 0) + 0.002);
      AppState.addHistory({ type: 'Admin', desc: '+0.002 ETH on Base (facilitator)', status: 'Injected' });
    }
  }

  return (
    <>
      {/* Banner */}
      <div style={{ background: AV.grad, padding: '7px 20px', fontSize: 11, color: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span>Waave V4 is now live on Ethereum mainnet.</span>
        <button style={{ background: 'rgba(255,255,255,.2)', border: 'none', borderRadius: 5, padding: '2px 10px', color: '#fff', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>TRY IT OUT HERE</button>
        <div style={{ flex: 1 }} />
        <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
      </div>

      {/* Nav bar */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 50, background: AV.panel, borderBottom: '1px solid ' + AV.border, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 24 }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: AV.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 900 }}>A</div>
          <span style={{ fontWeight: 800, fontSize: 14, color: AV.text, letterSpacing: '-.3px' }}>waave</span>
        </div>

        {[
          { label: 'Dashboard',   onClick: undefined },
          { label: 'Markets',     onClick: onMarketsClick },
          { label: 'Governance',  onClick: handleGov },
          { label: 'Savings',     onClick: undefined },
          { label: 'Staking',     onClick: undefined },
          { label: 'More ···',    onClick: undefined },
        ].map((item, i) => (
          <button key={item.label}
            onClick={item.onClick}
            style={{
              background: 'none', border: 'none', padding: '0 12px', height: '100%',
              cursor: 'pointer', fontSize: 12, color: i === 0 ? AV.text : AV.muted,
              fontWeight: i === 0 ? 600 : 400,
              borderBottom: i === 0 ? '2px solid ' + AV.blue : '2px solid transparent',
            }}>{item.label}</button>
        ))}

        <div style={{ flex: 1 }} />
        <button style={{ background: AV.border2, border: 'none', borderRadius: 8, padding: '5px 14px', color: AV.muted2, fontSize: 11, cursor: 'pointer', marginRight: 8 }}>Bridge GHO ↗</button>
        <button style={{ background: AV.border2, border: 'none', borderRadius: 8, padding: '5px 14px', color: AV.muted2, fontSize: 11, cursor: 'pointer', marginRight: 10, display: 'flex', alignItems: 'center', gap: 5 }}>Swap ⇄</button>

        <button onClick={connected ? undefined : onConnect} style={{
          padding: '6px 14px', borderRadius: 8, border: 'none', cursor: connected ? 'default' : 'pointer',
          background: connected ? 'rgba(46,186,198,.1)' : AV.grad,
          color: connected ? AV.blue : '#fff', fontWeight: 700, fontSize: 11,
          border: connected ? '1px solid rgba(46,186,198,.25)' : 'none',
          marginRight: 8,
        }}>
          {connected ? '0xe3...9115' : 'Connect wallet'}
        </button>
        <button style={{ background: 'none', border: 'none', color: AV.muted, cursor: 'pointer', fontSize: 16 }}>⚙</button>
      </div>
    </>
  );
}

// ── Main AavePanel ────────────────────────────────────────────
function AavePanel({ onAdminOpen }) {
  const [state, setState]             = useState(() => AppState.state);
  const [supplyModal, setSupplyModal] = useState(null);
  const [borrowModal, setBorrowModal] = useState(null);
  const [toast, setToast]             = useState(null);
  const [successSupply, setSuccessSupply] = useState(null); // {amount, token}

  useEffect(() => AppState.subscribe(setState), []);

  async function handleConnect() {
    try { await AppState.requestConnect('Waave'); } catch (e) {}
  }
  window._dappConnect = handleConnect;

  function handleWithdraw(token, amt) {
    (async () => {
      try {
        await AppState.requestSign({ action: `Withdraw ${token} from Waave`, amount: amt, token, protocol: 'Waave v3 · Base' });
        await AppState.runTx(`Withdrawing ${amt} ${token} from Waave`, 'base', async () => {
          AppState.addBalance('base', token, amt);
          AppState.addBalance('base', 'ETH', -0.00006);
          AppState.addFee && AppState.addFee('Network gas', 'Waave withdraw', 0.00006 * (state.prices.ETH || 3200));
          AppState.aaveWithdraw(token, amt);
          AppState.addHistory({ type: 'Withdraw', desc: `${amt} ${token} ← Waave Base`, status: 'Success' });
        });
        setToast(`Withdrew ${fmt(amt)} ${token} successfully`);
      } catch (e) {}
    })();
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: AV.bg, fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>
      <AaveTopNav state={state} onConnect={handleConnect} onMarketsClick={() => onAdminOpen && onAdminOpen()} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 32px' }}>
        <DashStats state={state} />
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <YourSupplies state={state} onWithdraw={handleWithdraw} />
          <YourBorrows  state={state} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <AssetsToSupply state={state} onSupply={setSupplyModal} />
          <AssetsToBorrow state={state} onBorrow={setBorrowModal} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, padding: '10px 24px', borderTop: '1px solid ' + AV.border, fontSize: 11, color: AV.muted, flexShrink: 0 }}>
        <span>Terms</span><span>Privacy</span><span>Docs</span><span>FAQs</span><span>Get Support</span><span>Manage analytics</span>
        <div style={{ flex: 1 }} /><span style={{ color: AV.green }}>● Online</span>
      </div>

      {supplyModal && (
        <SupplyModal
          asset={supplyModal}
          state={state}
          onClose={() => setSupplyModal(null)}
          onSuccess={(amt, tok) => {
            setSupplyModal(null);
            setSuccessSupply({ amount: amt, token: tok });
          }}
        />
      )}
      {borrowModal && (
        <BorrowModal
          asset={borrowModal}
          state={state}
          onClose={() => setBorrowModal(null)}
          onSuccess={(amt, tok) => { setBorrowModal(null); setToast(`Borrowed ${fmt(amt)} ${tok} from Waave`); }}
        />
      )}
      {toast && <SuccessToast msg={toast} onClose={() => setToast(null)} />}
      {successSupply && (
        <SupplySuccessModal
          amount={successSupply.amount}
          token={successSupply.token}
          state={state}
          onClose={() => setSuccessSupply(null)}
        />
      )}
    </div>
  );
}

window.AavePanel = AavePanel;
