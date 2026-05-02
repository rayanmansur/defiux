// NimbusPrototypeApp.jsx - alternate Nimbus UX prototypes
const NP = {
  bg: '#0b0d12',
  panel: '#141821',
  panel2: '#1c2230',
  card: '#202638',
  border: '#2e364a',
  text: '#f5f7fb',
  muted: '#98a2b8',
  soft: '#707b96',
  blue: '#35c8f0',
  green: '#58e0a8',
  purple: '#9d7cff',
  red: '#ff5d73',
};

const NP_CHAINS = {
  solana: 'Solana',
  arbitrum: 'Arbitrum',
  ethereum: 'Ethereum',
  base: 'Base',
  optimism: 'Optimism',
  polygon: 'Polygon',
};

const NP_TOKENS = {
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

const NP_WAAVE_DEST_TOKENS = ['USDC', 'cbBTC', 'weETH', 'wstETH', 'EURC', 'cbETH', 'GHO', 'AAVE', 'ezETH'];

function npFmt(n, dec = 4) {
  const x = parseFloat(n) || 0;
  if (x === 0) return '0';
  if (x >= 1000) return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return x.toFixed(dec).replace(/\.?0+$/, '');
}

function npUsd(n) {
  return '$' + (parseFloat(n) || 0).toFixed(2);
}

function npAggregate(state) {
  const out = {};
  Object.values(state.balances || {}).forEach(tokens => {
    Object.entries(tokens || {}).forEach(([token, amount]) => {
      out[token] = (out[token] || 0) + (parseFloat(amount) || 0);
    });
  });
  return out;
}

function npTokenUsd(state, token, amount) {
  return (parseFloat(amount) || 0) * ((state.prices && state.prices[token]) || 1);
}

function npSourceOrder(app, state, destChain) {
  const chains = Object.keys(state.balances || {});
  const preferred = app === 'hyperlivid' ? ['arbitrum', 'solana'] : [destChain, 'solana'];
  const rest = chains
    .filter(chain => !preferred.includes(chain))
    .sort((a, b) => (state.chainSpeeds?.[a] || 5) - (state.chainSpeeds?.[b] || 5));
  return [...preferred, ...rest];
}

function npBestSource(state, token, app, destChain) {
  return npSourceOrder(app, state, destChain).find(chain => (state.balances?.[chain]?.[token] || 0) > 0) || 'solana';
}

function npDeduct(state, token, amount, app, destChain) {
  let remaining = parseFloat(amount) || 0;
  npSourceOrder(app, state, destChain).forEach(chain => {
    if (remaining <= 0) return;
    const have = parseFloat(state.balances?.[chain]?.[token]) || 0;
    if (have <= 0) return;
    const debit = Math.min(have, remaining);
    AppState.addBalance(chain, token, -debit);
    remaining -= debit;
  });
}

function NpTokenIcon({ token, size = 32 }) {
  const meta = NP_TOKENS[token] || { color: NP.purple, letter: token?.[0] || '?' };
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: meta.color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(11, size * 0.4),
      fontWeight: 900, flexShrink: 0,
    }}>{meta.letter}</div>
  );
}

function NpButton({ children, onClick, disabled, variant = 'primary', style = {} }) {
  const primary = variant === 'primary';
  return (
    <button onClick={onClick} disabled={disabled} style={{
      border: primary ? 'none' : '1px solid ' + NP.border,
      background: disabled ? NP.card : primary ? NP.green : NP.panel2,
      color: disabled ? NP.soft : primary ? '#071018' : NP.text,
      borderRadius: 8,
      minHeight: 40,
      padding: '0 14px',
      fontSize: 13,
      fontWeight: 850,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style,
    }}>{children}</button>
  );
}

