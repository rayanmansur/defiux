// NimbusWalletPanel.jsx - unified wallet flow with intent-style deposits
const NW = {
  bg: '#171922',
  panel: '#202331',
  card: '#262a3a',
  border: '#34394d',
  text: '#ffffff',
  muted: '#9aa2b8',
  soft: '#747d97',
  blue: '#35c8f0',
  green: '#58e0a8',
  purple: '#9d7cff',
  yellow: '#f0c040',
  red: '#ff5d73',
};

const NIMBUS_TOKENS = {
  USDC: { name: 'USD Coin', color: '#2775CA', letter: 'U' },
  SOL: { name: 'Solana', color: '#9945FF', letter: 'S' },
  ETH: { name: 'Ethereum', color: '#627EEA', letter: 'E' },
  ARB: { name: 'Arbitrum', color: '#12AAFF', letter: 'A' },
  BONK: { name: 'Bonk', color: '#E07A35', letter: 'B' },
  WIF: { name: 'dogwifhat', color: '#C27B40', letter: 'W' },
  JTO: { name: 'Jito', color: '#6CB140', letter: 'J' },
  UNI: { name: 'Uniswap', color: '#FF007A', letter: 'U' },
  LINK: { name: 'Chainlink', color: '#2A5ADA', letter: 'L' },
  BRETT: { name: 'Brett', color: '#4A90D9', letter: 'B' },
  cbBTC: { name: 'Coinbase BTC', color: '#F7931A', letter: 'B' },
  weETH: { name: 'Wrapped eETH', color: '#627EEA', letter: 'W' },
  wstETH: { name: 'Wrapped stETH', color: '#00A3FF', letter: 'W' },
  EURC: { name: 'Euro Coin', color: '#2775CA', letter: 'E' },
  cbETH: { name: 'Coinbase ETH', color: '#0052FF', letter: 'C' },
  GHO: { name: 'GHO', color: '#8BC34A', letter: 'G' },
  AAVE: { name: 'Waave', color: '#B6509E', letter: 'A' },
  ezETH: { name: 'Renzo ETH', color: '#6DB33F', letter: 'Z' },
  OP: { name: 'Optimism', color: '#FF0420', letter: 'O' },
  MATIC: { name: 'Polygon', color: '#8247E5', letter: 'M' },
  QUICK: { name: 'QuickSwap', color: '#5BB8F5', letter: 'Q' },
};

const CHAIN_NAMES = {
  solana: 'Solana',
  arbitrum: 'Arbitrum',
  ethereum: 'Ethereum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
};

const WAAVE_DEPOSIT_TOKENS = ['USDC', 'cbBTC', 'weETH', 'wstETH', 'EURC', 'cbETH', 'GHO', 'AAVE', 'ezETH'];
const NIMBUS_FEE_PCT = 0.01;
const NIMBUS_SOURCE_GAS_USD = {
  solana: 0.0021,
  arbitrum: 0.08,
  ethereum: 1.75,
  base: 0.04,
  optimism: 0.03,
  polygon: 0.01,
};

function nfmt(n, dec = 4) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return x.toFixed(dec).replace(/\.?0+$/, '');
}

function nfmtUsd(n) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '$0.00';
  if (x < 0.01) return '<$0.01';
  return '$' + x.toFixed(2);
}

function aggregateBalances(state) {
  const totals = {};
  Object.values(state.balances || {}).forEach(tokens => {
    Object.entries(tokens || {}).forEach(([token, amount]) => {
      totals[token] = (totals[token] || 0) + (parseFloat(amount) || 0);
    });
  });
  return totals;
}

function totalUsd(tokens, prices) {
  return Object.entries(tokens).reduce((sum, [token, amount]) => sum + amount * (prices[token] || 1), 0);
}

function tokenUsd(state, token, amount) {
  return (parseFloat(amount) || 0) * ((state.prices && state.prices[token]) || 1);
}

function sourceGasUsd(chain) {
  return NIMBUS_SOURCE_GAS_USD[chain] ?? 0.04;
}

