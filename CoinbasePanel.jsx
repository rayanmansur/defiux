// CoinbasePanel.jsx — mock CeFi: deposit fiat → buy crypto → send to wallet
var { useState, useEffect } = React;

const CB = {
  bg:      '#f8f9fa',
  panel:   '#ffffff',
  border:  '#e4e6ea',
  border2: '#d0d3da',
  text:    '#0a0b0d',
  muted:   '#5b616e',
  blue:    '#0052ff',
  blueDim: '#e8efff',
  green:   '#05b169',
  red:     '#e02f2f',
  yellow:  '#f7931a',
};

const CB_PRICES = { SOL: 165, ETH: 3200 };
const CB_FEE = 0.0149; // 1.49% Coinbase fee
const CB_WITHDRAW_FEE = 0.50; // $0.50 flat network fee

function fmtUsd(n) {
  const x = parseFloat(n) || 0;
  return '$' + x.toFixed(2);
}
function fmt(n, dec = 6) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  return x.toFixed(dec).replace(/\.?0+$/, '');
}

// ── Step indicator ────────────────────────────────────────────
function Steps({ current }) {
  const items = ['Add Cash', 'Buy Crypto', 'Send to Wallet'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {items.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <React.Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? CB.green : active ? CB.blue : CB.border,
                color: done || active ? '#fff' : CB.muted,
                fontSize: 12, fontWeight: 700,
              }}>
                {done ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 10, color: active ? CB.blue : done ? CB.green : CB.muted, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>
            </div>
            {i < items.length - 1 && (
              <div style={{ flex: 1, height: 2, background: i < current ? CB.green : CB.border, margin: '0 6px', marginBottom: 18 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Add Cash ──────────────────────────────────────────
function AddCashStep({ cbBalance, onDone }) {
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle'); // idle | processing | done
  const [err,    setErr]    = useState('');

  const presets = [50, 100, 200, 500];
  const num = parseFloat(amount) || 0;

  async function submit() {
    if (num < 10) { setErr('Minimum deposit is $10'); return; }
    setErr('');
    setPhase('processing');
    // Simulate 3s ACH transfer
    await new Promise(r => setTimeout(r, 3000));
    AppState.addCoinbaseBalance(num);
    AppState.addHistory({ type: 'Deposit', desc: `+${fmtUsd(num)} USD → Coinbase`, status: 'Success' });
    setPhase('done');
    setTimeout(() => onDone(), 800);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: CB.text, marginBottom: 4 }}>Add Cash</div>
        <div style={{ fontSize: 13, color: CB.muted }}>Transfer from your bank account to Coinbase. Funds are available instantly for trading.</div>
      </div>

      <div style={{ background: CB.bg, border: '1px solid ' + CB.border, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: CB.muted, marginBottom: 8 }}>Amount (USD)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, color: CB.muted, fontWeight: 700 }}>$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            style={{ flex: 1, background: 'none', border: 'none', fontSize: 26, fontWeight: 700, color: CB.text, outline: 'none' }} />
        </div>
        <div style={{ fontSize: 11, color: CB.muted, marginTop: 8 }}>Current balance: {fmtUsd(cbBalance)} USD</div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {presets.map(p => (
          <button key={p} onClick={() => setAmount(String(p))} style={{
            flex: 1, padding: '8px 4px', borderRadius: 8, border: '1px solid ' + CB.border,
            background: parseFloat(amount) === p ? CB.blueDim : CB.panel,
            color: parseFloat(amount) === p ? CB.blue : CB.muted,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>${p}</button>
        ))}
      </div>

      <div style={{ background: CB.bg, borderRadius: 10, padding: 12, fontSize: 12, color: CB.muted, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment method</span><span style={{ color: CB.text, fontWeight: 600 }}>Bank Account ···1234</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Transfer fee</span><span style={{ color: CB.text }}>$0.00</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Available</span><span style={{ color: CB.text }}>Instant</span></div>
      </div>

      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: CB.red }}>{err}</div>}

      {phase === 'processing' && (
        <div style={{ background: CB.blueDim, borderRadius: 10, padding: '14px', fontSize: 13, color: CB.blue, textAlign: 'center' }}>
          ⏳ Processing bank transfer... (3s)
        </div>
      )}

      <button onClick={submit} disabled={num < 10 || phase === 'processing'} style={{
        padding: 14, borderRadius: 12, border: 'none', cursor: num >= 10 && phase === 'idle' ? 'pointer' : 'not-allowed',
        background: num >= 10 && phase === 'idle' ? CB.blue : CB.border,
        color: num >= 10 && phase === 'idle' ? '#fff' : CB.muted,
        fontSize: 14, fontWeight: 700,
      }}>
        {phase === 'processing' ? 'Processing...' : `Add ${num > 0 ? fmtUsd(num) : 'Cash'}`}
      </button>
    </div>
  );
}

// ── Step 2: Buy Crypto ────────────────────────────────────────
function BuyCryptoStep({ cbBalance, holdings, onDone, ethNetwork = 'Arbitrum' }) {
  const [token,  setToken]  = useState('SOL');
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [err,    setErr]    = useState('');

  const price    = CB_PRICES[token] || 1;
  const num      = parseFloat(amount) || 0;
  const fee      = num * CB_FEE;
  const afterFee = num - fee;
  const receive  = afterFee / price;

  async function submit() {
    setErr('');
    if (num <= 0) return;
    if (num > cbBalance) { setErr('Insufficient USD balance'); return; }
    if (num < 1)         { setErr('Minimum purchase is $1'); return; }
    setPhase('processing');
    await new Promise(r => setTimeout(r, 2500));
    AppState.addCoinbaseBalance(-num);
    AppState.addCoinbaseHolding(token, receive);
    AppState.addFee && AppState.addFee('Coinbase fee', `${token} purchase`, fee);
    AppState.addHistory({ type: 'Buy', desc: `${fmtUsd(num)} → ${fmt(receive)} ${token} (Coinbase)`, status: 'Success' });
    setPhase('done');
    setTimeout(() => onDone(), 600);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: CB.text, marginBottom: 4 }}>Buy Crypto</div>
        <div style={{ fontSize: 13, color: CB.muted }}>Purchase crypto using your Coinbase cash balance.</div>
      </div>

      {/* Token selector */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { symbol: 'SOL', name: 'Solana',   color: '#9945FF', desc: 'Solana gas' },
          { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', desc: `${ethNetwork} gas` },
        ].map(t => (
          <button key={t.symbol} onClick={() => setToken(t.symbol)} style={{
            flex: 1, padding: '12px 10px', borderRadius: 12, border: '2px solid ' + (token === t.symbol ? CB.blue : CB.border),
            background: token === t.symbol ? CB.blueDim : CB.panel,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 800 }}>{t.symbol[0]}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: CB.text }}>{t.name}</div>
                <div style={{ fontSize: 10, color: CB.muted }}>{t.desc}</div>
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 11, color: CB.muted }}>{fmtUsd(CB_PRICES[t.symbol])} / {t.symbol}</div>
            {holdings[t.symbol] > 0 && <div style={{ fontSize: 10, color: CB.green, marginTop: 2 }}>In Coinbase: {fmt(holdings[t.symbol])} {t.symbol}</div>}
          </button>
        ))}
      </div>

      <div style={{ background: CB.bg, border: '1px solid ' + CB.border, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: CB.muted, marginBottom: 8 }}>Spend (USD)</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 22, color: CB.muted, fontWeight: 700 }}>$</span>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
            style={{ flex: 1, background: 'none', border: 'none', fontSize: 26, fontWeight: 700, color: CB.text, outline: 'none' }} />
        </div>
        <div style={{ fontSize: 11, color: CB.muted, marginTop: 6 }}>Available: {fmtUsd(cbBalance)}</div>
      </div>

      {num > 0 && (
        <div style={{ background: CB.bg, borderRadius: 10, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            ['You spend', fmtUsd(num)],
            [`Coinbase fee (${(CB_FEE*100).toFixed(2)}%)`, fmtUsd(fee)],
            ['You receive', `${fmt(receive, 6)} ${token}`],
            ['Price', `1 ${token} = ${fmtUsd(price)}`],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: CB.muted }}>{k}</span>
              <span style={{ color: CB.text, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: CB.red }}>{err}</div>}

      {phase === 'processing' && (
        <div style={{ background: CB.blueDim, borderRadius: 10, padding: 14, fontSize: 13, color: CB.blue, textAlign: 'center' }}>
          ⏳ Executing purchase...
        </div>
      )}

      <button onClick={submit} disabled={num <= 0 || phase === 'processing'} style={{
        padding: 14, borderRadius: 12, border: 'none',
        cursor: num > 0 && phase === 'idle' ? 'pointer' : 'not-allowed',
        background: num > 0 && phase === 'idle' ? CB.blue : CB.border,
        color: num > 0 && phase === 'idle' ? '#fff' : CB.muted,
        fontSize: 14, fontWeight: 700,
      }}>
        {phase === 'processing' ? 'Buying...' : `Buy ${token}`}
      </button>
    </div>
  );
}