function NpProgress({ title, sub, progress, active, done }) {
  return (
    <div style={{ background: NP.panel2, border: '1px solid ' + (active ? NP.blue : NP.border), borderRadius: 10, padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ color: NP.text, fontSize: 13, fontWeight: 850 }}>{title}</div>
          <div style={{ color: NP.muted, fontSize: 11, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ color: done ? NP.green : active ? NP.blue : NP.soft, fontSize: 11, fontWeight: 850 }}>{done ? 'Done' : active ? 'Running' : 'Queued'}</div>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: '#0f1219', overflow: 'hidden' }}>
        <div style={{ width: Math.max(0, Math.min(100, progress)) + '%', height: '100%', background: done ? NP.green : 'linear-gradient(90deg, #35c8f0, #9d7cff)', transition: 'width 120ms linear' }} />
      </div>
    </div>
  );
}

function PrototypeRequestOverlay({ request }) {
  if (!request) return null;
  const isSign = request.type === 'sign';
  const dappName = request.dappName || request.protocol || 'Nimbus';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.58)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500 }}>
      <div style={{ width: 360, background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 12, overflow: 'hidden', boxShadow: '0 24px 90px rgba(0,0,0,.55)' }}>
        <div style={{ padding: 16, borderBottom: '1px solid ' + NP.border, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #35c8f0, #9d7cff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 950 }}>N</div>
          <div><div style={{ color: NP.text, fontWeight: 900 }}>{dappName}</div><div style={{ color: NP.muted, fontSize: 11 }}>Nimbus wallet request</div></div>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ color: NP.text, fontSize: 17, fontWeight: 900, marginBottom: 8 }}>{isSign ? 'Confirm Transaction' : 'Connect Wallet'}</div>
          <div style={{ color: NP.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>
            {isSign ? 'Confirm this simulated Nimbus action.' : `${dappName} is requesting to connect to Nimbus.`}
          </div>
          <div style={{ background: '#10131b', border: '1px solid ' + NP.border, borderRadius: 8, padding: 12, display: 'grid', gap: 8, fontSize: 12 }}>
            {[
              ['Action', isSign ? (request.action || 'Deposit') : 'Connect'],
              request.amount && ['Amount', `${request.amount} ${request.token || 'USDC'}`],
              ['Fees and gas', '$0.00'],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: NP.muted }}>{k}</span>
                <b style={{ color: NP.text }}>{v}</b>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid ' + NP.border }}>
          <NpButton variant="secondary" onClick={request.onReject} style={{ flex: 1 }}>Reject</NpButton>
          <NpButton onClick={request.onApprove} style={{ flex: 1 }}>{isSign ? 'Confirm' : 'Connect'}</NpButton>
        </div>
      </div>
    </div>
  );
}

