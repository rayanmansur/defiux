const JEFF_SPRITES = {
  smile: 'jeff/jeff-smiling-sprite.png',
  closed: 'jeff/jeff-closed-mouth-sprite.png',
  speaking: 'jeff/jeff-speaking-1-sprite.png',
};

const JEFF_POINTER_CURSOR = 'url("uploads/cursors/hand-pointer-cursor.png") 48 6, pointer';

const JEFF_DIALOGUE = {
  traditional: [
    { text: 'OH! HELLO. WELCOME TO THE HYPERLIVID SIMULATOR.' },
    { text: 'NOTHING HERE USES REAL FUNDS. THESE BALANCES, GAS FEES, AND WALLET PROMPTS ARE ALL PRACTICE.' },
    { text: 'THIS LARGE AREA ON THE LEFT IS THE HYPERLIVID DAPP. THIS IS WHERE YOU WILL TRY TO DEPOSIT INTO THE 24/7 TRADING PLATFORM.', target: 'hyperlivid-dapp', label: 'HyperLivid dApp' },
    { text: 'THIS PANEL ON THE RIGHT IS YOUR WALLET. IT SHOWS YOUR TOKENS, CHAINS, GAS, SWAPS, AND SIGNING PROMPTS.', target: 'wallet-panel', label: 'Wallet panel' },
    { text: 'PRETEND A FRIEND TOLD YOU ABOUT THIS COOL TRADING PLATFORM THAT IS OPEN 24/7.' },
    { text: 'YOU ALREADY HAVE FUNDS ONCHAIN. TRY TO GET ANY AMOUNT DEPOSITED INTO HYPERLIVID.' },
    { text: "WHEN YOU DEPOSIT, YOU'LL GET A CONGRATS SCREEN. THAT IS YOUR FINISH LINE." },
    { text: 'IF YOU RUN OUT OF MONEY OR GAS, USE THE COINBASE TAB UP HERE TO ADD MORE FUNDS.', target: 'coinbase-tab', label: 'Coinbase tab' },
    { text: 'EVERY FEE YOU PAY IS TRACKED. TRY TO FINISH WHILE SPENDING AS LITTLE AS YOU CAN.' },
    { text: "GOOD LUCK. I'LL WATCH FROM THE CORNER." },
  ],
  nimbus: [
    { text: 'OH! HELLO AGAIN. THIS IS THE NIMBUS WALLET VERSION OF THE HYPERLIVID SIMULATOR.' },
    { text: 'IT IS STILL A SIMULATOR. NO REAL FUNDS ARE USED HERE.' },
    { text: "IF YOU HAVEN'T TRIED THE TRADITIONAL WALLET FLOW FIRST, START THERE WHEN YOU CAN. IT MAKES THE COMPARISON CLEARER." },
    { text: 'THIS LARGE AREA ON THE LEFT IS STILL THE HYPERLIVID DAPP. YOUR DESTINATION IS THE SAME TRADING PLATFORM.', target: 'hyperlivid-dapp', label: 'HyperLivid dApp' },
    { text: 'THIS PANEL ON THE RIGHT IS NIMBUS. IT IS THE WALLET EXPERIENCE YOU WILL USE FOR THIS VERSION.', target: 'wallet-panel', label: 'Nimbus wallet' },
    { text: 'YOU CAN CONTINUE HERE IF YOU WANT. PRETEND YOUR FRIEND TOLD YOU ABOUT A 24/7 TRADING PLATFORM.' },
    { text: 'YOUR GOAL IS THE SAME: DEPOSIT ANY AMOUNT INTO HYPERLIVID AND REACH THE CONGRATS SCREEN.' },
    { text: 'NIMBUS SHOWS A DIFFERENT FLOW, WITH LESS MANUAL CHAIN AND GAS MANAGEMENT.' },
    { text: 'IF YOU RUN OUT OF MONEY OR GAS, USE THE COINBASE TAB UP HERE TO ADD MORE FUNDS.', target: 'coinbase-tab', label: 'Coinbase tab' },
    { text: 'FEES ARE STILL TRACKED. TRY TO MINIMIZE THEM, THEN COMPARE HOW THIS FELT.' },
    { text: "I'LL BE DOWN HERE IF YOU NEED MORAL SUPPORT." },
  ],
};