function sourceOrderFor(app, state, destChain) {
  const all = Object.keys(state.balances || {});
  const preferred = app === 'hyperlivid' ? ['arbitrum', 'solana'] : [destChain, 'solana'];
  const rest = all
    .filter(chain => !preferred.includes(chain))
    .sort((a, b) => (state.chainSpeeds?.[a] || 5) - (state.chainSpeeds?.[b] || 5));
  return [...preferred, ...rest];
}

function getSources(state, token, app, destChain) {
  const byChain = Object.fromEntries(Object.entries(state.balances || {})
    .map(([chain, tokens]) => [chain, parseFloat(tokens?.[token]) || 0]));
  return sourceOrderFor(app, state, destChain)
    .map(chain => ({ chain, amount: byChain[chain] || 0 }))
    .filter(src => src.amount > 0);
}

function deductAcrossSources(state, token, amount, app, destChain) {
  let remaining = parseFloat(amount) || 0;
  const used = [];
  sourceOrderFor(app, state, destChain).forEach(chain => {
    if (remaining <= 0) return;
    const have = parseFloat(state.balances?.[chain]?.[token]) || 0;
    if (have <= 0) return;
    const debit = Math.min(have, remaining);
    AppState.addBalance(chain, token, -debit);
    used.push({ chain, amount: debit });
    remaining -= debit;
  });
  return used;
}

function NimbusTokenIcon({ token, size = 36 }) {
  const meta = NIMBUS_TOKENS[token] || { color: NW.purple, letter: token[0] || '?' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: meta.color, color: '#fff', fontWeight: 900,
      fontSize: Math.max(11, size * 0.42), boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.16)',
      flexShrink: 0,
    }}>{meta.letter}</div>
  );
}

function NimbusProgress({ label, sub, progress, active, complete }) {
  return (
    <div style={{ background: NW.card, border: '1px solid ' + (active ? NW.blue : NW.border), borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
        <div>
          <div style={{ color: NW.text, fontSize: 13, fontWeight: 800 }}>{label}</div>
          <div style={{ color: NW.muted, fontSize: 11, lineHeight: 1.4, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ color: complete ? NW.green : active ? NW.blue : NW.soft, fontSize: 11, fontWeight: 800 }}>
          {complete ? 'Done' : active ? 'Running' : 'Queued'}
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: '#151823', overflow: 'hidden' }}>
        <div style={{
          width: `${Math.max(0, Math.min(100, progress))}%`,
          height: '100%',
          background: complete ? NW.green : 'linear-gradient(90deg, #35c8f0, #9d7cff)',
          transition: 'width 120ms linear',
        }} />
      </div>
    </div>
  );
}

function NimbusPendingOverlay({ pendingTx }) {
  const pct = pendingTx?.progress || 0;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(23,25,34,.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 40 }}>
      <div style={{ position: 'relative', width: 78, height: 78 }}>
        <svg viewBox="0 0 80 80" width="78" height="78" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="34" fill="none" stroke={NW.border} strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={NW.blue} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset .1s linear' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: NW.blue, fontSize: 20 }}>...</div>
      </div>
      <div style={{ textAlign: 'center', padding: '0 24px' }}>
        <div style={{ color: NW.text, fontWeight: 800, fontSize: 15, marginBottom: 6 }}>Processing</div>
        <div style={{ color: NW.muted, fontSize: 12, lineHeight: 1.5 }}>{pendingTx?.description}</div>
      </div>
      <div style={{ color: NW.blue, fontSize: 13, fontWeight: 800 }}>{Math.round(pct)}%</div>
    </div>
  );
}