// ── Step 3: Send to Wallet ────────────────────────────────────
function SendToWalletStep({ holdings, onDone, ethNetwork = 'Arbitrum' }) {
  const [token,  setToken]  = useState('SOL');
  const [amount, setAmount] = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [err,    setErr]    = useState('');

  const have   = holdings[token] || 0;
  const num    = parseFloat(amount) || 0;
  const netFee = CB_WITHDRAW_FEE / (token === 'SOL' ? 165 : 3200); // fee in token units
  const receive = Math.max(0, num - netFee);

  const chainMap = { SOL: 'Solana', ETH: ethNetwork };

  async function submit() {
    setErr('');
    if (num <= 0) return;
    if (num > have) { setErr('Insufficient balance'); return; }
    if (receive <= 0) { setErr('Amount too small to cover network fee'); return; }
    setPhase('processing');
    await new Promise(r => setTimeout(r, 2000));
    const ok = AppState.sendCoinbaseToWallet(token, num, receive);
    if (!ok) { setErr('Transfer failed'); setPhase('idle'); return; }
    AppState.addFee && AppState.addFee('Withdrawal fee', `${token} to ${chainMap[token]}`, CB_WITHDRAW_FEE);
    AppState.addHistory({ type: 'Withdraw', desc: `${fmt(receive)} ${token} → self-custody wallet`, status: 'Success' });
    setPhase('done');
    setTimeout(() => onDone(), 600);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: CB.text, marginBottom: 4 }}>Send to Wallet</div>
        <div style={{ fontSize: 13, color: CB.muted }}>Withdraw crypto to your self-custody Phantom wallet.</div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {['SOL','ETH'].map(t => {
          const bal = holdings[t] || 0;
          return (
            <button key={t} onClick={() => setToken(t)} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: '2px solid ' + (token === t ? CB.blue : CB.border),
              background: token === t ? CB.blueDim : CB.panel, cursor: 'pointer', textAlign: 'center',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: CB.text }}>{t}</div>
              <div style={{ fontSize: 11, color: bal > 0 ? CB.green : CB.muted }}>{fmt(bal, 6)} available</div>
            </button>
          );
        })}
      </div>

      <div style={{ background: CB.bg, border: '1px solid ' + CB.border, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 11, color: CB.muted, marginBottom: 8 }}>Amount ({token})</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.000000"
            style={{ flex: 1, background: 'none', border: 'none', fontSize: 22, fontWeight: 700, color: CB.text, outline: 'none' }} />
          <button onClick={() => setAmount(String(have))} style={{ background: CB.border, border: 'none', borderRadius: 6, color: CB.muted, fontSize: 11, padding: '4px 8px', cursor: 'pointer' }}>MAX</button>
        </div>
        <div style={{ fontSize: 11, color: CB.muted, marginTop: 6 }}>Available: {fmt(have, 6)} {token}</div>
      </div>

      <div style={{ background: '#fff8e7', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
        ⚠ Sending to <strong>{chainMap[token]}</strong> network. Ensure your wallet supports this network.
      </div>

      <div style={{ background: CB.bg, borderRadius: 10, padding: 12, fontSize: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['Destination',   'Phantom (SimWlt1...Def1798)'],
          ['Network',       chainMap[token]],
          ['Network fee',   `~${fmt(netFee, 6)} ${token} (${fmtUsd(CB_WITHDRAW_FEE)})`],
          ['You receive',   `${fmt(receive, 6)} ${token}`],
          ['Est. time',     '2–5 minutes'],
        ].map(([k,v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: CB.muted }}>{k}</span>
            <span style={{ color: CB.text, fontWeight: 600, maxWidth: 180, textAlign: 'right' }}>{v}</span>
          </div>
        ))}
      </div>

      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: CB.red }}>{err}</div>}

      {phase === 'processing' && (
        <div style={{ background: CB.blueDim, borderRadius: 10, padding: 14, fontSize: 13, color: CB.blue, textAlign: 'center' }}>
          ⏳ Sending to wallet... (network confirmation)
        </div>
      )}

      <button onClick={submit} disabled={num <= 0 || phase === 'processing'} style={{
        padding: 14, borderRadius: 12, border: 'none',
        cursor: num > 0 && phase === 'idle' ? 'pointer' : 'not-allowed',
        background: num > 0 && phase === 'idle' ? CB.blue : CB.border,
        color: num > 0 && phase === 'idle' ? '#fff' : CB.muted,
        fontSize: 14, fontWeight: 700,
      }}>
        {phase === 'processing' ? 'Sending...' : `Send ${token} to Wallet`}
      </button>
    </div>
  );
}

