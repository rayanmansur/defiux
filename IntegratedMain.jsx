const { useEffect, useMemo, useState } = React;

const TOKEN_META = {
  USDC: { name: 'USD Coin', price: 1, color: '#2f7de1', label: 'U' },
  ETH: { name: 'Ether', price: 3150, color: '#6574ff', label: 'E' },
  SOL: { name: 'Solana', price: 145, color: '#25b99a', label: 'S' },
  cbBTC: { name: 'Coinbase Bitcoin', price: 62000, color: '#f7931a', label: 'B' },
};

const SUPPLY_MARKETS = [
  { token: 'USDC', apy: 30.23, ltv: 0.78 },
  { token: 'ETH', apy: 2.84, ltv: 0.73 },
  { token: 'cbBTC', apy: 1.42, ltv: 0.68 },
  { token: 'SOL', apy: 4.18, ltv: 0.62 },
];

const BORROW_MARKETS = [
  { token: 'USDC', apy: 4.38 },
  { token: 'ETH', apy: 3.24 },
  { token: 'cbBTC', apy: 0.75 },
  { token: 'SOL', apy: 5.16 },
];

const initialAccount = {
  available: { USDC: 1450, ETH: 0.38, SOL: 16, cbBTC: 0.01 },
  feesUsd: 0,
  hyperlivid: { cashUsd: 0, deposits: 0, completed: false },
  waave: { supplied: {}, borrowed: {}, completed: false },
  history: [],
};