function NimbusRequestOverlay({ request }) {
  const isSign = request.type === 'sign';
  const dappName = request.dappName || request.protocol || 'Nimbus';
  return (
    <div style={{ position: 'absolute', inset: 0, background: NW.bg, display: 'flex', flexDirection: 'column', zIndex: 60 }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid ' + NW.border, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #35c8f0, #9d7cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900 }}>N</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 14, color: NW.text }}>{dappName}</div>
          <div style={{ fontSize: 11, color: NW.muted }}>Nimbus wallet request</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: NW.text }}>{isSign ? 'Confirm Transaction' : 'Connect Wallet'}</div>
        {!isSign ? (
          <>
            <div style={{ fontSize: 13, color: NW.muted, lineHeight: 1.6 }}>{dappName} is requesting to connect to Nimbus.</div>
            <div style={{ background: NW.card, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: NW.muted, marginBottom: 6 }}>Permissions requested</div>
              {['View wallet address', 'Request transaction confirmations', 'Use Nimbus deposit routing'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 12, color: NW.text }}>
                  <span style={{ color: NW.green }}>OK</span> {p}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ background: NW.card, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Action', request.action || 'Deposit'],
              request.amount && ['Amount', `${request.amount} ${request.token || 'USDC'}`],
              ['Fees and gas', '$0.00'],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: NW.muted }}>{k}</span>
                <span style={{ color: NW.text, fontWeight: 700 }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid ' + NW.border }}>
        <button onClick={request.onReject} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid ' + NW.border, background: 'none', color: NW.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
        <button onClick={request.onApprove} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: NW.blue, color: '#071018', fontSize: 14, fontWeight: 900, cursor: 'pointer' }}>{isSign ? 'Confirm' : 'Connect'}</button>
      </div>
    </div>
  );
}

