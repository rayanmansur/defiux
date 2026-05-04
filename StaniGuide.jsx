const STANI_SPRITES = {
  smile: 'stani/stani-smiling-sprite.png',
  rest: 'stani/stani-resting-sprite.png',
  talking: 'stani/stani-talking-sprite.png',
};

const STANI_POINTER_CURSOR = 'url("uploads/cursors/hand-pointer-cursor.png") 48 6, pointer';

const STANI_DIALOGUE = {
  traditional: [
    { text: 'HELLO. WELCOME TO THE WAAVE SIMULATOR.' },
    { text: 'WAAVE IS A PARODY OF AAVE, THE DEFI LENDING PROTOCOL. NOTHING HERE USES REAL FUNDS.' },
    { text: 'PRETEND YOU SAW ON TWITTER THAT WAAVE HAS ATTRACTIVE YIELDS FOR DEPOSITORS.' },
    { text: 'THIS LARGE AREA ON THE LEFT IS THE WAAVE DAPP. THIS IS WHERE YOU CAN VIEW MARKETS AND SUPPLY ASSETS FOR YIELD.', target: 'waave-dapp', label: 'Waave dApp' },
    { text: 'THIS PANEL ON THE RIGHT IS YOUR WALLET. THIS IS WHERE YOU CONTROL YOUR TOKENS, CHAINS, GAS, SWAPS, AND SIGNING PROMPTS.', target: 'wallet-panel', label: 'Wallet panel' },
    { text: 'YOUR GOAL IS TO DEPOSIT ANY AMOUNT INTO WAAVE. ONCE YOU SUPPLY FUNDS, YOU WILL GET A CONGRATS SCREEN.' },
    { text: 'IF YOU RUN OUT OF MONEY OR GAS, USE THE COINBASE TAB UP HERE TO ADD MORE FUNDS.', target: 'coinbase-tab', label: 'Coinbase tab' },
    { text: 'EVERY FEE YOU PAY IS TRACKED. TRY TO REACH THE YIELD OPPORTUNITY WHILE MINIMIZING FEES.' },
    { text: "I'LL STAY IN THE CORNER AND KEEP WATCH." },
  ],
  nimbus: [
    { text: 'HELLO. THIS IS THE NIMBUS WALLET VERSION OF THE WAAVE SIMULATOR.' },
    { text: 'IT IS STILL ONLY PRACTICE. NO REAL FUNDS, REAL DEPOSITS, OR REAL LOANS ARE USED HERE.' },
    { text: "IF YOU HAVEN'T TRIED THE TRADITIONAL WALLET FLOW FIRST, DO THAT WHEN YOU CAN. IT MAKES THIS COMPARISON CLEARER." },
    { text: 'PRETEND YOU SAW ON TWITTER THAT WAAVE HAS ATTRACTIVE YIELDS, AND YOU WANT TO DEPOSIT ASSETS TO EARN THEM.' },
    { text: 'THIS LARGE AREA ON THE LEFT IS THE WAAVE DAPP. IT IS THE LENDING APP WHERE YOUR SUPPLY ACTION WILL HAPPEN.', target: 'waave-dapp', label: 'Waave dApp' },
    { text: 'THIS PANEL ON THE RIGHT IS NIMBUS. THIS IS WHERE YOU CONTROL YOUR FUNDS IN THIS VERSION.', target: 'wallet-panel', label: 'Nimbus wallet' },
    { text: 'YOUR GOAL IS THE SAME: SUPPLY ANY AMOUNT INTO WAAVE AND REACH THE CONGRATS SCREEN.' },
    { text: 'NIMBUS SHOULD FEEL DIFFERENT BECAUSE IT CAN ROUTE FUNDS WITH LESS MANUAL CHAIN AND GAS MANAGEMENT.' },
    { text: 'IF YOU RUN OUT OF MONEY OR GAS, USE THE COINBASE TAB UP HERE TO ADD MORE FUNDS.', target: 'coinbase-tab', label: 'Coinbase tab' },
    { text: 'FEES ARE STILL TRACKED. TRY TO MINIMIZE THEM, THEN COMPARE HOW BOTH FLOWS FELT.' },
    { text: "I'LL BE RESTING DOWN HERE WHILE YOU TRY IT." },
  ],
};