const JEFF_STYLE = `
  .jeff-guide-overlay,
  .jeff-guide-corner,
  .jeff-guide-overlay * {
    box-sizing: border-box;
  }

  .jeff-guide-overlay {
    position: fixed;
    inset: 0;
    z-index: 850;
    background: rgba(0, 0, 0, 0.42);
    display: flex;
    align-items: flex-end;
    padding: 0 clamp(12px, 3vw, 34px) clamp(12px, 3vh, 28px);
  }

  .jeff-guide-stage {
    width: min(1120px, 100%);
    min-height: min(48vh, 420px);
    display: grid;
    grid-template-columns: minmax(116px, 210px) 1fr;
    gap: clamp(12px, 2.2vw, 24px);
    align-items: end;
    position: relative;
    z-index: 3;
  }

  .jeff-guide-target-highlight {
    position: fixed;
    z-index: 2;
    border: 4px solid #ffffff;
    outline: 3px solid #080808;
    box-shadow:
      0 0 0 6px rgba(53, 200, 240, 0.4),
      0 0 34px rgba(53, 200, 240, 0.78),
      inset 0 0 24px rgba(53, 200, 240, 0.2);
    pointer-events: none;
    animation: jeff-guide-target-pulse 760ms ease-in-out infinite alternate;
  }

  .jeff-guide-target-callout {
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

  .jeff-guide-target-callout::before {
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

  .jeff-guide-target-callout::after {
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

  @keyframes jeff-guide-target-pulse {
    from {
      opacity: 0.72;
      transform: scale(1);
    }
    to {
      opacity: 1;
      transform: scale(1.01);
    }
  }

  .jeff-guide-sprite-wrap {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    min-height: 260px;
  }

  .jeff-guide-sprite {
    width: min(28vw, 210px);
    max-width: 210px;
    min-width: 118px;
    height: auto;
    image-rendering: pixelated;
    filter: drop-shadow(0 12px 0 rgba(0, 0, 0, 0.28));
    user-select: none;
  }

  .jeff-guide-box {
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

  .jeff-guide-name {
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: clamp(13px, 1.4vw, 17px);
    font-weight: 900;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .jeff-guide-text {
    flex: 1;
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: clamp(17px, 2.2vw, 28px);
    font-weight: 900;
    line-height: 1.38;
    text-transform: uppercase;
    user-select: none;
    white-space: pre-wrap;
  }

  .jeff-guide-hidden-char {
    color: transparent;
  }

  .jeff-guide-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 18px;
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: 12px;
    font-weight: 900;
  }

  .jeff-guide-jumps {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    justify-content: center;
  }

  .jeff-guide-jump {
    width: 22px;
    height: 22px;
    border: 2px solid #080808;
    background: #ffffff;
    color: #080808;
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: 10px;
    font-weight: 900;
    line-height: 1;
  }

  .jeff-guide-jump-active {
    background: #080808;
    color: #ffffff;
  }

  .jeff-guide-actions {
    display: flex;
    gap: 10px;
  }

  .jeff-guide-button {
    background: #080808;
    color: #ffffff;
    border: 0;
    padding: 10px 14px;
    font-family: "Lucida Console", "Courier New", monospace;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
  }

  .jeff-guide-hint {
    color: #2f2f2f;
    line-height: 1.4;
  }

  .jeff-guide-corner {
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
    .jeff-guide-stage {
      grid-template-columns: 86px 1fr;
      min-height: 50vh;
      gap: 10px;
    }

    .jeff-guide-sprite-wrap {
      min-height: 220px;
    }

    .jeff-guide-sprite {
      min-width: 84px;
      width: 84px;
    }

    .jeff-guide-box {
      min-height: 220px;
      border-width: 4px;
      padding: 14px;
    }

    .jeff-guide-text {
      font-size: 15px;
      line-height: 1.35;
    }

    .jeff-guide-controls {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;

function JeffGuide({ mode = 'traditional' }) {
  const lines = JEFF_DIALOGUE[mode] || JEFF_DIALOGUE.traditional;
  const [active, setActive] = React.useState(true);
  const [lineIndex, setLineIndex] = React.useState(0);
  const [visibleChars, setVisibleChars] = React.useState(0);
  const [mouthOpen, setMouthOpen] = React.useState(false);
  const [targetRect, setTargetRect] = React.useState(null);

  const currentEntry = lines[lineIndex] || { text: '' };
  const currentLine = typeof currentEntry === 'string' ? currentEntry : currentEntry.text;
  const currentTarget = typeof currentEntry === 'string' ? null : currentEntry.target;
  const currentLabel = typeof currentEntry === 'string' ? '' : currentEntry.label;
  const lineComplete = visibleChars >= currentLine.length;

  React.useEffect(() => {
    if (!active) return;
    setVisibleChars(0);
  }, [active, lineIndex]);

  React.useEffect(() => {
    if (!active || lineComplete) return;

    const textTimer = window.setTimeout(() => {
      setVisibleChars(n => Math.min(currentLine.length, n + 2));
    }, 28);

    return () => {
      window.clearTimeout(textTimer);
    };
  }, [active, currentLine, lineComplete, visibleChars]);

  React.useEffect(() => {
    if (!active || lineComplete) {
      setMouthOpen(false);
      return;
    }

    const mouthTimer = window.setInterval(() => {
      setMouthOpen(open => !open);
    }, 110);

    return () => window.clearInterval(mouthTimer);
  }, [active, lineComplete, lineIndex]);

  React.useEffect(() => {
    if (!active || !currentTarget) {
      setTargetRect(null);
      return;
    }

    function updateTargetRect() {
      const el = document.querySelector(`[data-jeff-target="${currentTarget}"]`);
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
    ? (lineComplete ? JEFF_SPRITES.smile : mouthOpen ? JEFF_SPRITES.speaking : JEFF_SPRITES.closed)
    : JEFF_SPRITES.smile;

  function renderTypewriterText() {
    return Array.from(currentLine).map((char, i) => (
      <span key={i} className={i < visibleChars ? undefined : 'jeff-guide-hidden-char'}>
        {char}
      </span>
    ));
  }

  return (
    <>
      <style>{JEFF_STYLE}</style>
      {active ? (
        <div className="jeff-guide-overlay">
          {targetRect && (
            <>
              <div className="jeff-guide-target-highlight" style={{
                left: targetRect.left,
                top: targetRect.top,
                width: targetRect.width,
                height: targetRect.height,
              }} />
              <div className="jeff-guide-target-callout" style={{
                left: targetRect.calloutLeft,
                top: targetRect.calloutTop,
              }}>
                Look here: {targetRect.label}
              </div>
            </>
          )}
          <div className="jeff-guide-stage">
            <div className="jeff-guide-sprite-wrap">
              <img className="jeff-guide-sprite" src={sprite} alt="" />
            </div>
            <div className="jeff-guide-box" onClick={advance} role="button" tabIndex="0"
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') advance(); }}>
              <div>
                <div className="jeff-guide-name">Jeff</div>
                <div className="jeff-guide-text" aria-label={currentLine}>{renderTypewriterText()}</div>
              </div>
              <div className="jeff-guide-controls">
                <div className="jeff-guide-hint">
                  {lineComplete ? 'Click text to continue.' : 'Click text to reveal the full line.'}
                  {' '}({lineIndex + 1}/{lines.length})
                </div>
                <div className="jeff-guide-jumps" aria-label="Jump to dialogue line">
                  {lines.map((_, i) => (
                    <button key={i} className={'jeff-guide-jump' + (i === lineIndex ? ' jeff-guide-jump-active' : '')}
                      onClick={e => {
                        e.stopPropagation();
                        setLineIndex(i);
                        setVisibleChars(0);
                      }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <div className="jeff-guide-actions">
                  <button className="jeff-guide-button" onClick={e => { e.stopPropagation(); advance(); }}>
                    {lineIndex >= lines.length - 1 && lineComplete ? 'Done' : 'Next'}
                  </button>
                  <button className="jeff-guide-button" onClick={e => { e.stopPropagation(); finishIntro(); }}>
                    Skip Intro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <img
          className="jeff-guide-corner"
          src={JEFF_SPRITES.smile}
          alt="Replay Jeff introduction"
          role="button"
          tabIndex="0"
          onClick={replayIntro}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') replayIntro(); }}
          style={{ cursor: JEFF_POINTER_CURSOR, pointerEvents: 'auto' }}
        />
      )}
    </>
  );
}