function NimbusWalletPanel({ app }) {
  const [state, setState] = React.useState(() => AppState.state);
  const [screen, setScreen] = React.useState('home');
  const [selectedToken, setSelectedToken] = React.useState(null);
  const [depositToken, setDepositToken] = React.useState(app === 'hyperlivid' ? 'USDC' : 'USDC');
  const [amount, setAmount] = React.useState('');
  const [tx, setTx] = React.useState(null);
  const completedRef = React.useRef(false);

  React.useEffect(() => AppState.subscribe(setState), []);

  React.useEffect(() => {
    if (!tx || tx.complete) return;
    const depositMs = Math.max(1000, ((state.chainSpeeds?.[tx.sourceChain] || 4) * 1000));
    const fulfillMs = Math.max(1000, ((state.chainSpeeds?.[tx.destChain] || 5) * 1000));
    const start = Date.now();
    const iv = setInterval(() => {
      const elapsed = Date.now() - start;
      const depositProgress = Math.min(100, (elapsed / depositMs) * 100);
      const fulfillProgress = elapsed <= depositMs ? 0 : Math.min(100, ((elapsed - depositMs) / fulfillMs) * 100);
      const complete = depositProgress >= 100 && fulfillProgress >= 100;
      setTx(prev => prev ? { ...prev, depositProgress, fulfillProgress, complete } : prev);
      if (complete) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [tx?.id]);

  React.useEffect(() => {
    if (!tx || !tx.complete || completedRef.current) return;
    completedRef.current = true;
    const latest = AppState.state;
    AppState.addFee && AppState.addFee('Nimbus fee', `${app === 'hyperlivid' ? 'HyperLivid' : 'Waave'} fulfillment`, tx.nimbusFeeUsd);
    AppState.addFee && AppState.addFee('Source-chain gas', `${CHAIN_NAMES[tx.sourceChain] || 'Source'} transaction`, tx.sourceGasUsd);
    deductAcrossSources(latest, tx.sourceToken, tx.sourceAmount, app, tx.destChain);
    if (app === 'hyperlivid') {
      AppState.setHyperliquidBalance((latest.hyperliquidBalance || 0) + tx.destAmount);
      AppState.addHistory({ type: 'Nimbus Deposit', desc: `${nfmt(tx.sourceAmount)} ${tx.sourceToken} -> ${nfmt(tx.destAmount)} USDC on HyperLivid`, status: 'Success' });
      AppState.setFlowComplete && AppState.setFlowComplete({ app: 'hyperlivid', amount: tx.destAmount, token: 'USDC', source: 'nimbus' });
    } else {
      AppState.aaveSupply(tx.destToken, tx.destAmount);
      AppState.addHistory({ type: 'Nimbus Supply', desc: `${nfmt(tx.sourceAmount)} ${tx.sourceToken} -> ${nfmt(tx.destAmount)} ${tx.destToken} on Waave`, status: 'Success' });
      AppState.setFlowComplete && AppState.setFlowComplete({ app: 'waave', amount: tx.destAmount, token: tx.destToken, source: 'nimbus' });
    }
  }, [tx?.complete]);

  const totals = aggregateBalances(state);
  const prices = state.prices || {};
  const walletUsd = totalUsd(totals, prices);
  const appName = app === 'hyperlivid' ? 'HyperLivid' : 'Waave';
  const destChain = app === 'hyperlivid' ? 'arbitrum' : 'base';
  const destName = CHAIN_NAMES[destChain];
  const availableTokens = Object.entries(totals)
    .filter(([token, bal]) => bal > 0 && !!prices[token])
    .sort((a, b) => tokenUsd(state, b[0], b[1]) - tokenUsd(state, a[0], a[1]));
  const requestedToken = selectedToken || availableTokens[0]?.[0] || 'USDC';
  const token = (totals[requestedToken] || 0) <= 0
    ? (availableTokens[0]?.[0] || 'USDC')
    : requestedToken;
  const destToken = app === 'hyperlivid' ? 'USDC' : (WAAVE_DEPOSIT_TOKENS.includes(depositToken) ? depositToken : 'USDC');
  const max = totals[token] || 0;
  const amt = Math.max(0, Math.min(parseFloat(amount) || 0, max));
  const depositValueUsd = tokenUsd(state, token, amt);
  const sources = getSources(state, token, app, destChain);
  const sourceChain = sources[0]?.chain || 'solana';
  const nimbusFeeUsd = depositValueUsd * NIMBUS_FEE_PCT;
  const sourceGasFeeUsd = amt > 0 ? Math.min(sourceGasUsd(sourceChain), depositValueUsd) : 0;
  const totalFeeUsd = amt > 0 ? nimbusFeeUsd + sourceGasFeeUsd : 0;
  const deliveredValueUsd = Math.max(0, depositValueUsd - totalFeeUsd);
  const destAmount = deliveredValueUsd / (prices[destToken] || 1);
  const sourceGasTokenAmount = sourceGasFeeUsd / (prices[token] || 1);
  const feesExceedValue = amt > 0 && deliveredValueUsd <= 0;
  const sourceText = sources.length === 1 ? CHAIN_NAMES[sourceChain] : sources.length > 1 ? 'Unified balance' : 'No balance';
  const estimateSecs = (state.chainSpeeds?.[sourceChain] || 4) + (state.chainSpeeds?.[destChain] || 5);

  async function openDepositFlow() {
    if (!state.walletConnected) {
      try {
        await AppState.requestConnect('Nimbus');
      } catch (e) {
        return;
      }
    }
    setScreen('deposit');
  }

  function startDeposit() {
    if (amt <= 0) return;
    completedRef.current = false;
    setTx({
      id: Date.now(),
      sourceToken: token,
      sourceAmount: amt,
      destToken,
      destAmount,
      sourceValueUsd: depositValueUsd,
      valueUsd: deliveredValueUsd,
      nimbusFeeUsd,
      sourceGasUsd: sourceGasFeeUsd,
      totalFeeUsd,
      sourceChain,
      destChain,
      depositProgress: 0,
      fulfillProgress: 0,
      complete: false,
    });
    setScreen('status');
  }

  function renderHeader() {
    return (
      <>
        <div style={{ height: 43, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid ' + NW.border, background: '#11131b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 22, height: 22, borderRadius: 7, background: 'linear-gradient(135deg, #35c8f0, #9d7cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900 }}>N</div>
            <div style={{ color: NW.text, fontSize: 14, fontWeight: 800 }}>Nimbus</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: state.walletConnected ? NW.green : NW.muted }} />
            <div style={{ color: state.walletConnected ? NW.green : NW.muted, fontSize: 11 }}>{state.walletConnected ? 'Connected' : 'Disconnected'}</div>
          </div>
        </div>
        <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', borderBottom: '1px solid ' + NW.border }}>
          <div>
            <div style={{ color: NW.muted, fontSize: 11 }}>@SimUser</div>
            <div style={{ color: NW.text, fontSize: 13, fontWeight: 800 }}>Account 1</div>
          </div>
          <button onClick={() => setScreen('home')} style={{ background: 'none', border: 'none', color: NW.muted, fontSize: 18, cursor: 'pointer' }}>grid</button>
        </div>
      </>
    );
  }

  function renderHome() {
    return (
      <>
        <div style={{ padding: '14px 12px 10px' }}>
          <button onClick={openDepositFlow} style={{
            width: '100%', textAlign: 'left', background: 'linear-gradient(135deg, rgba(53,200,240,.18), rgba(157,124,255,.14))',
            border: '1px solid rgba(53,200,240,.42)', borderRadius: 12, padding: 14, cursor: 'pointer',
            boxShadow: '0 10px 30px rgba(53,200,240,.08)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ color: NW.text, fontSize: 14, fontWeight: 900 }}>{state.walletConnected ? `Deposit to ${appName} with Nimbus` : 'Connect Nimbus to deposit'}</div>
                <div style={{ color: NW.muted, fontSize: 11, lineHeight: 1.45, marginTop: 4 }}>One wallet action. No native gas token, bridge, or manual swap.</div>
              </div>
              <span style={{ color: '#071018', background: NW.green, borderRadius: 8, padding: '7px 9px', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>{state.walletConnected ? 'Start' : 'Connect'}</span>
            </div>
          </button>
        </div>
        <div style={{ textAlign: 'center', padding: '5px 16px 15px' }}>
          <div style={{ color: NW.text, fontSize: 31, lineHeight: 1, fontWeight: 850 }}>{nfmtUsd(walletUsd)}</div>
          <div style={{ color: NW.green, fontSize: 13, fontWeight: 750, marginTop: 6 }}>+$0.00 0.00%</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 12px 14px' }}>
          {[
            ['up', 'Send'],
            ['in', 'Deposit'],
            ['down', 'Receive'],
            ['clock', 'Activity'],
          ].map(([icon, label]) => (
            <button key={label} onClick={() => label === 'Deposit' && openDepositFlow()} style={{
              height: 61, border: 'none', borderRadius: 9, background: NW.card, color: NW.muted,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: label === 'Deposit' ? 'pointer' : 'default',
            }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: NW.panel, color: NW.purple, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>{icon}</span>
              <span style={{ fontSize: 11 }}>{label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 22, alignItems: 'center', height: 42, padding: '0 14px', borderBottom: '1px solid ' + NW.border }}>
          <span style={{ color: NW.text, fontSize: 13, fontWeight: 850, borderBottom: '2px solid ' + NW.purple, height: 42, display: 'flex', alignItems: 'center' }}>Tokens</span>
          <span style={{ color: NW.muted, fontSize: 13 }}>Apps</span>
          <span style={{ color: NW.muted, fontSize: 13 }}>Activity</span>
        </div>
        <div style={{ padding: 8, overflowY: 'auto', flex: 1 }}>
          {Object.entries(totals).filter(([, bal]) => bal > 0).sort((a, b) => tokenUsd(state, b[0], b[1]) - tokenUsd(state, a[0], a[1])).map(([tok, bal]) => {
            const meta = NIMBUS_TOKENS[tok] || { name: tok };
            return (
              <div key={tok} style={{ display: 'flex', alignItems: 'center', gap: 12, background: NW.card, borderRadius: 12, padding: '12px 14px', marginBottom: 6 }}>
                <NimbusTokenIcon token={tok} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: NW.text, fontSize: 13, fontWeight: 800 }}>{meta.name || tok}</div>
                  <div style={{ color: NW.muted, fontSize: 11 }}>{nfmt(bal)} {tok}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: NW.text, fontSize: 13, fontWeight: 750 }}>{nfmtUsd(tokenUsd(state, tok, bal))}</div>
                  <div style={{ color: NW.green, fontSize: 11 }}>+$0.00</div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderDeposit() {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <button onClick={() => { setAmount(''); setScreen('home'); }} style={{ background: 'none', border: 'none', color: NW.blue, fontSize: 12, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>Back to wallet</button>
        <div style={{ color: NW.text, fontSize: 20, fontWeight: 850, marginBottom: 6 }}>Deposit to {appName}</div>
        <div style={{ color: NW.muted, fontSize: 12, lineHeight: 1.55, marginBottom: 15 }}>
          Nimbus will lock your source funds and complete the action on {destName}. Fees are deducted from what arrives, so no separate native gas token is required.
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ color: NW.soft, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Pay with</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {availableTokens.map(([tok, bal]) => (
              <button key={tok} onClick={() => { setSelectedToken(tok); if (app === 'waave' && WAAVE_DEPOSIT_TOKENS.includes(tok)) setDepositToken(tok); setAmount(''); }} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10,
                border: '1px solid ' + (token === tok ? NW.blue : NW.border),
                background: token === tok ? 'rgba(53,200,240,.12)' : NW.card,
                color: NW.text, cursor: 'pointer', textAlign: 'left',
              }}>
                <NimbusTokenIcon token={tok} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>{tok}</div>
                  <div style={{ color: NW.muted, fontSize: 11 }}>{nfmt(bal)} available</div>
                </div>
                <div style={{ color: NW.muted, fontSize: 12 }}>{nfmtUsd(tokenUsd(state, tok, bal))}</div>
              </button>
            ))}
            {availableTokens.length === 0 && (
              <div style={{ background: NW.card, border: '1px solid ' + NW.border, borderRadius: 10, padding: 12, color: NW.muted, fontSize: 12 }}>
                No supported wallet balance available.
              </div>
            )}
          </div>
        </div>

        {app === 'waave' && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ color: NW.soft, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', marginBottom: 8 }}>Supply as</div>
            <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2 }}>
              {WAAVE_DEPOSIT_TOKENS.map(tok => (
                <button key={tok} onClick={() => setDepositToken(tok)} style={{
                  border: '1px solid ' + (destToken === tok ? NW.blue : NW.border),
                  background: destToken === tok ? 'rgba(53,200,240,.12)' : NW.card,
                  color: destToken === tok ? NW.text : NW.muted,
                  borderRadius: 999, padding: '7px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}>{tok}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: NW.card, border: '1px solid ' + NW.border, borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: NW.muted, fontSize: 11, marginBottom: 8 }}>
            <span>Amount</span>
            <button onClick={() => setAmount(String(max))} style={{ background: 'none', border: 'none', color: NW.blue, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Max</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" min="0" max={max} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" style={{
              flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
              color: NW.text, fontSize: 28, fontWeight: 800,
            }} />
            <span style={{ color: NW.text, fontSize: 13, fontWeight: 850 }}>{token}</span>
          </div>
          <div style={{ color: NW.muted, fontSize: 12, marginTop: 6 }}>{nfmtUsd(tokenUsd(state, token, amt))}</div>
        </div>

        <div style={{ background: '#151823', border: '1px solid ' + NW.border, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Source</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>{sourceText}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Destination</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>{nfmt(destAmount)} {destToken} to {appName} on {destName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Router</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>{token === destToken ? 'No swap needed' : `${token} -> ${destToken}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Nimbus fee</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>1% ({nfmtUsd(nimbusFeeUsd)})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Source gas</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>{nfmt(sourceGasTokenAmount, 6)} {token} ({nfmtUsd(sourceGasFeeUsd)})</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: NW.muted }}>Fees and gas</span>
            <span style={{ color: NW.red, fontWeight: 850 }}>{nfmtUsd(totalFeeUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 7 }}>
            <span style={{ color: NW.muted }}>Estimated time</span>
            <span style={{ color: NW.text, fontWeight: 750 }}>About {estimateSecs}s</span>
          </div>
        </div>

        {feesExceedValue && (
          <div style={{ background: 'rgba(255,93,115,.1)', border: '1px solid rgba(255,93,115,.3)', borderRadius: 10, padding: 10, color: NW.red, fontSize: 12, marginBottom: 12 }}>
            Amount is too small to cover Nimbus and source-chain transaction fees.
          </div>
        )}

        <button disabled={amt <= 0 || amt > max || feesExceedValue} onClick={startDeposit} style={{
          width: '100%', height: 46, border: 'none', borderRadius: 10,
          background: amt > 0 && amt <= max && !feesExceedValue ? 'linear-gradient(135deg, #35c8f0, #9d7cff)' : NW.card,
          color: amt > 0 && amt <= max && !feesExceedValue ? '#071018' : NW.soft,
          fontSize: 14, fontWeight: 900, cursor: amt > 0 && amt <= max && !feesExceedValue ? 'pointer' : 'not-allowed',
        }}>Deposit with Nimbus</button>
      </div>
    );
  }

  function renderStatus() {
    const currentTx = tx || {};
    const depositDone = (currentTx.depositProgress || 0) >= 100;
    const fulfillDone = (currentTx.fulfillProgress || 0) >= 100;
    const src = CHAIN_NAMES[currentTx.sourceChain] || 'source chain';
    const dst = CHAIN_NAMES[currentTx.destChain] || destName;
    const statusEstimate = (state.chainSpeeds?.[currentTx.sourceChain] || 4) + (state.chainSpeeds?.[currentTx.destChain] || 5);
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ color: NW.text, fontSize: 20, fontWeight: 850, margin: '6px 0' }}>
          {fulfillDone ? 'Deposit complete' : 'Deposit in progress'}
        </div>
        <div style={{ color: NW.muted, fontSize: 12, lineHeight: 1.55, marginBottom: 15 }}>
          {nfmt(currentTx.sourceAmount)} {currentTx.sourceToken} is routing into {nfmt(currentTx.destAmount)} {currentTx.destToken} on {appName} after Nimbus and source-chain fees. Estimated completion is about {statusEstimate}s.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <NimbusProgress
            label="1. Deposit"
            sub={`Locking funds from ${src}.`}
            progress={currentTx.depositProgress || 0}
            active={!depositDone}
            complete={depositDone}
          />
          <NimbusProgress
            label="2. Fulfillment"
            sub={`Completing the action on ${dst}.`}
            progress={currentTx.fulfillProgress || 0}
            active={depositDone && !fulfillDone}
            complete={fulfillDone}
          />
        </div>
        <div style={{ background: '#151823', border: '1px solid ' + NW.border, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Source value</span>
            <span style={{ color: NW.text, fontWeight: 800 }}>{nfmtUsd(currentTx.sourceValueUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Delivered amount</span>
            <span style={{ color: NW.text, fontWeight: 800 }}>{nfmt(currentTx.destAmount)} {currentTx.destToken}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Delivered value</span>
            <span style={{ color: NW.text, fontWeight: 800 }}>{nfmtUsd(currentTx.valueUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Nimbus fee</span>
            <span style={{ color: NW.text, fontWeight: 800 }}>{nfmtUsd(currentTx.nimbusFeeUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
            <span style={{ color: NW.muted }}>Source-chain gas</span>
            <span style={{ color: NW.text, fontWeight: 800 }}>{nfmtUsd(currentTx.sourceGasUsd)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: NW.muted }}>Total fees</span>
            <span style={{ color: NW.red, fontWeight: 900 }}>{nfmtUsd(currentTx.totalFeeUsd)}</span>
          </div>
        </div>
        {fulfillDone && (
          <button onClick={() => { setScreen('home'); setTx(null); setAmount(''); }} style={{
            width: '100%', height: 44, border: 'none', borderRadius: 10, background: NW.green,
            color: '#071018', fontSize: 14, fontWeight: 900, cursor: 'pointer',
          }}>Done</button>
        )}
      </div>
    );
  }

  return (
    <div style={{ height: '100%', width: '100%', background: NW.bg, color: NW.text, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden', position: 'relative' }}>
      {renderHeader()}
      {screen === 'home' && renderHome()}
      {screen === 'deposit' && renderDeposit()}
      {screen === 'status' && renderStatus()}
      {state.pendingTx && <NimbusPendingOverlay pendingTx={state.pendingTx} />}
      {state.pendingRequest && <NimbusRequestOverlay request={state.pendingRequest} />}
    </div>
  );
}

window.NimbusWalletPanel = NimbusWalletPanel;