function NimbusActionComposer({ state, initialApp = 'waave', compact = false, title = 'Choose an action', onStarted }) {
  const [app, setApp] = React.useState(initialApp);
  const [sourceToken, setSourceToken] = React.useState(null);
  const [destToken, setDestToken] = React.useState('USDC');
  const [amount, setAmount] = React.useState('');
  const [route, setRoute] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    setApp(initialApp);
  }, [initialApp]);

  const totals = npAggregate(state);
  const prices = state.prices || {};
  const sourceOptions = Object.entries(totals).filter(([token, bal]) => bal > 0 && prices[token]).sort((a, b) => npTokenUsd(state, b[0], b[1]) - npTokenUsd(state, a[0], a[1]));
  const selectedSource = sourceToken && totals[sourceToken] > 0 ? sourceToken : sourceOptions[0]?.[0] || 'USDC';
  const destChain = app === 'hyperlivid' ? 'arbitrum' : 'base';
  const finalDestToken = app === 'hyperlivid' ? 'USDC' : destToken;
  const max = totals[selectedSource] || 0;
  const amt = Math.max(0, Math.min(parseFloat(amount) || 0, max));
  const valueUsd = npTokenUsd(state, selectedSource, amt);
  const destAmount = valueUsd / (prices[finalDestToken] || 1);
  const sourceChain = npBestSource(state, selectedSource, app, destChain);
  const estimate = (state.chainSpeeds?.[sourceChain] || 4) + (state.chainSpeeds?.[destChain] || 5);

  async function start() {
    if (amt <= 0 || busy) return;
    setBusy(true);
    if (!AppState.state.walletConnected) {
      try {
        await AppState.requestConnect('Nimbus');
      } catch (e) {
        setBusy(false);
        return;
      }
    }
    const tx = {
      id: Date.now(),
      app,
      appName: app === 'hyperlivid' ? 'HyperLivid' : 'Waave',
      sourceToken: selectedSource,
      sourceAmount: amt,
      sourceChain,
      destToken: finalDestToken,
      destAmount,
      destChain,
      valueUsd,
      depositProgress: 0,
      fulfillProgress: 0,
      complete: false,
    };
    setRoute(tx);
    onStarted && onStarted(tx);
    const depositMs = Math.max(1000, (state.chainSpeeds?.[sourceChain] || 4) * 1000);
    const fulfillMs = Math.max(1000, (state.chainSpeeds?.[destChain] || 5) * 1000);
    const startAt = Date.now();
    await new Promise(resolve => {
      const iv = setInterval(() => {
        const elapsed = Date.now() - startAt;
        const depositProgress = Math.min(100, (elapsed / depositMs) * 100);
        const fulfillProgress = elapsed <= depositMs ? 0 : Math.min(100, ((elapsed - depositMs) / fulfillMs) * 100);
        const complete = depositProgress >= 100 && fulfillProgress >= 100;
        setRoute(prev => prev ? { ...prev, depositProgress, fulfillProgress, complete } : prev);
        if (complete) {
          clearInterval(iv);
          resolve();
        }
      }, 80);
    });
    const latest = AppState.state;
    npDeduct(latest, selectedSource, amt, app, destChain);
    if (app === 'hyperlivid') {
      AppState.setHyperliquidBalance((latest.hyperliquidBalance || 0) + destAmount);
      AppState.addHistory({ type: 'Nimbus Deposit', desc: `${npFmt(amt)} ${selectedSource} -> ${npFmt(destAmount)} USDC on HyperLivid`, status: 'Success' });
    } else {
      AppState.aaveSupply(finalDestToken, destAmount);
      AppState.addHistory({ type: 'Nimbus Supply', desc: `${npFmt(amt)} ${selectedSource} -> ${npFmt(destAmount)} ${finalDestToken} on Waave`, status: 'Success' });
    }
    setBusy(false);
  }

  if (route) {
    const depositDone = (route.depositProgress || 0) >= 100;
    const fulfillDone = (route.fulfillProgress || 0) >= 100;
    return (
      <div style={{ background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 10, padding: compact ? 14 : 18 }}>
        <div style={{ color: NP.text, fontSize: compact ? 17 : 22, fontWeight: 900, marginBottom: 6 }}>{fulfillDone ? 'Action complete' : 'Action in progress'}</div>
        <div style={{ color: NP.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>
          {npFmt(route.sourceAmount)} {route.sourceToken} routes into {npFmt(route.destAmount)} {route.destToken} on {route.appName}.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <NpProgress title="1. Deposit" sub={`Locking funds from ${NP_CHAINS[route.sourceChain]}.`} progress={route.depositProgress || 0} active={!depositDone} done={depositDone} />
          <NpProgress title="2. Fulfillment" sub={`Completing the action on ${NP_CHAINS[route.destChain]}.`} progress={route.fulfillProgress || 0} active={depositDone && !fulfillDone} done={fulfillDone} />
        </div>
        <div style={{ background: '#10131b', border: '1px solid ' + NP.border, borderRadius: 8, padding: 12, marginTop: 12, display: 'grid', gap: 7, fontSize: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Delivered</span><b>{npFmt(route.destAmount)} {route.destToken}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Value</span><b>{npUsd(route.valueUsd)}</b></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Fees</span><b style={{ color: NP.green }}>$0.00</b></div>
        </div>
        {fulfillDone && <NpButton onClick={() => { setRoute(null); setAmount(''); }} style={{ width: '100%', marginTop: 12 }}>Done</NpButton>}
      </div>
    );
  }

  return (
    <div style={{ background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 10, padding: compact ? 14 : 18 }}>
      <div style={{ color: NP.text, fontSize: compact ? 17 : 22, fontWeight: 900, marginBottom: 6 }}>{title}</div>
      <div style={{ color: NP.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 14 }}>Pick the outcome. Nimbus chooses the chain route and handles swaps, deposits, and fulfillment.</div>
      <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setApp('waave')} style={{ background: app === 'waave' ? 'rgba(53,200,240,.14)' : NP.card, border: '1px solid ' + (app === 'waave' ? NP.blue : NP.border), borderRadius: 8, color: NP.text, padding: 12, textAlign: 'left', cursor: 'pointer' }}>
          <b>Earn on Waave</b><div style={{ color: NP.muted, fontSize: 12, marginTop: 4 }}>Supply to Base market</div>
        </button>
        <button onClick={() => setApp('hyperlivid')} style={{ background: app === 'hyperlivid' ? 'rgba(53,200,240,.14)' : NP.card, border: '1px solid ' + (app === 'hyperlivid' ? NP.blue : NP.border), borderRadius: 8, color: NP.text, padding: 12, textAlign: 'left', cursor: 'pointer' }}>
          <b>Deposit to HyperLivid</b><div style={{ color: NP.muted, fontSize: 12, marginTop: 4 }}>Deliver USDC to Arbitrum path</div>
        </button>
      </div>
      {app === 'waave' && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 12 }}>
          {NP_WAAVE_DEST_TOKENS.map(token => (
            <button key={token} onClick={() => setDestToken(token)} style={{ whiteSpace: 'nowrap', borderRadius: 999, border: '1px solid ' + (finalDestToken === token ? NP.blue : NP.border), background: finalDestToken === token ? 'rgba(53,200,240,.14)' : NP.card, color: finalDestToken === token ? NP.text : NP.muted, padding: '7px 10px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{token}</button>
          ))}
        </div>
      )}
      <div style={{ color: NP.soft, fontSize: 11, fontWeight: 900, textTransform: 'uppercase', marginBottom: 7 }}>Pay with</div>
      <div style={{ display: 'grid', gap: 7, maxHeight: compact ? 168 : 220, overflowY: 'auto', marginBottom: 12 }}>
        {sourceOptions.map(([token, bal]) => (
          <button key={token} onClick={() => { setSourceToken(token); setAmount(''); }} style={{ display: 'flex', alignItems: 'center', gap: 10, background: selectedSource === token ? 'rgba(53,200,240,.14)' : NP.card, border: '1px solid ' + (selectedSource === token ? NP.blue : NP.border), borderRadius: 8, padding: 10, color: NP.text, cursor: 'pointer' }}>
            <NpTokenIcon token={token} />
            <div style={{ flex: 1, textAlign: 'left' }}><b style={{ fontSize: 13 }}>{token}</b><div style={{ color: NP.muted, fontSize: 11 }}>{npFmt(bal)} available</div></div>
            <div style={{ color: NP.muted, fontSize: 12 }}>{npUsd(npTokenUsd(state, token, bal))}</div>
          </button>
        ))}
      </div>
      <div style={{ background: '#10131b', border: '1px solid ' + NP.border, borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: NP.muted, fontSize: 11, marginBottom: 7 }}>
          <span>Amount</span>
          <button onClick={() => setAmount(String(max))} style={{ background: 'none', border: 'none', color: NP.blue, fontWeight: 850, cursor: 'pointer' }}>Max</button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={amount} onChange={e => setAmount(e.target.value)} type="number" min="0" max={max} placeholder="0" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: NP.text, fontSize: compact ? 24 : 30, fontWeight: 900 }} />
          <b>{selectedSource}</b>
        </div>
      </div>
      <div style={{ background: '#10131b', border: '1px solid ' + NP.border, borderRadius: 8, padding: 12, marginBottom: 12, display: 'grid', gap: 7, fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Route</span><b>{NP_CHAINS[sourceChain]} -> {NP_CHAINS[destChain]}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Receive</span><b>{npFmt(destAmount)} {finalDestToken}</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Fees</span><b style={{ color: NP.green }}>$0.00</b></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: NP.muted }}>Time</span><b>About {estimate}s</b></div>
      </div>
      <NpButton onClick={start} disabled={amt <= 0 || amt > max || sourceOptions.length === 0 || busy} style={{ width: '100%' }}>{state.walletConnected ? 'Confirm with Nimbus' : 'Connect Nimbus'}</NpButton>
    </div>
  );
}

