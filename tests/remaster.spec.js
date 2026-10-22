import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

async function openGame(page) {
  await page.goto("/tests/harness.html");
  await page.waitForFunction(() => window.game);
}

test("real entry point initializes without runtime errors", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForTimeout(1500);
  await page.keyboard.press("Enter");
  await page.keyboard.press("l");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1000);
  expect(errors).toEqual([]);
});

for (const locale of ["en", "ja"]) {
  test(`${locale}: layouts, language switching, all screens`, async ({ page }, testInfo) => {
    await page.addInitScript(value => localStorage.setItem("moonlit-spell-barrage.locale", value), locale);
    await openGame(page);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.keyboard.press("Enter");
    for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [1920, 1200], [2560, 1080]]) {
      await page.setViewportSize({ width, height });
      const box = await page.locator("canvas").boundingBox();
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.002);
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeLessThanOrEqual(height);
      expect(Math.abs(box.x - (width - box.width) / 2)).toBeLessThan(1);
      expect(Math.abs(box.y - (height - box.height) / 2)).toBeLessThan(1);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({ path: testInfo.outputPath(`${locale}-title.png`) });
    // The visible canvas button must use scaled pointer coordinates correctly.
    await page.mouse.click(180, 666);
    await expect(page.locator("html")).toHaveAttribute("lang", locale === "ja" ? "en" : "ja");
    await page.keyboard.press("l");
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await page.keyboard.press("Enter");
    await page.keyboard.press("Escape");
    const before = await page.evaluate(() => ({ score: game.scene.score, time: game.scene.time, hp: game.scene.player.hp }));
    await page.keyboard.press("l");
    const after = await page.evaluate(() => ({ score: game.scene.score, time: game.scene.time, hp: game.scene.player.hp }));
    expect(after).toEqual(before);
    await page.keyboard.press("l");
    await page.screenshot({ path: testInfo.outputPath(`${locale}-pause.png`) });
    // Exercise result/transition layouts with the real scene and renderer.
    const screens = ["playing", "stageClearPause", "stageTransition", "gameover", "clear", "ending"];
    for (const state of screens) {
      await page.evaluate(state => {
        const { scene: s, app } = game;
        app.ticker.stop();
        s.start({ stageDebug: state === "clear" ? 4 : 3, bossDebug: state === "playing" });
        if (state === "playing") { s.update(0); s.boss.entered = true; s.boss.pos.y = 145; s.update(0); }
        if (state === "stageClearPause") s.beginStageClearPause();
        if (state === "stageTransition") { s.currentStageIndex = 0; s.beginNextStage(); }
        if (state === "gameover") { s.state = state; s.finishRun("GAME OVER"); }
        if (state === "clear") { s.state = state; s.finishRun("STAGE CLEAR"); s.clearInputTimer = 0; s.refreshClearResultText(true); }
        if (state === "ending") { s.beginEnding(); s.updateEndingState(60); }
        s.updateHud(); s.updateClearResult(1); app.renderer.render(app.stage);
      }, state);
      const overflow = await page.evaluate(() => {
        const s = game.scene;
        const texts = [...s.sideHud.container.children.filter(c => typeof c.text === "string"), s.overlay, s.overlayPrompt, s.clearTitle, s.clearStats, s.clearHint, s.clearPrompt];
        return texts.filter(c => c.visible && c.parent?.visible && c.text).map(c => ({ text: c.text, b: c.getBounds() })).filter(({ b }) => b.x < 0 || b.y < 0 || b.maxX > 1921 || b.maxY > 1081).map(({ text }) => text);
      });
      expect(overflow).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${state}.png`) });
    }
  });
}

test("locale detection, persistence, unavailable storage and old score isolation", async ({ browser }) => {
  for (const locale of ["ja-JP", "en-US"]) {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await page.addInitScript(() => {
      localStorage.setItem("moonlit-spell-barrage.highScores", '{"casual":12345,"normal":23456,"lunatic":34567}');
      localStorage.setItem("moonlit-spell-barrage.highScore", "45678");
    });
    await openGame(page);
    await expect(page.locator("html")).toHaveAttribute("lang", locale.slice(0, 2));
    expect(await page.evaluate(() => game.scene.highScores)).toEqual({ casual: 0, normal: 0, lunatic: 0 });
    await page.keyboard.press("Enter"); await page.keyboard.press("l");
    await page.evaluate(() => game.scene.saveHighScores({ casual: 42, normal: 0, lunatic: 0 }));
    await page.reload(); await page.waitForFunction(() => window.game);
    expect(await page.evaluate(() => game.scene.highScores.casual)).toBe(42);
    await expect(page.locator("html")).toHaveAttribute("lang", locale.startsWith("ja") ? "en" : "ja");
    expect(await page.evaluate(() => localStorage.getItem("moonlit-spell-barrage.highScore"))).toBe("45678");
    expect(JSON.parse(await page.evaluate(() => localStorage.getItem("moonlit-spell-barrage.highScores")))).toEqual({ casual: 12345, normal: 23456, lunatic: 34567 });
    await context.close();
  }
  const context = await browser.newContext({ locale: "ja-JP" });
  const page = await context.newPage();
  await page.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } }); });
  await openGame(page); await page.keyboard.press("Enter"); await page.keyboard.press("l");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.evaluate(() => game.scene.saveHighScores({ casual: 1, normal: 0, lunatic: 0 }));
  await context.close();
});

test("actual enemy and boss shells: HP 8, three Lv1 hits, single award, no penetration", async ({ page }) => {
  await openGame(page);
  const results = await page.evaluate(async () => {
    const { Enemy } = await import("/src/systems/Enemy.ts");
    const { Boss } = await import("/src/systems/Boss.ts");
    const { difficulties } = await import("/src/systems/Difficulty.ts");
    const { scene: s, app } = game; app.ticker.stop();
    const results = [];
    for (let i = 0; i < difficulties.length; i++) {
      s.difficultyIndex = i; s.start();
      const enemy = new Enemy({ time: 0, x: 360, y: 200, hp: 50, pattern: "breakableWall" }, difficulties[i]);
      enemy.update(1, s.bullets, s.player.pos);
      const boss = new Boss(difficulties[i], "cosmicSorcerer");
      boss.fireBreakableRing(s.bullets, 10); boss.fireBreakableComets(s.bullets, 12);
      const shells = s.bullets.bullets.filter(b => b.kind === "shell");
      const hps = shells.map(b => b.hp);
      const shell = shells[0]; shell.pos = { x: 300, y: 300 };
      for (const other of shells.slice(1)) s.bullets.kill(other);
      const hits = [];
      for (let hit = 0; hit < 3; hit++) {
        s.bullets.spawn("player", "orb", shell.pos, { x: 0, y: 0 }, 7, 3);
        const shot = s.bullets.bullets.at(-1);
        s.resolveCollisions(); hits.push({ hp: shell.hp, alive: shell.alive, shotAlive: shot.alive, score: s.score });
      }
      s.resolveCollisions(); s.resolveCollisions();
      s.player.pos.x = shell.pos.x; s.player.pos.y = shell.pos.y; s.player.invincible = 0;
      s.resolveCollisions();
      results.push({ hps, hits, playerHp: s.player.hp, score: s.score, award: Math.round(35 * difficulties[i].score) });
      enemy.destroy(); boss.container.destroy();
    }
    return results;
  });
  for (const result of results) {
    expect(result.hps.length).toBeGreaterThan(22);
    expect(result.hps.every(hp => hp === 8)).toBe(true);
    expect(result.hits.map(h => h.hp)).toEqual([5, 2, -1]);
    expect(result.hits.map(h => h.alive)).toEqual([true, true, false]);
    expect(result.hits.every(h => !h.shotAlive)).toBe(true);
    expect(result.hits.map(h => h.score)).toEqual([0, 0, result.award]);
    expect(result.score).toBe(result.award);
    expect(result.playerHp).toBe(3);
  }
});

test("keyboard play, gamepad language button, and every localized boss HUD", async ({ page }, testInfo) => {
  await openGame(page);
  await page.keyboard.press("Enter");
  const initial = await page.locator("html").getAttribute("lang");
  await page.evaluate(() => {
    window.pad = { axes: [0, 0], buttons: Array.from({ length: 16 }, () => ({ pressed: false })) };
    Object.defineProperty(navigator, "getGamepads", { value: () => [window.pad] });
    window.pad.buttons[3].pressed = true;
  });
  await expect(page.locator("html")).toHaveAttribute("lang", initial === "ja" ? "en" : "ja");
  await page.evaluate(() => { window.pad.buttons[3].pressed = false; });
  await page.keyboard.press("Enter");
  const x = await page.evaluate(() => game.scene.player.pos.x);
  await page.keyboard.down("ArrowLeft"); await page.keyboard.down("z");
  await page.waitForTimeout(600);
  await page.keyboard.up("ArrowLeft");
  expect(await page.evaluate(() => game.scene.player.pos.x)).toBeLessThan(x);
  expect(await page.evaluate(() => game.scene.bullets.bullets.some(b => b.owner === "player"))).toBe(true);
  await page.keyboard.press("x");
  expect(await page.evaluate(() => game.scene.bombs)).toBe(1);
  await page.keyboard.up("z"); await page.keyboard.press("Escape");
  expect(await page.evaluate(() => game.scene.state)).toBe("paused");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(600);
  await page.screenshot({ path: testInfo.outputPath("keyboard-play.png") });
  const issues = await page.evaluate(async () => {
    const { setLocale } = await import("/src/systems/I18n.ts");
    const { scene: s, app } = game; app.ticker.stop();
    const issues = [];
    for (const locale of ["en", "ja"]) {
      setLocale(locale);
      for (let stage = 1; stage <= 4; stage++) {
        s.start({ stageDebug: stage, bossDebug: true }); s.update(0);
        for (let phase = 0; phase < 5; phase++) {
          s.boss.phase = phase; s.updateHud();
          const text = s.sideHud.encounter;
          if (text.getBounds().maxY >= 885) issues.push({ locale, stage, phase, text: text.text });
        }
      }
    }
    return issues;
  });
  expect(issues).toEqual([]);
});

test("four stages, every boss phase, and sustained Lv1 fire through stage 3 shells", async ({ page }, testInfo) => {
  test.setTimeout(180000);
  await openGame(page);
  const result = await page.evaluate(async () => {
    const { scene: s, app } = game; app.ticker.stop(); s.audio.toggleMute();
    const logs = [];
    for (const difficulty of [0, 1, 2]) {
      s.difficultyIndex = difficulty;
      for (let stage = 1; stage <= 4; stage++) {
        s.start({ stageDebug: stage });
        let enemies = 0, fire = 0, lasers = 0;
        for (let frame = 0; frame < 60 * (s.currentStage.bossStartTime + 3); frame++) {
          s.player.invincible = 999; s.update(1 / 60);
          enemies = Math.max(enemies, s.enemies.length);
          fire = Math.max(fire, s.bullets.bullets.filter(b => b.kind === "fire" || b.kind === "homingFire").length);
          lasers = Math.max(lasers, s.bullets.lasers.length);
        }
        logs.push({ type: "stage", stage, difficulty, enemies, fire, lasers });
        for (let phase = 0; phase < 5; phase++) {
          s.start({ stageDebug: stage, bossDebug: true }); s.update(0);
          s.power = 0; s.boss.entered = true; s.boss.pos.y = 145;
          s.boss.hp = s.boss.maxHp * (stage === 3 ? [0.99, 0.65, 0.38, 0.25, 0.12][phase] : 0.99 - phase * 0.2);
          s.boss.update(0, s.bullets, s.player.pos); s.bossPhase = s.boss.getPhase();
          const initial = s.boss.hp;
          s.input.keyboardKeys.add("z");
          let shells = 0, fire = 0, lasers = 0;
          for (let frame = 0; frame < 60 * 10; frame++) {
            s.player.invincible = 999;
            // Track the boss while respecting the player's maximum lateral speed.
            s.player.pos.x += Math.max(-330 / 60, Math.min(330 / 60, s.boss.pos.x - s.player.pos.x));
            s.update(1 / 60);
            shells = Math.max(shells, s.bullets.bullets.filter(b => b.kind === "shell").length);
            fire = Math.max(fire, s.bullets.bullets.filter(b => b.kind === "fire" || b.kind === "homingFire").length);
            lasers = Math.max(lasers, s.bullets.lasers.length);
          }
          s.input.keyboardKeys.clear();
          logs.push({ type: "boss", stage, phase, difficulty, damage: initial - s.boss.hp, shells, fire, lasers });
        }
      }
    }
    return logs;
  });
  await writeFile(testInfo.outputPath("balance-simulation.json"), JSON.stringify(result, null, 2));
  await testInfo.attach("balance-simulation.json", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
  expect(result.filter(r => r.type === "stage").every(r => r.enemies > 0)).toBe(true);
  expect(result.filter(r => r.type === "boss").every(r => r.damage > 0)).toBe(true);
  const shells = result.filter(r => r.type === "boss" && r.stage === 3 && r.phase >= 2);
  expect(shells.every(r => r.shells > 0 && r.damage >= 60)).toBe(true);
  expect(result.some(r => r.stage === 4 && r.fire > 0)).toBe(true);
  expect(result.some(r => r.stage === 4 && r.lasers > 0)).toBe(true);
});
