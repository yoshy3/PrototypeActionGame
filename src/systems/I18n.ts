export type Locale = "ja" | "en";
export const UI_FONT = ["Yu Gothic", "Meiryo", "Noto Sans JP", "Arial", "sans-serif"];
export const LOCALE_KEY = "moonlit-spell-barrage.locale";

export const ja = {
  "Lives": "残機", "Bombs": "ボム", "Power": "パワー", "Shot level": "ショットレベル",
  "Score": "スコア", "Best": "ハイスコア", "Graze": "グレイズ", "Difficulty": "難易度",
  "Next extend": "次の残機追加まで", "Stage progress": "ステージ進行度", "Phase": "フェーズ",
  "Casual": "カジュアル", "Normal": "ノーマル", "Lunatic": "ルナティック",
  "Sound On": "音声 ON", "Sound Off": "音声 OFF", "SOUND ON": "音声 ON", "SOUND OFF": "音声 OFF",
  "Controls": "操作方法", "Player": "プレイヤー", "Records": "プレイ記録",
  "Move: Arrow / WASD / Pad": "移動：矢印 / WASD / パッド",
  "Shoot: Z / Space / Pad A": "ショット：Z / Space / パッド A",
  "Bomb: X / Pad X": "ボム：X / パッド X",
  "Focus: Shift / RB": "低速移動：Shift / RB",
  "Pause: Esc / Start": "一時停止：Esc / Start",
  "Sound: M": "音声切替：M",
  "Auto-collect above the line": "ラインより上でアイテム自動回収",
  "Graze bullets for bonus score": "敵弾の近くをかすめると加点",
  "Left/Right or 1-3 to change": "左右キー / 1〜3 で難易度選択",
  "Z / SPACE to start": "Z / SPACE で開始",
  "Z / SPACE to title": "Z / SPACE でタイトルへ",
  "Hold Z / SPACE to title": "Z / SPACE 長押しでタイトルへ",
  "PAUSED\n\nEsc/Start to resume\nR to retry": "一時停止\n\nEsc / Start で再開\nR でリトライ",
  "CLICK OR PRESS ANY KEY\nGAMEPAD BUTTON": "クリック / キー入力\nまたはパッドのボタンで開始",
  "GAME OVER": "ゲームオーバー", "STAGE CLEAR": "ステージクリア", "CLEAR": "クリア",
  "NEW RECORD": "新記録", "RUN COMPLETE": "プレイ終了", "R to retry": "R でリトライ",
  "Please wait...": "しばらくお待ちください…", "Press Z / SPACE for ending": "Z / SPACE でエンディングへ",
  "NEXT STAGE\nGet ready": "次のステージへ\n準備してください", "NEXT STAGE": "次のステージへ",
  "Press Z / SPACE": "Z / SPACE を押してください", "WARNING": "警告", "SPELL": "スペル",
  "POWER UP": "パワーアップ", "Level": "レベル", "EXTEND": "残機追加", "BOSS BONUS": "ボス撃破ボーナス",
  "+1 LIFE": "残機 +1", "+GRAZE": "+グレイズ", "+BOMB": "+ボム", "+ITEM": "+アイテム",
  "BOSS DEBUG\nFull power start": "ボス検証\n最大パワーで開始", "Full power debug start": "最大パワーで検証開始",
  "B: Stage 1 boss   V/C/F: Stage 2/3/4\nN/G/H: Stage 2/3/4 boss   E: Ending": "B：ボス1  V/C/F：ステージ2/3/4\nN/G/H：ボス2/3/4  E：エンディング",
  "Inspired by Touhou Project": "東方Projectに着想を得て", "Staff": "スタッフ",
  "Programmer": "プログラム", "Graphics Artist": "グラフィック", "Music Composer": "音楽", "SFX Designer": "効果音",
  "Game Initialization Error": "ゲームの初期化に失敗しました",
  "Error": "エラー", "Stack trace": "スタックトレース", "No stack trace available": "スタックトレースはありません",
  "Stage 1": "ステージ1", "Stage 2": "ステージ2", "Stage 3": "ステージ3", "Stage 4": "ステージ4",
  "Moonlit shrine approach": "月明かりの参道", "Starlight crystal corridor": "星明かりの水晶回廊",
  "Asteroid spell belt": "小惑星の魔法帯", "Fire storm": "炎の嵐",
  "Lunar Witch approaches": "月の魔女が接近", "Starlight Oracle descends": "星明かりの巫女が降臨",
  "Cosmic Sorcerer opens the belt": "宇宙の魔術師が小惑星帯を開く", "Salamander rises from the storm": "炎の嵐からサラマンダー出現",
  "Lunar Witch": "月の魔女", "Starlight Oracle": "星明かりの巫女", "Cosmic Sorcerer": "宇宙の魔術師", "Salamander": "サラマンダー",
  "Crystal Dawn Ray": "水晶の暁光", "Astral Crosslight": "星界の交差光", "Prism Diagonal Gate": "プリズムの斜光門",
  "Starlight Meridian": "星明かりの子午線", "Oracle's Luminous Verdict": "巫女の光輝の裁定",
  "Asteroid Sigil": "小惑星の印章", "Comet Thread Spiral": "彗星糸の螺旋", "Celestial Ring Gate": "天球の環門",
  "Meteor Grimoire": "流星の魔導書", "Cosmic Belt Finale": "宇宙帯の終幕",
  "Cinderfall Rain": "降り注ぐ火の粉", "Volcanic Flame Wheel": "火山の炎輪", "Magma Serpent Gate": "溶岩蛇の門",
  "Firestorm Caldera": "炎嵐のカルデラ", "Salamander Inferno": "サラマンダーの業火",
  "Moonlit Petal Ring": "月夜の花弁輪", "Starfall Spiral": "降星の螺旋", "Lunar Butterfly Storm": "月蝶の嵐",
  "Eclipse Star Bloom": "月食の星華", "Full Moon Finale": "満月の終幕"
} as const;

export type MessageKey = keyof typeof ja;
export const en: Record<MessageKey, string> = Object.fromEntries(Object.keys(ja).map(key => [key, key])) as Record<MessageKey, string>;
let locale: Locale = "en";

export function initializeLocale(): Locale {
  let saved: string | null = null;
  try { saved = localStorage.getItem(LOCALE_KEY); } catch { /* Storage is optional. */ }
  locale = saved === "ja" || saved === "en" ? saved : navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";
  document.documentElement.lang = locale;
  return locale;
}

export function getLocale(): Locale { return locale; }
export function setLocale(value: Locale) {
  locale = value;
  document.documentElement.lang = value;
  try { localStorage.setItem(LOCALE_KEY, value); } catch { /* Keep the session selection. */ }
}
export function t(key: MessageKey): string { return locale === "ja" ? ja[key] : en[key]; }