function fmtUsd(value, compact = false) {
  const n = Number(value) || 0;
  if (compact && Math.abs(n) >= 1000) {
    return '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtToken(value, decimals = 4) {
  const n = Number(value) || 0;
  if (n === 0) return '0';
  if (Math.abs(n) < 0.0001) return '<0.0001';
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function tokenUsd(token, amount) {
  return (TOKEN_META[token]?.price || 1) * (Number(amount) || 0);
}

function sumTokenMap(map) {
  return Object.entries(map || {}).reduce((sum, [token, amount]) => sum + tokenUsd(token, amount), 0);
}

function updateToken(map, token, delta) {
  const next = { ...map };
  const value = (Number(next[token]) || 0) + delta;
  next[token] = Math.abs(value) < 0.00000001 ? 0 : Number(value.toFixed(8));
  return next;
}

function addHistory(account, type, text, amountUsd) {
  const item = {
    id: Date.now() + Math.random(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    type,
    text,
    amountUsd,
  };
  return [item, ...(account.history || [])].slice(0, 6);
}

function accountTotals(account) {
  const availableUsd = sumTokenMap(account.available);
  const suppliedUsd = sumTokenMap(account.waave.supplied);
  const borrowedUsd = sumTokenMap(account.waave.borrowed);
  const hyperUsd = account.hyperlivid.cashUsd;
  return {
    availableUsd,
    suppliedUsd,
    borrowedUsd,
    hyperUsd,
    totalUsd: availableUsd + suppliedUsd + hyperUsd - borrowedUsd,
  };
}

function TokenIcon({ token, size = 32 }) {
  const meta = TOKEN_META[token] || TOKEN_META.USDC;
  return (
    <span className="token-icon" style={{ width: size, height: size, background: meta.color }}>
      {meta.label}
    </span>
  );
}

function BrandIcon({ kind }) {
  const isHyper = kind === 'hyperlivid';
  return (
    <span
      className="brand-icon"
      style={{ background: isHyper ? '#00c59a' : 'linear-gradient(135deg, #7b4ef6, #25b99a)' }}
    >
      {isHyper ? 'H' : 'W'}
    </span>
  );
}

function StatusBar() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="status-bar">
      <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <div className="status-icons">
        <span>WiFi</span>
        <span className="status-pill" />
      </div>
    </div>
  );
}

function HomeScreen({ account, openApp }) {
  const totals = accountTotals(account);
  const completed = Number(account.hyperlivid.completed) + Number(account.waave.completed);

  return (
    <>
      <StatusBar />
      <main className="page">
        <div className="top-row">
          <div>
            <div className="eyebrow">Nimbus integrated account</div>
            <h1>DeFi apps</h1>
          </div>
          <div className="account-pill">
            <span className="account-dot" />
            Non-custodial simulation
          </div>
        </div>

        <section className="portfolio-panel" aria-label="Portfolio overview">
          <div className="metric">
            <div className="metric-label">Portfolio value</div>
            <div className="metric-value">{fmtUsd(totals.totalUsd, true)}</div>
            <div className="metric-sub">Available assets plus app balances, minus Waave borrows.</div>
          </div>
          <div className="metric">
            <div className="metric-label">Available</div>
            <div className="metric-value">{fmtUsd(totals.availableUsd, true)}</div>
            <div className="metric-sub">Ready to deploy into supported apps.</div>
          </div>
          <div className="metric">
            <div className="metric-label">Fees tracked</div>
            <div className="metric-value">{fmtUsd(account.feesUsd)}</div>
            <div className="metric-sub">Backend execution fees in this demo.</div>
          </div>
          <div className="metric">
            <div className="metric-label">Goals complete</div>
            <div className="metric-value">{completed}/2</div>
            <div className="metric-sub">Deposit or supply once to finish each app.</div>
          </div>
        </section>

        <section className="asset-strip" aria-label="Available assets">
          {Object.keys(TOKEN_META).map(token => (
            <div className="asset-row" key={token}>
              <TokenIcon token={token} />
              <div className="asset-meta">
                <strong>{fmtToken(account.available[token], token === 'USDC' ? 2 : 4)} {token}</strong>
                <span>{fmtUsd(tokenUsd(token, account.available[token]))} available</span>
              </div>
            </div>
          ))}
        </section>

        <section className="app-section" aria-label="Supported apps">
          <div className="section-title">
            <h2>Supported apps</h2>
            <span>Tap an app to open the integrated frontend.</span>
          </div>
          <div className="app-grid">
            <button className="app-tile" onClick={() => openApp('hyperlivid')}>
              <div>
                <div className="app-tile-top">
                  <BrandIcon kind="hyperlivid" />
                  <span className="app-stat">{fmtUsd(account.hyperlivid.cashUsd)} deposited</span>
                </div>
                <div className="app-name">HyperLivid</div>
                <div className="app-desc">Perps trading account with one-click deposit funding.</div>
              </div>
              <span className="app-stat">{account.hyperlivid.completed ? 'Goal complete' : 'Deposit goal'}</span>
            </button>

            <button className="app-tile" onClick={() => openApp('waave')}>
              <div>
                <div className="app-tile-top">
                  <BrandIcon kind="waave" />
                  <span className="app-stat">{fmtUsd(totals.suppliedUsd)} supplied</span>
                </div>
                <div className="app-name">Waave</div>
                <div className="app-desc">Lending markets with guided supply and borrow actions.</div>
              </div>
              <span className="app-stat">{account.waave.completed ? 'Goal complete' : 'Supply goal'}</span>
            </button>
          </div>
        </section>

        {account.history.length > 0 && (
          <section className="history-list" aria-label="Recent activity">
            {account.history.map(item => (
              <div className="history-item" key={item.id}>
                <span>{item.time}</span>
                <strong>{item.text}</strong>
                <small>{fmtUsd(item.amountUsd)}</small>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="mini-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppHeader({ kind, subtitle, metrics, onHome }) {
  const isHyper = kind === 'hyperlivid';
  return (
    <header className="app-header">
      <button className="back-button" onClick={onHome}>Home</button>
      <div className="app-brand">
        <BrandIcon kind={kind} />
        <div>
          <div className="app-brand-title">{isHyper ? 'HyperLivid' : 'Waave'}</div>
          <div className="app-brand-sub">{subtitle}</div>
        </div>
      </div>
      <div className="header-spacer" />
      {metrics.map(metric => (
        <div className="header-metric" key={metric.label}>
          {metric.label}: {metric.value}
        </div>
      ))}
    </header>
  );
}

function HyperChart() {
  const candles = useMemo(() => {
    let price = 39100;
    return Array.from({ length: 50 }, (_, index) => {
      const open = price;
      const close = open + (Math.sin(index / 3) * 34) + ((index % 5) - 2) * 16;
      const high = Math.max(open, close) + 42 + (index % 4) * 6;
      const low = Math.min(open, close) - 38 - (index % 3) * 7;
      price = close;
      return { open, close, high, low };
    });
  }, []);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(value => value + 1), 1300);
    return () => clearInterval(timer);
  }, []);

  const liveCandles = candles.map((candle, index) => {
    if (index !== candles.length - 1) return candle;
    const close = candle.close + Math.sin(tick) * 70;
    return { ...candle, close, high: Math.max(candle.high, close), low: Math.min(candle.low, close) };
  });
  const min = Math.min(...liveCandles.map(c => c.low));
  const max = Math.max(...liveCandles.map(c => c.high));
  const y = value => 245 - ((value - min) / (max - min)) * 210;
  const width = 720;
  const candleW = width / liveCandles.length;

  return (
    <svg viewBox={`0 0 ${width} 280`} width="100%" height="100%" preserveAspectRatio="none" role="img" aria-label="HyperLivid price chart">
      {[0, 1, 2, 3, 4].map(i => (
        <line key={i} x1="0" x2={width} y1={38 + i * 48} y2={38 + i * 48} stroke="rgba(255,255,255,0.08)" />
      ))}
      {liveCandles.map((candle, index) => {
        const x = index * candleW + candleW * 0.5;
        const up = candle.close >= candle.open;
        const color = up ? '#00c59a' : '#e54f6d';
        const bodyY = Math.min(y(candle.open), y(candle.close));
        const bodyH = Math.max(2, Math.abs(y(candle.open) - y(candle.close)));
        return (
          <g key={index}>
            <line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} stroke={color} strokeWidth="1.3" />
            <rect x={x - candleW * 0.26} y={bodyY} width={candleW * 0.52} height={bodyH} rx="1.5" fill={color} />
          </g>
        );
      })}
      <path d="M0 258 H720" stroke="rgba(255,255,255,0.1)" />
    </svg>
  );
}

function HyperLividApp({ account, setAccount, onHome }) {
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const totals = accountTotals(account);
  const selectedBalance = account.available[asset] || 0;
  const amountNumber = Number(amount) || 0;
  const amountUsd = tokenUsd(asset, amountNumber);
  const feeUsd = amountNumber > 0 ? Math.max(0.15, amountUsd * 0.0012) : 0;
  const depositUsd = Math.max(0, amountUsd - feeUsd);

  function setPercent(percent) {
    setAmount(String(Number((selectedBalance * percent).toFixed(asset === 'USDC' ? 2 : 6))));
  }

  function deposit() {
    setError('');
    if (amountNumber <= 0) {
      setError('Enter an amount to deposit.');
      return;
    }
    if (amountNumber > selectedBalance) {
      setError(`Not enough ${asset} available in the integrated account.`);
      return;
    }
    setAccount(prev => {
      const next = {
        ...prev,
        available: updateToken(prev.available, asset, -amountNumber),
        feesUsd: Number((prev.feesUsd + feeUsd).toFixed(2)),
        hyperlivid: {
          ...prev.hyperlivid,
          cashUsd: Number((prev.hyperlivid.cashUsd + depositUsd).toFixed(2)),
          deposits: prev.hyperlivid.deposits + 1,
          completed: true,
        },
      };
      return {
        ...next,
        history: addHistory(next, 'Deposit', `Deposited to HyperLivid from ${asset}`, depositUsd),
      };
    });
    setSuccess({ amountUsd: depositUsd, token: asset });
    setAmount('');
  }

  return (
    <div className="app-view">
      <AppHeader
        kind="hyperlivid"
        subtitle="Backend-abstracted perps frontend"
        onHome={onHome}
        metrics={[
          { label: 'Account', value: fmtUsd(account.hyperlivid.cashUsd) },
          { label: 'Available', value: fmtUsd(totals.availableUsd, true) },
        ]}
      />
      <div className="app-body">
        <div className="hyper-grid">
          <section className="market-band" aria-label="Market stats">
            <div className="market-stat"><span>Pair</span><strong>HYPE-USDC</strong></div>
            <div className="market-stat"><span>Mark</span><strong>$39,142.8</strong></div>
            <div className="market-stat"><span>24h volume</span><strong>$216.4M</strong></div>
            <div className="market-stat"><span>Funding</span><strong style={{ color: '#00c59a' }}>0.0012%</strong></div>
            <div className="market-stat"><span>Max leverage</span><strong>10x</strong></div>
            <div className="market-stat"><span>Deposit flow</span><strong>Integrated</strong></div>
          </section>

          <section className="chart-panel">
            <div className="chart-title">
              HYPE perpetual
              <span>5m candles - simulated market</span>
            </div>
            <HyperChart />
          </section>

          <section className="orders-panel">
            <div className="chart-title">
              Order book
              <span>Live simulation</span>
            </div>
            {[39152, 39144, 39132, 39118, 39102, 39088, 39074].map((price, index) => (
              <div className="order-row" key={price}>
                <strong style={{ color: index < 3 ? '#e54f6d' : '#00c59a' }}>{price.toLocaleString()}</strong>
                <span>{(18.4 + index * 6.2).toFixed(1)}</span>
                <span>{fmtUsd(44000 + index * 9270, true)}</span>
              </div>
            ))}
          </section>

          <section className="position-strip" aria-label="Trading account metrics">
            <MiniMetric label="Deposited" value={fmtUsd(account.hyperlivid.cashUsd)} />
            <MiniMetric label="Open positions" value="0" />
            <MiniMetric label="Buying power" value={fmtUsd(account.hyperlivid.cashUsd * 10)} />
            <MiniMetric label="Fees paid" value={fmtUsd(account.feesUsd)} />
          </section>

          <section className="flow-card" aria-label="Deposit flow">
            <div className="flow-title">
              <div>
                <h2 style={{ color: '#f8fbff' }}>Deposit</h2>
                <p>Pick an asset and amount. Routing, settlement, and funding details are handled by the app backend.</p>
              </div>
              <span className="app-stat">Integrated account</span>
            </div>

            <div className="asset-pick">
              {Object.keys(TOKEN_META).map(token => (
                <button
                  className={`asset-button ${asset === token ? 'selected' : ''}`}
                  key={token}
                  onClick={() => { setAsset(token); setAmount(''); setError(''); }}
                >
                  <TokenIcon token={token} size={28} />
                  <span>
                    {token}
                    <small>{fmtToken(account.available[token], token === 'USDC' ? 2 : 4)} available</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="amount-box">
              <label>
                <span>Amount</span>
                <span>{fmtUsd(amountUsd)}</span>
              </label>
              <div className="amount-entry">
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <strong>{asset}</strong>
              </div>
              <div className="quick-row">
                <button className="quick-button" onClick={() => setPercent(0.25)}>25%</button>
                <button className="quick-button" onClick={() => setPercent(0.5)}>50%</button>
                <button className="quick-button" onClick={() => setPercent(1)}>Max</button>
              </div>
            </div>

            <div className="route-box">
              <div><span>Execution</span><strong>Automatic</strong></div>
              <div><span>App receives</span><strong>{fmtUsd(depositUsd)}</strong></div>
              <div><span>Tracked fee</span><strong>{fmtUsd(feeUsd)}</strong></div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button className="action-button" onClick={deposit} disabled={amountNumber <= 0}>
              Deposit to HyperLivid
            </button>
          </section>
        </div>
      </div>
      {success && (
        <CompletionModal
          color="#00c59a"
          icon="H"
          title="HyperLivid deposit complete"
          body={`${fmtUsd(success.amountUsd)} reached the trading account. The demo goal for this app is complete.`}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  );
}

function WaaveApp({ account, setAccount, onHome }) {
  const [mode, setMode] = useState('supply');
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const totals = accountTotals(account);
  const borrowCapacityUsd = totals.suppliedUsd * 0.72;
  const availableBorrowUsd = Math.max(0, borrowCapacityUsd - totals.borrowedUsd);
  const healthFactor = totals.borrowedUsd > 0 ? ((totals.suppliedUsd * 0.82) / totals.borrowedUsd).toFixed(2) : 'Safe';
  const amountNumber = Number(amount) || 0;
  const amountUsd = tokenUsd(asset, amountNumber);
  const balance = account.available[asset] || 0;
  const borrowTokenAvailable = availableBorrowUsd / (TOKEN_META[asset]?.price || 1);
  const feeUsd = amountNumber > 0 ? Math.max(0.12, amountUsd * 0.001) : 0;

  function activeMarket() {
    return (mode === 'supply' ? SUPPLY_MARKETS : BORROW_MARKETS).find(item => item.token === asset);
  }

  function setPercent(percent) {
    const base = mode === 'supply' ? balance : borrowTokenAvailable;
    setAmount(String(Number((base * percent).toFixed(asset === 'USDC' ? 2 : 6))));
  }

  function chooseMode(nextMode) {
    setMode(nextMode);
    setAmount('');
    setError('');
    if (nextMode === 'borrow' && !BORROW_MARKETS.some(market => market.token === asset)) {
      setAsset('USDC');
    }
  }

  function supply() {
    setError('');
    if (amountNumber <= 0) {
      setError('Enter an amount to supply.');
      return;
    }
    if (amountNumber > balance) {
      setError(`Not enough ${asset} available in the integrated account.`);
      return;
    }
    setAccount(prev => {
      const supplied = updateToken(prev.waave.supplied, asset, amountNumber);
      const next = {
        ...prev,
        available: updateToken(prev.available, asset, -amountNumber),
        feesUsd: Number((prev.feesUsd + feeUsd).toFixed(2)),
        waave: {
          ...prev.waave,
          supplied,
          completed: true,
        },
      };
      return {
        ...next,
        history: addHistory(next, 'Supply', `Supplied ${asset} to Waave`, amountUsd - feeUsd),
      };
    });
    setSuccess({
      title: 'Waave supply complete',
      body: `${fmtUsd(amountUsd - feeUsd)} is now supplied. The demo goal for this app is complete.`,
    });
    setAmount('');
  }

  function borrow() {
    setError('');
    if (amountNumber <= 0) {
      setError('Enter an amount to borrow.');
      return;
    }
    if (totals.suppliedUsd <= 0) {
      setError('Supply collateral first to enable borrowing.');
      return;
    }
    if (amountUsd > availableBorrowUsd) {
      setError('That borrow would exceed the available borrow capacity.');
      return;
    }
    setAccount(prev => {
      const next = {
        ...prev,
        available: updateToken(prev.available, asset, amountNumber),
        feesUsd: Number((prev.feesUsd + feeUsd).toFixed(2)),
        waave: {
          ...prev.waave,
          borrowed: updateToken(prev.waave.borrowed, asset, amountNumber),
        },
      };
      return {
        ...next,
        history: addHistory(next, 'Borrow', `Borrowed ${asset} from Waave`, amountUsd),
      };
    });
    setSuccess({
      title: 'Borrow complete',
      body: `${fmtToken(amountNumber, asset === 'USDC' ? 2 : 4)} ${asset} was added to the integrated account.`,
    });
    setAmount('');
  }

  const markets = mode === 'supply' ? SUPPLY_MARKETS : BORROW_MARKETS;
  const market = activeMarket();

  return (
    <div className="app-view waave">
      <AppHeader
        kind="waave"
        subtitle="Integrated lending frontend"
        onHome={onHome}
        metrics={[
          { label: 'Supplied', value: fmtUsd(totals.suppliedUsd) },
          { label: 'Borrow cap', value: fmtUsd(availableBorrowUsd) },
        ]}
      />
      <div className="app-body">
        <div className="waave-grid">
          <div className="waave-left">
            <section className="waave-summary" aria-label="Waave account overview">
              <MiniMetric label="Supplied" value={fmtUsd(totals.suppliedUsd)} />
              <MiniMetric label="Borrowed" value={fmtUsd(totals.borrowedUsd)} />
              <MiniMetric label="Available to borrow" value={fmtUsd(availableBorrowUsd)} />
              <MiniMetric label="Health factor" value={healthFactor} />
            </section>

            <section className="waave-market">
              <div className="section-title">
                <h2>{mode === 'supply' ? 'Supply markets' : 'Borrow markets'}</h2>
                <span>Backend routing is bundled into the action.</span>
              </div>
              <div className="market-table">
                <div className="market-table-row header">
                  <span>Asset</span>
                  <span>{mode === 'supply' ? 'Available' : 'Capacity'}</span>
                  <span>APY</span>
                  <span>{mode === 'supply' ? 'LTV' : 'Debt'}</span>
                  <span>Action</span>
                </div>
                {markets.map(item => {
                  const isSupply = mode === 'supply';
                  const tokenAmount = isSupply ? account.available[item.token] || 0 : availableBorrowUsd / TOKEN_META[item.token].price;
                  return (
                    <div className="market-table-row" key={item.token}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <TokenIcon token={item.token} size={28} />
                        {item.token}
                      </strong>
                      <span>{fmtToken(tokenAmount, item.token === 'USDC' ? 2 : 4)}</span>
                      <strong style={{ color: isSupply ? '#2fba78' : '#e54f6d' }}>{item.apy.toFixed(2)}%</strong>
                      <span>{isSupply ? `${Math.round(item.ltv * 100)}%` : fmtUsd(tokenUsd(item.token, account.waave.borrowed[item.token] || 0))}</span>
                      <button
                        className="ghost-button"
                        onClick={() => {
                          setAsset(item.token);
                          setAmount('');
                          setError('');
                        }}
                      >
                        Select
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="waave-market">
              <div className="section-title">
                <h2>Your positions</h2>
                <span>Supplies enable borrowing capacity.</span>
              </div>
              {totals.suppliedUsd === 0 && totals.borrowedUsd === 0 ? (
                <div className="empty-note">No Waave positions yet. Supply any supported asset to complete the simulation goal.</div>
              ) : (
                <div className="market-table">
                  <div className="market-table-row header">
                    <span>Asset</span>
                    <span>Supplied</span>
                    <span>Borrowed</span>
                    <span>Net</span>
                    <span></span>
                  </div>
                  {Object.keys(TOKEN_META).map(token => {
                    const supplied = account.waave.supplied[token] || 0;
                    const borrowed = account.waave.borrowed[token] || 0;
                    if (!supplied && !borrowed) return null;
                    return (
                      <div className="market-table-row" key={token}>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <TokenIcon token={token} size={28} />
                          {token}
                        </strong>
                        <span>{fmtToken(supplied, token === 'USDC' ? 2 : 4)}</span>
                        <span>{fmtToken(borrowed, token === 'USDC' ? 2 : 4)}</span>
                        <strong>{fmtUsd(tokenUsd(token, supplied - borrowed))}</strong>
                        <span></span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="flow-card light waave-flow" aria-label="Waave action flow">
            <div className="flow-title">
              <div>
                <h2>{mode === 'supply' ? 'Supply assets' : 'Borrow assets'}</h2>
                <p>Choose an asset and amount. Waave handles the web3 execution behind this frontend.</p>
              </div>
            </div>

            <div className="tab-row">
              <button className={`tab-button ${mode === 'supply' ? 'active' : ''}`} onClick={() => chooseMode('supply')}>
                Supply
              </button>
              <button className={`tab-button ${mode === 'borrow' ? 'active' : ''}`} onClick={() => chooseMode('borrow')}>
                Borrow
              </button>
            </div>

            <div className="asset-pick">
              {markets.map(item => (
                <button
                  className={`asset-button ${asset === item.token ? 'selected' : ''}`}
                  key={item.token}
                  onClick={() => { setAsset(item.token); setAmount(''); setError(''); }}
                >
                  <TokenIcon token={item.token} size={28} />
                  <span>
                    {item.token}
                    <small>{item.apy.toFixed(2)}% {mode === 'supply' ? 'supply APY' : 'borrow APY'}</small>
                  </span>
                </button>
              ))}
            </div>

            <div className="amount-box">
              <label>
                <span>Amount</span>
                <span>{mode === 'supply' ? `${fmtToken(balance, asset === 'USDC' ? 2 : 4)} ${asset} available` : `${fmtUsd(availableBorrowUsd)} capacity`}</span>
              </label>
              <div className="amount-entry">
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  placeholder="0.00"
                />
                <strong>{asset}</strong>
              </div>
              <div className="quick-row">
                <button className="quick-button" onClick={() => setPercent(0.25)}>25%</button>
                <button className="quick-button" onClick={() => setPercent(0.5)}>50%</button>
                <button className="quick-button" onClick={() => setPercent(1)}>Max</button>
              </div>
            </div>

            <div className="route-box">
              <div><span>{mode === 'supply' ? 'Supply APY' : 'Borrow APY'}</span><strong>{market?.apy.toFixed(2)}%</strong></div>
              <div><span>{mode === 'supply' ? 'Collateral effect' : 'Health factor after'}</span><strong>{mode === 'supply' ? `${Math.round((market?.ltv || 0) * 100)}% LTV` : healthFactor}</strong></div>
              <div><span>Tracked fee</span><strong>{fmtUsd(feeUsd)}</strong></div>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button
              className="action-button purple"
              disabled={amountNumber <= 0}
              onClick={mode === 'supply' ? supply : borrow}
            >
              {mode === 'supply' ? `Supply ${asset}` : `Borrow ${asset}`}
            </button>
          </section>
        </div>
      </div>
      {success && (
        <CompletionModal
          color="#7b4ef6"
          icon="W"
          title={success.title}
          body={success.body}
          onClose={() => setSuccess(null)}
        />
      )}
    </div>
  );
}

function CompletionModal({ color, icon, title, body, onClose }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-icon" style={{ background: color }}>{icon}</div>
        <h2>{title}</h2>
        <p>{body}</p>
        <button className="action-button" style={{ background: color, color: '#fff' }} onClick={onClose}>
          Continue
        </button>
      </div>
    </div>
  );
}

function IntegratedMain() {
  const [account, setAccount] = useState(initialAccount);
  const [view, setView] = useState('home');

  return (
    <div className="tablet">
      <div className="screen">
        {view === 'home' && <HomeScreen account={account} openApp={setView} />}
        {view === 'hyperlivid' && (
          <HyperLividApp account={account} setAccount={setAccount} onHome={() => setView('home')} />
        )}
        {view === 'waave' && (
          <WaaveApp account={account} setAccount={setAccount} onHome={() => setView('home')} />
        )}
      </div>
      <div className="home-bar" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<IntegratedMain />);
