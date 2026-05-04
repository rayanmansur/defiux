(function () {
  const STYLE_ID = 'sim-click-feedback-style';
  const DOT_CLASS = 'sim-click-feedback-dot';
  const RING_CLASS = 'sim-click-feedback-ring';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .${RING_CLASS},
      .${DOT_CLASS} {
        position: fixed;
        left: 0;
        top: 0;
        pointer-events: none;
        z-index: 2147483647;
        border-radius: 999px;
        transform: translate(-50%, -50%);
      }

      .${RING_CLASS} {
        width: 12px;
        height: 12px;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.28),
          0 0 18px rgba(53, 200, 240, 0.72);
        animation: sim-click-feedback-ring 360ms ease-out forwards;
      }

      .${DOT_CLASS} {
        width: 6px;
        height: 6px;
        background: rgba(255, 255, 255, 0.98);
        box-shadow:
          0 0 0 1px rgba(0, 0, 0, 0.24),
          0 0 12px rgba(255, 255, 255, 0.72);
        animation: sim-click-feedback-dot 180ms ease-out forwards;
      }

      @keyframes sim-click-feedback-ring {
        from {
          opacity: 0.96;
          transform: translate(-50%, -50%) scale(0.7);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(4.2);
        }
      }

      @keyframes sim-click-feedback-dot {
        from {
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        to {
          opacity: 0;
          transform: translate(-50%, -50%) scale(0.35);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function addClickEffect(event) {
    if (!event.isPrimary && event.pointerType !== 'mouse') return;
    ensureStyle();

    const x = event.clientX;
    const y = event.clientY;
    const ring = document.createElement('span');
    const dot = document.createElement('span');
    ring.className = RING_CLASS;
    dot.className = DOT_CLASS;
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    dot.style.left = x + 'px';
    dot.style.top = y + 'px';

    document.body.appendChild(ring);
    document.body.appendChild(dot);
    window.setTimeout(() => {
      ring.remove();
      dot.remove();
    }, 420);
  }

  window.addEventListener('pointerdown', addClickEffect, { capture: true, passive: true });
})();
