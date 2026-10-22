import { test, expect } from "@playwright/test";

for (const locale of ["ja", "en"]) {
  test(`${locale}: HUD keeps long names and large counters inside sidebars`, async ({ page }, testInfo) => {
    await page.addInitScript(value => localStorage.setItem("moonlit-spell-barrage.locale", value), locale);
    await page.goto("/tests/harness.html");
    await page.waitForFunction(() => window.game);
    await page.evaluate(locale => {
      const { scene, app } = window.game;
      app.ticker.stop();
      scene.start();
      scene.sideHud.update({
        lives: 12, bombs: 12, power: 120, level: 4, score: 999999999, best: 999999999,
        graze: 999999, difficulty: locale === "ja" ? "ルナティック" : "Lunatic",
        nextExtend: 999999999, muted: true, stage: "", subtitle: "", progress: 1,
        boss: {
          name: locale === "ja" ? "星明かりの巫女" : "Starlight Oracle",
          spell: locale === "ja" ? "巫女の光輝の裁定" : "Oracle's Luminous Verdict",
          hp: 12345, maxHp: 99999, phase: 5, thresholds: [0.2, 0.4, 0.6, 0.8]
        },
        canChangeLanguage: false, inRun: true
      });
      app.renderer.render(app.stage);
    }, locale);
    const layout = await page.evaluate(() => {
      const hud = window.game.scene.sideHud;
      const fields = [...hud.fields].filter(([, text]) => text.parent === hud.container && text.visible && text.text);
      return {
        overflow: fields.filter(([, text]) => {
          const b = text.getBounds();
          return b.y < 16 || b.maxY > 1064 || (b.x < 555 ? b.x < 16 || b.maxX > 539 : b.x < 1381 || b.maxX > 1904);
        }).map(([id]) => id),
        lives: hud.fields.get("lives").text,
        bombs: hud.fields.get("bombs").text,
        languageVisible: hud.languageButton.visible,
        score: hud.fields.get("score").text
      };
    });
    expect(layout.overflow).toEqual([]);
    expect(layout.lives).toBe("12");
    expect(layout.bombs).toBe("12");
    expect(layout.score).toBe("999,999,999");
    expect(layout.languageVisible).toBe(false);
    for (const [width, height] of [[1280, 720], [1366, 768], [1920, 1080], [1920, 1200], [2560, 1080]]) {
      await page.setViewportSize({ width, height });
      const box = await page.locator("canvas").boundingBox();
      expect(Math.abs(box.width / box.height - 16 / 9)).toBeLessThan(0.002);
      expect(box.width).toBeLessThanOrEqual(width);
      expect(box.height).toBeLessThanOrEqual(height);
      await page.screenshot({ path: testInfo.outputPath(`${locale}-${width}x${height}.png`) });
    }
  });
}
