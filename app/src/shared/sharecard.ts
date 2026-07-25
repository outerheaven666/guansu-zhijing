/** 节气分享卡片：Canvas 绘制 720×1080 PNG，供微信/小红书分享 */

export interface ShareCardData {
  termName: string;
  pinyin: string;
  longitude: string;
  dateLabel: string;
  pillars: string;
  daysText: string;
  phenology: string[];
  customs: string;
  poemLine: string;
  poemSource: string;
}

const KAI = '"Kaiti SC","KaiTi","STKaiti","Noto Serif SC","Songti SC",serif';

const INK = '#2b2620';
const INK_SOFT = '#5c5548';
const CINNABAR = '#9e2b25';
const PAPER = '#f6f1e5';
const LINE = '#d8cdb4';

/** 中文按字符宽度折行 */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const ch of text) {
    const next = line + ch;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function drawShareCard(canvas: HTMLCanvasElement, d: ShareCardData): void {
  const W = 720;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // 纸面
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // 双线框
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 72, H - 72);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `24px ${KAI}`;
  ctx.fillText('观 俗 · 二 十 四 节 气', W / 2, 108);

  // 节气名
  ctx.fillStyle = INK;
  ctx.font = `132px ${KAI}`;
  ctx.fillText(d.termName, W / 2, 268);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `26px ${KAI}`;
  ctx.fillText(`${d.pinyin} · ${d.longitude}`, W / 2, 322);

  // 朱砂短线
  ctx.fillStyle = CINNABAR;
  ctx.fillRect(W / 2 - 40, 352, 80, 4);

  // 日期与干支
  ctx.fillStyle = INK;
  ctx.font = `30px ${KAI}`;
  ctx.fillText(d.dateLabel, W / 2, 424);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `26px ${KAI}`;
  ctx.fillText(d.pillars, W / 2, 468);
  ctx.fillStyle = CINNABAR;
  ctx.font = `26px ${KAI}`;
  ctx.fillText(d.daysText, W / 2, 512);

  // 三候
  ctx.fillStyle = INK;
  ctx.font = `28px ${KAI}`;
  d.phenology.forEach((p, i) => ctx.fillText(p, W / 2, 586 + i * 44));

  // 民俗摘录（最多 6 行）
  ctx.textAlign = 'left';
  ctx.font = `24px ${KAI}`;
  ctx.fillStyle = INK_SOFT;
  const lines = wrapText(ctx, d.customs, W - 160).slice(0, 6);
  lines.forEach((l, i) => ctx.fillText(l, 80, 748 + i * 38));

  // 诗
  ctx.textAlign = 'center';
  ctx.fillStyle = INK;
  ctx.font = `30px ${KAI}`;
  ctx.fillText(`「${d.poemLine}」`, W / 2, 972);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `22px ${KAI}`;
  ctx.fillText(`—— ${d.poemSource}`, W / 2, 1010);

  // 页脚
  ctx.font = `20px ${KAI}`;
  ctx.fillText('文化理解，而非预测 · 观俗 GUANSU', W / 2, 1050);
}