function NimbusBalanceStrip({ state }) {
  const totals = npAggregate(state);
  const walletUsd = Object.entries(totals).reduce((sum, [token, bal]) => sum + npTokenUsd(state, token, bal), 0);
  const tokens = Object.entries(totals).filter(([, bal]) => bal > 0).sort((a, b) => npTokenUsd(state, b[0], b[1]) - npTokenUsd(state, a[0], a[1])).slice(0, 5);
  return (
    <div style={{ background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 14 }}>
        <div><div style={{ color: NP.muted, fontSize: 12 }}>Nimbus balance</div><div style={{ color: NP.text, fontSize: 30, fontWeight: 950 }}>{npUsd(walletUsd)}</div></div>
        <div style={{ color: state.walletConnected ? NP.green : NP.muted, fontSize: 12, fontWeight: 850 }}>{state.walletConnected ? 'Connected' : 'Disconnected'}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {tokens.map(([token, bal]) => (
          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: 8, background: NP.card, border: '1px solid ' + NP.border, borderRadius: 999, padding: '7px 10px', whiteSpace: 'nowrap' }}>
            <NpTokenIcon token={token} size={24} />
            <span style={{ color: NP.text, fontSize: 12, fontWeight: 800 }}>{npFmt(bal)} {token}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniAppFrame({ active }) {
  if (active === 'hyperlivid') return <DAppPanel onEarnClick={() => {}} />;
  if (active === 'waave') return <AavePanel onAdminOpen={() => {}} />;
  return <CoinbasePanel />;
}

function PrototypeTabs({ tab, setTab }) {
  return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', flex: 1 }}>
      {[
        ['hyperlivid', 'HyperLivid'],
        ['waave', 'Waave'],
        ['coinbase', 'Coinbase'],
      ].map(([id, label]) => (
        <button key={id} onClick={() => setTab(id)} style={{ height: '100%', padding: '0 16px', border: 'none', borderRight: '1px solid ' + NP.border, borderBottom: tab === id ? '2px solid ' + NP.blue : '2px solid transparent', background: tab === id ? NP.panel : 'transparent', color: tab === id ? NP.text : NP.muted, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>{label}</button>
      ))}
      <div style={{ flex: 1 }} />
    </div>
  );
}

function DashboardHome({ state, setTab }) {
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 22, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <NimbusBalanceStrip state={state} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Earn 30.23% APY', 'Supply assets to Waave without managing Base or gas.', 'waave'],
            ['Trade oil after hours', 'Deposit USDC to HyperLivid without bridge steps.', 'hyperlivid'],
          ].map(([title, body, app]) => (
            <button key={title} onClick={() => setTab(app)} style={{ minHeight: 150, background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 10, padding: 18, color: NP.text, textAlign: 'left', cursor: 'pointer' }}>
              <div style={{ color: NP.text, fontSize: 22, lineHeight: 1.1, fontWeight: 950, marginBottom: 8 }}>{title}</div>
              <div style={{ color: NP.muted, fontSize: 13, lineHeight: 1.55 }}>{body}</div>
              <div style={{ color: NP.green, fontSize: 12, fontWeight: 900, marginTop: 16 }}>Start action</div>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minHeight: 360, border: '1px solid ' + NP.border, borderRadius: 10, overflow: 'hidden' }}>
          <DAppPanel onEarnClick={() => {}} />
        </div>
      </div>
      <NimbusActionComposer state={state} title="Action panel" />
    </div>
  );
}

function ExtensionHome({ state }) {
  const [app, setApp] = React.useState('waave');
  return (
    <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>
      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <MiniAppFrame active={app} />
      </div>
      <div style={{ width: 380, borderLeft: '1px solid ' + NP.border, background: '#10141d', padding: 14, overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <NpButton variant={app === 'waave' ? 'primary' : 'secondary'} onClick={() => setApp('waave')} style={{ flex: 1 }}>Waave</NpButton>
          <NpButton variant={app === 'hyperlivid' ? 'primary' : 'secondary'} onClick={() => setApp('hyperlivid')} style={{ flex: 1 }}>HyperLivid</NpButton>
        </div>
        <NimbusBalanceStrip state={state} />
        <div style={{ height: 12 }} />
        <NimbusActionComposer state={state} initialApp={app} compact title="Nimbus action card" />
      </div>
    </div>
  );
}

function MobileHome({ state }) {
  const [mobileTab, setMobileTab] = React.useState('actions');
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(360px, 430px) 1fr', gap: 18, padding: 22, overflow: 'hidden' }}>
      <div style={{ height: '100%', border: '1px solid ' + NP.border, borderRadius: 28, background: '#080a0f', padding: 12, display: 'flex', flexDirection: 'column', minHeight: 0, boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}>
        <div style={{ height: 26, color: NP.muted, fontSize: 11, textAlign: 'center' }}>Nimbus Mobile</div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mobileTab === 'actions' && <><NimbusBalanceStrip state={state} /><NimbusActionComposer state={state} compact title="What do you want to do?" /></>}
          {mobileTab === 'apps' && <div style={{ minHeight: 560 }}><AavePanel onAdminOpen={() => {}} /></div>}
          {mobileTab === 'cash' && <CoinbasePanel />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, paddingTop: 10 }}>
          {[
            ['actions', 'Actions'],
            ['apps', 'Apps'],
            ['cash', 'Cash'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => setMobileTab(id)} style={{ height: 44, border: '1px solid ' + (mobileTab === id ? NP.blue : NP.border), borderRadius: 12, background: mobileTab === id ? 'rgba(53,200,240,.14)' : NP.panel, color: mobileTab === id ? NP.text : NP.muted, fontWeight: 850, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={{ minWidth: 0, border: '1px solid ' + NP.border, borderRadius: 10, overflow: 'hidden' }}>
        <DAppPanel onEarnClick={() => {}} />
      </div>
    </div>
  );
}

function CommandHome({ state }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState('waave');
  const actions = [
    { id: 'waave', title: 'Supply to Waave', body: 'Route any token into a Base market supply position.' },
    { id: 'hyperlivid', title: 'Deposit to HyperLivid', body: 'Route any token into USDC for perps collateral.' },
    { id: 'coinbase', title: 'Open Coinbase', body: 'Add simulated cash or buy gas assets.' },
  ].filter(a => (a.title + a.body).toLowerCase().includes(query.toLowerCase()));
  return (
    <div style={{ height: '100%', padding: 26, overflowY: 'auto' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gap: 16 }}>
        <NimbusBalanceStrip state={state} />
        <div style={{ background: NP.panel, border: '1px solid ' + NP.border, borderRadius: 10, padding: 18 }}>
          <div style={{ color: NP.muted, fontSize: 12, fontWeight: 850, marginBottom: 10 }}>Command palette</div>
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Try: supply USDC, deposit to HyperLivid, buy gas..." style={{ width: '100%', height: 58, border: '1px solid ' + NP.border, borderRadius: 10, background: '#10131b', color: NP.text, outline: 'none', padding: '0 16px', fontSize: 19, fontWeight: 800 }} />
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {actions.map(action => (
              <button key={action.id} onClick={() => setSelected(action.id)} style={{ background: selected === action.id ? 'rgba(53,200,240,.14)' : NP.card, border: '1px solid ' + (selected === action.id ? NP.blue : NP.border), borderRadius: 8, padding: 13, color: NP.text, textAlign: 'left', cursor: 'pointer' }}>
                <b>{action.title}</b><div style={{ color: NP.muted, fontSize: 12, marginTop: 4 }}>{action.body}</div>
              </button>
            ))}
          </div>
        </div>
        {selected === 'coinbase' ? <div style={{ height: 620, border: '1px solid ' + NP.border, borderRadius: 10, overflow: 'hidden' }}><CoinbasePanel /></div> : <NimbusActionComposer state={state} initialApp={selected} title={actions.find(a => a.id === selected)?.title || 'Run action'} />}
      </div>
    </div>
  );
}

function InboxHome({ state }) {
  const [action, setAction] = React.useState('waave');
  const cards = [
    { id: 'waave', title: 'Earn 30.23% on USDC', body: 'Nimbus can supply your available balance to Waave on Base.', cta: 'Supply now' },
    { id: 'hyperlivid', title: 'Deposit perps collateral', body: 'Your funds can be routed into USDC on HyperLivid.', cta: 'Deposit now' },
    { id: 'coinbase', title: 'Need more funds?', body: 'Use the same simulated Coinbase flow to add cash or buy assets.', cta: 'Open Coinbase' },
  ];
  return (
    <div style={{ height: '100%', padding: 24, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 390px', gap: 18 }}>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
        <NimbusBalanceStrip state={state} />
        {cards.map(card => (
          <button key={card.id} onClick={() => setAction(card.id)} style={{ background: action === card.id ? 'rgba(53,200,240,.14)' : NP.panel, border: '1px solid ' + (action === card.id ? NP.blue : NP.border), borderRadius: 10, padding: 18, color: NP.text, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><div style={{ fontSize: 22, fontWeight: 950 }}>{card.title}</div><div style={{ color: NP.muted, fontSize: 13, lineHeight: 1.55, marginTop: 7 }}>{card.body}</div></div>
              <div style={{ color: NP.green, fontSize: 12, fontWeight: 950, whiteSpace: 'nowrap' }}>{card.cta}</div>
            </div>
          </button>
        ))}
        <div style={{ minHeight: 420, border: '1px solid ' + NP.border, borderRadius: 10, overflow: 'hidden' }}>
          <AavePanel onAdminOpen={() => {}} />
        </div>
      </div>
      {action === 'coinbase' ? <div style={{ border: '1px solid ' + NP.border, borderRadius: 10, overflow: 'hidden', minHeight: 680 }}><CoinbasePanel /></div> : <NimbusActionComposer state={state} initialApp={action} compact title="Complete selected intent" />}
    </div>
  );
}

function NimbusPrototypeApp() {
  const mode = window.NIMBUS_PROTOTYPE_MODE || 'dashboard';
  const [state, setState] = React.useState(() => AppState.state);
  const [tab, setTab] = React.useState('home');
  const [setupOpen, setSetupOpen] = React.useState(false);

  React.useEffect(() => AppState.subscribe(setState), []);

  const titles = {
    dashboard: 'Full Nimbus App',
    extension: 'Nimbus Extension Cards',
    mobile: 'Nimbus Mobile',
    command: 'Nimbus Command Palette',
    inbox: 'Nimbus Intent Inbox',
  };

  function renderHome() {
    if (mode === 'extension') return <ExtensionHome state={state} />;
    if (mode === 'mobile') return <MobileHome state={state} />;
    if (mode === 'command') return <CommandHome state={state} />;
    if (mode === 'inbox') return <InboxHome state={state} />;
    return <DashboardHome state={state} setTab={setTab} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: NP.bg, color: NP.text, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 42, display: 'flex', alignItems: 'center', background: '#080a0f', borderBottom: '1px solid ' + NP.border, flexShrink: 0 }}>
        <button onClick={() => setTab('home')} style={{ height: '100%', padding: '0 16px', border: 'none', borderRight: '1px solid ' + NP.border, background: tab === 'home' ? NP.panel : 'transparent', color: tab === 'home' ? NP.text : NP.muted, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>{titles[mode]}</button>
        {mode !== 'extension' && mode !== 'mobile' && <PrototypeTabs tab={tab} setTab={setTab} />}
        {(mode === 'extension' || mode === 'mobile') && <div style={{ flex: 1 }} />}
        <NpButton variant="secondary" onClick={() => setSetupOpen(true)} style={{ marginRight: 10, minHeight: 30 }}>Scenario setup</NpButton>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {tab === 'home' && renderHome()}
        {tab === 'hyperlivid' && <MiniAppFrame active="hyperlivid" />}
        {tab === 'waave' && <MiniAppFrame active="waave" />}
        {tab === 'coinbase' && <MiniAppFrame active="coinbase" />}
      </div>
      <NimbusScenarioSetupPanel visible={setupOpen} onClose={() => setSetupOpen(false)} app="prototype" />
      <PrototypeRequestOverlay request={state.pendingRequest} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NimbusPrototypeApp />);
