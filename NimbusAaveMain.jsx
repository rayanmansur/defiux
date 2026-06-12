// NimbusAaveMain.jsx - Waave scenario with Nimbus wallet
function NimbusAaveTabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#08080c', borderBottom: '1px solid #1a1a24', height: 38, flexShrink: 0 }}>
      {[
        { id: 'aave', label: 'Waave', icon: 'WV' },
        { id: 'coinbase', label: 'Coinbase', icon: 'CB' },
      ].map(tab => (
        <button key={tab.id} data-stani-target={tab.id === 'coinbase' ? 'coinbase-tab' : 'waave-tab'} onClick={() => onChange(tab.id)} style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '0 18px', height: '100%',
          border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
          background: active === tab.id ? '#13141a' : 'transparent',
          color: active === tab.id ? '#e8e8f0' : '#6b6b82',
          borderRight: '1px solid #1a1a24',
          borderBottom: active === tab.id ? '2px solid #35c8f0' : '2px solid transparent',
        }}>
          <span style={{ fontSize: 11 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 10, color: '#8b8ba0', paddingRight: 14 }}>DeFi UX Simulator - Waave</div>
    </div>
  );
}


function useIsMobile() {
  const query = '(max-width: 768px)';
  const getMatches = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [isMobile, setIsMobile] = React.useState(getMatches);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia(query);
    const handleChange = event => setIsMobile(event.matches);
    setIsMobile(media.matches);
    if (media.addEventListener) {
      media.addEventListener('change', handleChange);
      return () => media.removeEventListener('change', handleChange);
    }
    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  return isMobile;
}

function NimbusAaveMobileSwitcher({ active, onChange }) {
  const options = [
    { id: 'dapp', label: 'Waave', target: 'waave-tab' },
    { id: 'wallet', label: 'Wallet', target: 'wallet-tab' },
    { id: 'coinbase', label: 'Coinbase', target: 'coinbase-tab' },
  ];

  return (
    <div style={{ padding: '10px 12px calc(10px + env(safe-area-inset-bottom))', background: '#08080c', borderTop: '1px solid #1a1a24', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, background: '#13141a', border: '1px solid #1e2028', borderRadius: 14, padding: 4 }}>
        {options.map(option => (
          <button key={option.id} data-stani-target={option.target} onClick={() => onChange(option.id)} style={{
            border: 'none', borderRadius: 10, padding: '10px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            background: active === option.id ? '#35c8f0' : 'transparent',
            color: active === option.id ? '#061014' : '#e8e8f0',
          }}>{option.label}</button>
        ))}
      </div>
    </div>
  );
}

function NimbusAaveApp() {
  const [tab, setTab] = React.useState('aave');
  const [adminOpen, setAdminOpen] = React.useState(false);
  const [mobileScreen, setMobileScreen] = React.useState('dapp');
  const isMobile = useIsMobile();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh',
      background: '#0a0a0e', overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {!isMobile && <NimbusAaveTabBar active={tab} onChange={setTab} />}
      {isMobile ? (
        <>
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {mobileScreen === 'dapp' && (
              <div data-stani-target="waave-dapp" style={{ height: '100%', overflow: 'hidden' }}>
                <AavePanel onAdminOpen={() => setAdminOpen(true)} />
              </div>
            )}
            {mobileScreen === 'wallet' && (
              <div data-stani-target="wallet-panel" style={{ height: '100%', overflow: 'hidden', background: '#171922' }}>
                <NimbusWalletPanel app="waave" />
              </div>
            )}
            {mobileScreen === 'coinbase' && <CoinbasePanel />}
          </div>
          <NimbusAaveMobileSwitcher active={mobileScreen} onChange={setMobileScreen} />
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          <div data-stani-target="waave-dapp" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {tab === 'aave' && <AavePanel onAdminOpen={() => setAdminOpen(true)} />}
            {tab === 'coinbase' && <CoinbasePanel />}
          </div>
          <div data-stani-target="wallet-panel" style={{ width: 338, flexShrink: 0, borderLeft: '1px solid #1a1a24', background: '#171922' }}>
            <NimbusWalletPanel app="waave" />
          </div>
        </div>
      )}
      <NimbusScenarioSetupPanel visible={adminOpen} onClose={() => setAdminOpen(false)} app="waave" />
      <StaniGuide mode="nimbus" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NimbusAaveApp />);