const STANI_STYLE = `
  .stani-guide-overlay,
  .stani-guide-corner,
  .stani-guide-overlay * {
    box-sizing: border-box;
  }

  .stani-guide-overlay {
    position: fixed;
    inset: 0;
    z-index: 850;
    background: rgba(0, 0, 0, 0.42);
    display: flex;
    align-items: flex-end;
    padding: 0 clamp(12px, 3vw, 34px) clamp(12px, 3vh, 28px);
  }

  .stani-guide-stage {
    width: min(1120px, 100%);
    min-height: min(48vh, 420px);
    display: grid;
    grid-template-columns: minmax(116px, 210px) 1fr;
    gap: clamp(12px, 2.2vw, 24px);
    align-items: end;
    position: relative;
    z-index: 3;
  }

  .stani-guide-target-highlight {
    position: fixed;
    z-index: 2;
    border: 4px solid #ffffff;
    outline: 3px solid #080808;
    box-shadow:
      0 0 0 6px rgba(182, 80, 158, 0.42),
      0 0 34px rgba(46, 186, 198, 0.72),
      inset 0 0 24px rgba(182, 80, 158, 0.2);
    pointer-events: none;
    animation: stani-guide-target-pulse 760ms ease-in-out infinite alternate;
  }

  .stani-guide-target-callout {
    position: fixed;
    z-index: 3;
    min-width: 150px;
    max-width: 230px;
    background: #ffffff;
    color: #080808;
    border: 4px solid #080808;
    padding: 10px 12px;
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.25;
    text-transform: uppercase;
    pointer-events: none;
    box-shadow: 0 8px 0 rgba(0, 0, 0, 0.28);
  }

  .stani-guide-target-callout::before {
    content: "";
    position: absolute;
    left: 18px;
    top: -14px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 12px solid #080808;
  }

  .stani-guide-target-callout::after {
    content: "";
    position: absolute;
    left: 22px;
    top: -7px;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 8px solid #ffffff;
  }

  @keyframes stani-guide-target-pulse {
    from { opacity: 0.72; transform: scale(1); }
    to { opacity: 1; transform: scale(1.01); }
  }

  .stani-guide-sprite-wrap {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 260px;
  }

  .stani-guide-sprite {
    width: min(28vw, 210px);
    max-width: 210px;
    min-width: 118px;
    height: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 12px 0 rgba(0, 0, 0, 0.28));
    user-select: none;
  }

  .stani-guide-box {
    align-self: stretch;
    min-height: 260px;
    background: #f7f7f7;
    color: #080808;
    border: 6px solid #080808;
    box-shadow:
      inset 0 0 0 4px #ffffff,
      0 12px 0 rgba(0, 0, 0, 0.32);
    padding: clamp(16px, 2.4vw, 28px);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .stani-guide-name,
  .stani-guide-text,
  .stani-guide-controls,
  .stani-guide-button,
  .stani-guide-jump {
    font-family: "Lucida Console", "Courier New", monospace;
  }

  .stani-guide-name {
    font-size: clamp(13px, 1.4vw, 17px);
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .stani-guide-text {
    flex: 1;
    font-size: clamp(17px, 2.2vw, 28px);
    font-weight: 900;
    line-height: 1.38;
    text-transform: uppercase;
    user-select: none;
    white-space: pre-wrap;
  }

  .stani-guide-hidden-char {
    color: transparent;
  }

  .stani-guide-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 18px;
    font-size: 12px;
    font-weight: 900;
  }

  .stani-guide-hint {
    color: #2f2f2f;
    line-height: 1.4;
  }

  .stani-guide-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
  }

  .stani-guide-jump {
    width: 22px;
    height: 22px;
    border: 2px solid #080808;
    background: #ffffff;
    color: #080808;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
  }

  .stani-guide-jump-active {
    background: #080808;
    color: #ffffff;
  }

  .stani-guide-actions {
    display: flex;
    gap: 10px;
  }

  .stani-guide-button {
    background: #080808;
    color: #ffffff;
    border: 0;
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .stani-guide-corner {
    position: fixed;
    left: 14px;
    bottom: 10px;
    z-index: 840;
    width: clamp(58px, 7vw, 92px);
    height: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 8px 0 rgba(0, 0, 0, 0.24));
    user-select: none;
    opacity: 0.96;
    cursor: url("uploads/cursors/hand-pointer-cursor.png") 48 6, pointer !important;
    pointer-events: auto;
  }

  @media (max-width: 720px) {
    .stani-guide-stage {
      grid-template-columns: 86px 1fr;
      min-height: 50vh;
      gap: 10px;
    }

    .stani-guide-sprite-wrap {
      min-height: 220px;
    }

    .stani-guide-sprite {
      min-width: 84px;
      width: 84px;
    }

    .stani-guide-box {
      min-height: 220px;
      border-width: 4px;
      padding: 14px;
    }

    .stani-guide-text {
      font-size: 15px;
      line-height: 1.35;
    }

    .stani-guide-controls {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

function StaniGuide({ mode = 'traditional' }) {
  const lines = STANI_DIALOGUE[mode] || STANI_DIALOGUE.traditional;
  const [active, setActive] = React.useState(true);
  const [lineIndex, setLineIndex] = React.useState(0);
  const [visibleChars, setVisibleChars] = React.useState(0);
  const [mouthOpen, setMouthOpen] = React.useState(false);
  const [targetRect, setTargetRect] = React.useState(null);

  const currentEntry = lines[lineIndex] || { text: '' };
  const currentLine = currentEntry.text || '';
  const currentTarget = currentEntry.target;
  const currentLabel = currentEntry.label;
  const lineComplete = visibleChars >= currentLine.length;

  React.useEffect(() => {
    if (!active) return;
    setVisibleChars(0);
  }, [active, lineIndex]);

  React.useEffect(() => {
    if (!active || lineComplete) return;
    const timer = window.setTimeout(() => {
      setVisibleChars(n => Math.min(currentLine.length, n + 2));
    }, 28);
    return () => window.clearTimeout(timer);
  }, [active, currentLine, lineComplete, visibleChars]);

  React.useEffect(() => {
    if (!active || lineComplete) {
      setMouthOpen(false);
      return;
    }
    const timer = window.setInterval(() => setMouthOpen(open => !open), 110);
    return () => window.clearInterval(timer);
  }, [active, lineComplete, lineIndex]);

  React.useEffect(() => {
    if (!active || !currentTarget) {
      setTargetRect(null);
      return;
    }

    function updateTargetRect() {
      const el = document.querySelector(`[data-stani-target="${currentTarget}"]`);
      if (!el) {
        setTargetRect(null);
        return;
      }

      const rect = el.getBoundingClientRect();
      setTargetRect({
        left: Math.max(6, rect.left - 6),
        top: Math.max(6, rect.top - 6),
        width: Math.max(24, rect.width + 12),
        height: Math.max(24, rect.height + 12),
        label: currentLabel || currentTarget,
        calloutLeft: Math.min(Math.max(12, rect.left), window.innerWidth - 250),
        calloutTop: rect.height > 140
          ? Math.min(Math.max(12, rect.top + 16), window.innerHeight - 140)
          : Math.min(Math.max(12, rect.bottom + 14), window.innerHeight - 140),
      });
    }

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    const timer = window.setInterval(updateTargetRect, 250);
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.clearInterval(timer);
    };
  }, [active, currentTarget, currentLabel, lineIndex]);

  function finishIntro() {
    setActive(false);
  }

  function replayIntro() {
    setLineIndex(0);
    setVisibleChars(0);
    setMouthOpen(false);
    setActive(true);
  }

  function advance() {
    if (!lineComplete) {
      setVisibleChars(currentLine.length);
      setMouthOpen(false);
      return;
    }
    if (lineIndex >= lines.length - 1) {
      finishIntro();
      return;
    }
    setLineIndex(i => i + 1);
  }

  const sprite = active
    ? (lineComplete ? STANI_SPRITES.smile : mouthOpen ? STANI_SPRITES.talking : STANI_SPRITES.rest)
    : STANI_SPRITES.smile;

  function renderTypewriterText() {
    return Array.from(currentLine).map((char, i) => (
      <span key={i} className={i < visibleChars ? undefined : 'stani-guide-hidden-char'}>
        {char}
      </span>
    ));
  }

  return (
    <>
      <style>{STANI_STYLE}</style>
      {active ? (
        <div className="stani-guide-overlay">
          {targetRect && (
            <>
              <div className="stani-guide-target-highlight" style={{
                left: targetRect.left,
                top: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }} />
              <div className="stani-guide-target-callout" style={{
                left: targetRect.calloutLeft,
                top: targetRect.calloutTop,
              }}>
                Look here: {targetRect.label}
              </div>
            </>
          )}
          <div className="stani-guide-stage">
            <div className="stani-guide-sprite-wrap">
              <img className="stani-guide-sprite" src={sprite} alt="" />
            </div>
            <div className="stani-guide-box" onClick={advance} role="button" tabIndex="0"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') advance(); }}>
              <div>
                <div className="stani-guide-name">Stani</div>
                <div className="stani-guide-text" aria-label={currentLine}>{renderTypewriterText()}</div>
              </div>
              <div className="stani-guide-controls">
                <div className="stani-guide-hint">
                  {lineComplete ? 'Click text to continue.' : 'Click text to reveal the full line.'}
                  {' '}({lineIndex + 1}/{lines.length})
                </div>
                <div className="stani-guide-jumps" aria-label="Jump to dialogue line">
                  {lines.map((_, i) => (
                    <button key={i} className={'stani-guide-jump' + (i === lineIndex ? ' stani-guide-jump-active' : '')}
                      onClick={e => {
                        e.stopPropagation();
                        setLineIndex(i);
                        setVisibleChars(0);
                      }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="stani-guide-actions">
                  <button className="stani-guide-button" onClick={e => { e.stopPropagation(); advance(); }}>
                    {lineIndex >= lines.length - 1 && lineComplete ? 'Done' : 'Next'}
                  </button>
                  <button className="stani-guide-button" onClick={e => { e.stopPropagation(); finishIntro(); }}>
                    Skip Intro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <img
          className="stani-guide-corner"
          src={STANI_SPRITES.smile}
          alt="Replay Stani introduction"
          role="button"
          tabIndex="0"
          onClick={replayIntro}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') replayIntro(); }}
          style={{ cursor: STANI_POINTER_CURSOR, pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}
