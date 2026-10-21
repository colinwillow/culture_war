// Balance harness: AI vs AI round robin. Serve the repo (python3 -m http.server 4174 from its parent) and run: node tools/balance.cjs
// Playwright path is this container's; adjust for yours.
// round-robin AI vs AI: each pair, both sides, several seeds; prints win matrix
const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('[pageerror]', e.message));
  await p.goto('http://localhost:4174/culture_war/'); await p.waitForTimeout(1500);
  console.log(await p.evaluate(async (seeds) => {
    const v = document.querySelector('script[type=module]').src.split('?v=')[1];
    const M = await import('./src/sim/sim.js?v=' + v), AI = await import('./src/sim/ai.js?v=' + v), F = await import('./src/config/factions.js?v=' + v);
    const fs = Object.keys(F.FACTIONS), wins = {}, out = [];
    for (const f of fs) wins[f] = { w: 0, g: 0, t: 0 };
    for (const a of fs) for (const c of fs) { if (a === c) continue;
      for (const seed of seeds) {
        // force player 1 faction: pick seed so others[seed%3] === c
        const others = fs.filter(k => k !== a); const sd = seed * others.length + others.indexOf(c);
        M.newSim(a, sd, 1); const S = M.getSim();
        let i = 0; for (; i < 20 * 900 && !S.over; i++) { M.step(); AI.aiStep(S, F.TICK, 0); if (i % 40 === 0) S.events.length = 0; }
        const w = S.over ? (S.over.winner === 0 ? a : c) : 'draw';
        wins[a].g++; wins[c].g++; if (w !== 'draw') { wins[w].w++; } wins[a].t += S.t; wins[c].t += S.t;
        out.push(a + ' v ' + c + ' -> ' + w + ' @' + Math.round(S.t) + 's');
      }
    }
    return out.join('\n') + '\n' + fs.map(f => f + ' ' + wins[f].w + '/' + wins[f].g).join('  ');
  }, [1, 2, 3]));
  await b.close();
})();
