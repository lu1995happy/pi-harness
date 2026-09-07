// Terminal reporting cannot be restricted to a header: keep capture opt-in.
export function installMouseCapture(tui, targetAt, onChange, {defaultEnabled=false}={}) {
  let enabled = false, pressed;
  const setEnabled = (value) => {
    enabled = value; pressed = undefined;
    tui.terminal.write(value ? '\x1b[?1000h\x1b[?1006h' : '\x1b[?1000l\x1b[?1006l');
    onChange(value); tui.requestRender();
  };
  const remove = tui.addInputListener((data) => {
    if (!enabled) return;
    if (tui.getTopmostVisibleOverlay?.() || data === '\x1b') {
      setEnabled(false); return;
    }
    const packets = [...data.matchAll(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/g)];
    if (!packets.length || packets.map(p => p[0]).join('') !== data) return;
    for (const packet of packets) {
      const button = Number(packet[1]);
      // First wheel tick releases capture; subsequent ticks scroll natively.
      if (button & 64) { setEnabled(false); break; }
      if (button !== 0) { pressed = undefined; continue; }
      const target = targetAt(Number(packet[3]) - 1);
      if (packet[4] === 'M') pressed = target;
      else {
        if (target && target === pressed) { target.setExpanded(!target.expanded); tui.requestRender(); }
        pressed = undefined;
      }
    }
    return {consume:true};
  });
  const beforeStop = tui.beforeTerminalStop;
  function stop(...args) { setEnabled(false); return beforeStop.apply(this, args); }
  tui.beforeTerminalStop = stop;
  setEnabled(defaultEnabled);
  return {setEnabled, get enabled(){return enabled;}, dispose(){
    remove(); setEnabled(false);
    if(tui.beforeTerminalStop === stop) tui.beforeTerminalStop = beforeStop;
  }};
}