// ── Main CoinbasePanel ────────────────────────────────────────
function CoinbasePanel() {
  const [state, setState] = useState(() => AppState.state);
  const [step,  setStep]  = useState(0);

  useEffect(() => AppState.subscribe(setState), []);

  const cbBalance = state.coinbaseBalance || 0;
  const holdings  = state.coinbaseHoldings || { SOL: 0, ETH: 0 };
  const ethNetwork = state.aaveSupplied ? 'Base' : 'Arbitrum';

  return (
    <div style={{ width: '100%', height: '100%', background: CB.bg, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>
      {/* Top nav */}
      <div style={{ background: CB.panel, borderBottom: '1px solid ' + CB.border, padding: '0 24px', display: 'flex', alignItems: 'center', height: 52, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, background: CB.blue, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 15 }}>C</div>
          <span style={{ fontWeight: 800, fontSize: 16, color: CB.text }}>Coinbase</span>
        </div>
        <div style={{ flex: 1 }} />
        {['Home','Trade','Pay','Cards','Advanced'].map((item, i) => (
          <button key={item} style={{ background: 'none', border: 'none', padding: '0 14px', height: '100%', fontSize: 13, cursor: 'pointer', color: i === 0 ? CB.blue : CB.muted, fontWeight: i === 0 ? 700 : 400, borderBottom: i === 0 ? '2px solid ' + CB.blue : '2px solid transparent' }}>{item}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: CB.bg, border: '1px solid ' + CB.border, borderRadius: 20, padding: '5px 12px', fontSize: 12, color: CB.text }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CB.green, display: 'inline-block' }} />
          {fmtUsd(cbBalance)} USD
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ width: '100%', maxWidth: 520, background: CB.panel, borderRadius: 20, padding: 32, border: '1px solid ' + CB.border, boxShadow: '0 2px 16px rgba(0,0,0,.06)' }}>
          <Steps current={step} />

          {step === 0 && <AddCashStep    cbBalance={cbBalance} onDone={() => setStep(1)} />}
          {step === 1 && <BuyCryptoStep  cbBalance={cbBalance} holdings={holdings} ethNetwork={ethNetwork} onDone={() => setStep(2)} />}
          {step === 2 && <SendToWalletStep holdings={holdings} ethNetwork={ethNetwork} onDone={() => setStep(0)} />}

          {/* Step nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid ' + CB.border }}>
            <button onClick={() => setStep(s => Math.max(0, s - 1))} style={{
              background: 'none', border: '1px solid ' + CB.border, borderRadius: 8,
              padding: '7px 16px', fontSize: 12, color: CB.muted, cursor: 'pointer',
            }}>← Back</button>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0,1,2].map(i => (
                <button key={i} onClick={() => setStep(i)} style={{
                  width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === step ? CB.blue : CB.border,
                }} />
              ))}
            </div>
            <button onClick={() => setStep(s => Math.min(2, s + 1))} style={{
              background: 'none', border: '1px solid ' + CB.border, borderRadius: 8,
              padding: '7px 16px', fontSize: 12, color: CB.muted, cursor: 'pointer',
            }}>Skip →</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: CB.panel, borderTop: '1px solid ' + CB.border, padding: '12px 24px', display: 'flex', gap: 20, fontSize: 11, color: CB.muted, flexShrink: 0 }}>
        <span>© 2025 Coinbase</span>
        <span>Legal</span><span>Privacy</span><span>Fees</span>
        <div style={{ flex: 1 }} />
        <span>FDIC Insured · USD balances up to $250,000</span>
      </div>
    </div>
  );
}

window.CoinbasePanel = CoinbasePanel;
