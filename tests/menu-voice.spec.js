import { test, expect } from "@playwright/test";

async function open(page) {
  await page.goto("/tests/harness.html");
  await page.waitForFunction(() => window.game);
  await page.keyboard.press("Enter");
}

test("difficulty menu remembers selection; Beginner rules and title-only language", async ({ page }, testInfo) => {
  await open(page);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => game.scene.state)).toBe("difficulty");
  expect(await page.evaluate(() => game.scene.player.hp)).toBe(5);
  const locale = await page.locator("html").getAttribute("lang");
  await page.keyboard.press("l");
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await page.keyboard.press("4");
  await page.screenshot({ path: testInfo.outputPath("difficulty-menu.png") });
  await page.keyboard.press("Escape");
  await page.reload(); await page.waitForFunction(() => window.game);
  await page.keyboard.press("Enter"); await page.keyboard.press("Enter");
  expect(await page.evaluate(() => game.scene.difficulty.id)).toBe("lunatic");
  await page.keyboard.press("1"); await page.keyboard.press("Enter");
  const result = await page.evaluate(() => {
    const s = game.scene;
    const start = { hp: s.player.hp, power: s.power, difficulty: s.difficulty.id };
    s.player.invincible = 0;
    s.bullets.spawn("enemy", "orb", s.player.pos, { x: 0, y: 0 }, 9, 1);
    s.resolveCollisions();
    return { start, hp: s.player.hp, power: s.power };
  });
  expect(result).toEqual({ start: { hp: 5, power: 120, difficulty: "beginner" }, hp: 4, power: 120 });
  await page.keyboard.press("Escape"); await page.keyboard.press("l");
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  expect(await page.evaluate(() => game.scene.sideHud.languageBackground.visible)).toBe(false);
  await page.evaluate(() => game.scene.showTitle()); await page.keyboard.press("l");
  await expect(page.locator("html")).toHaveAttribute("lang", locale === "ja" ? "en" : "ja");
  expect(await page.evaluate(() => game.scene.endingCredits.children.some(c => c.text === "Inspired by Touhou Project"))).toBe(true);
});

for (const locale of ["ja", "en"]) {
  test(`${locale}: score extend plays its voice independently of translated text`, async ({ page }) => {
    await page.addInitScript(locale => localStorage.setItem("moonlit-spell-barrage.locale", locale), locale);
    await open(page);
    const before = await page.evaluate(() => {
      const { scene: s, app } = game;
      app.ticker.stop();
      s.start();
      s.audio.stopVoice();
      s.score = s.nextExtendScore - 1;
      const hp = s.player.hp;
      s.addScore(2);
      return hp;
    });
    await page.waitForFunction(() => game.scene.audio.voiceId === "playerExtend" && game.scene.audio.voice.currentTime > 0);
    expect(await page.evaluate(() => game.scene.player.hp)).toBe(before + 1);
    expect(await page.evaluate(() => game.scene.banner.text)).toBe(locale === "ja" ? "残機追加" : "EXTEND");
    expect(await page.evaluate(() => game.scene.audio.voice.volume)).toBeGreaterThan(0);
    await page.evaluate(() => {
      const s = game.scene;
      s.audio.stopVoice();
      s.awardLife("BOSS BONUS");
    });
    expect(await page.evaluate(() => game.scene.player.hp)).toBe(before + 2);
    expect(await page.evaluate(() => game.scene.audio.voiceActive)).toBe(false);
  });
}

for (const stage of [1, 2, 3, 4]) {
  test(`stage ${stage}: long intro voice plays to completion before boss combat`, async ({ page }, testInfo) => {
    await page.addInitScript(locale => localStorage.setItem("moonlit-spell-barrage.locale", locale), stage % 2 === 0 ? "ja" : "en");
    await open(page);
    await page.evaluate(stage => {
      const s = game.scene;
      s.start({ stageDebug: stage, bossDebug: true });
    }, stage);
    await page.waitForFunction(() => game.scene.preBossIntroActive && game.scene.audio.voice?.currentTime > 0.1);
    const voice = await page.evaluate(() => ({ duration: game.scene.audio.voice.duration, id: game.scene.audio.voiceId, boss: game.scene.boss, volume: game.scene.audio.voice.volume }));
    expect(voice.duration).toBeGreaterThan(20);
    expect(voice.id).toBe(`stage${stage}PreBossBattle`);
    expect(voice.volume).toBeGreaterThan(0);
    expect(voice.boss).toBeNull();
    // Advancing scene time alone must not cut off a long spoken introduction.
    await page.evaluate(() => {
      game.scene.updatePreBossIntro(12);
      game.scene.audio.powerUp();
    });
    expect(await page.evaluate(() => game.scene.preBossIntroActive)).toBe(true);
    expect(await page.evaluate(() => game.scene.audio.voiceId)).toBe(`stage${stage}PreBossBattle`);
    await page.screenshot({ path: testInfo.outputPath(`stage${stage}-intro.png`) });
    // Let the actual media element fire its ended event after seeking near the end.
    await page.evaluate(() => { game.scene.audio.voice.currentTime = game.scene.audio.voice.duration - 0.15; });
    await page.waitForFunction(() => !game.scene.preBossIntroActive && game.scene.boss);
    expect(await page.evaluate(() => game.scene.audio.voiceActive)).toBe(false);
    await page.evaluate(() => game.scene.playBossPhaseVoice(0));
    await page.waitForFunction(() => game.scene.audio.voice?.currentTime > 0.1);
    expect(await page.evaluate(() => game.scene.audio.voiceId)).toBe(`stage${stage}Phase1`);
    await page.evaluate(() => game.scene.showTitle());
    expect(await page.evaluate(() => game.scene.audio.voiceActive)).toBe(false);
  });
}
