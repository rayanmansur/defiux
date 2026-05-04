// NimbusHyperMain.jsx - HyperLivid scenario with Nimbus wallet
function NimbusHyperTabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: '#08080c', borderBottom: '1px solid #1a1a24', height: 38, flexShrink: 0 }}>
      {[
        { id: 'hyperliquid', label: 'HyperLivid', icon: 'HL' },
        { id: 'coinbase', label: 'Coinbase', icon: 'CB' },
      ].map(tab => (
        <button key={tab.id} data-jeff-target={tab.id === 'coinbase' ? 'coinbase-tab' : 'hyperlivid-tab'} onClick={() => onChange(tab.id)} style={{
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
      <div style={{ fontSize: 10, color: '#8b8ba0', paddingRight: 14 }}>DeFi UX Simulator</div>
    </div>
  );
}

function NimbusHyperApp() {
  const [tab, setTab] = React.useState('hyperliquid');
  const [adminOpen, setAdminOpen] = React.useState(false);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh',
      background: '#0a0a0e', overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <NimbusHyperTabBar active={tab} onChange={setTab} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div data-jeff-target="hyperlivid-dapp" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {tab === 'hyperliquid' && <DAppPanel onEarnClick={() => setAdminOpen(true)} />}
          {tab === 'coinbase' && <CoinbasePanel />}
        </div>
        <div data-jeff-target="wallet-panel" style={{ width: 338, flexShrink: 0, borderLeft: '1px solid #1a1a24', background: '#171922' }}>
          <NimbusWalletPanel app="hyperlivid" />
        </div>
      </div>
      <NimbusScenarioSetupPanel visible={adminOpen} onClose={() => setAdminOpen(false)} app="hyperlivid" />
      <JeffGuide mode="nimbus" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<NimbusHyperApp />);
