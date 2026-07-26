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
  /** 直播专属：昵称入卡 */
  nickname?: string;
  /** 直播专属：唯一签号（如「第 7 签 · 当日唯一」） */
  cardNo?: string;
  /** 直播专属：个人拈选行（昵称种子化，一人一签，如「为你拈得 · 二候 土润溽暑」） */
  personal?: string[];
}

const KAI = '"Kaiti SC","KaiTi","STKaiti","Noto Serif SC","Songti SC",serif';

const INK = '#2b2620';
const INK_SOFT = '#5c5548';
const INK_FAINT = '#8a8070';
const CINNABAR = '#9e2b25';
const PAPER = '#f6f1e5';
const LINE = '#d8cdb4';

/** 圆角矩形路径（兼容无原生 roundRect 的环境） */
function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 中文按字符宽度折行 */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
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

  if (d.cardNo) {
    ctx.textAlign = 'right';
    ctx.fillStyle = CINNABAR;
    ctx.font = `22px ${KAI}`;
    ctx.fillText(d.cardNo, W - 70, 88);
    ctx.textAlign = 'center';
  }

  if (d.nickname) {
    ctx.fillStyle = CINNABAR;
    ctx.font = `26px ${KAI}`;
    ctx.fillText(`为  @${d.nickname}  制`, W / 2, 152);
  }

  // 节气名：直播签卡上节气是众人相同信息，收小让位；个人拈选做主角
  const hasPersonal = !!(d.personal && d.personal.length > 0);
  ctx.fillStyle = INK;
  ctx.font = hasPersonal ? `92px ${KAI}` : `132px ${KAI}`;
  ctx.fillText(d.termName, W / 2, hasPersonal ? 252 : 268);

  ctx.fillStyle = INK_SOFT;
  ctx.font = hasPersonal ? `22px ${KAI}` : `26px ${KAI}`;
  ctx.fillText(`${d.pinyin} · ${d.longitude}`, W / 2, hasPersonal ? 298 : 322);

  if (!hasPersonal) {
    // 观俗应用分享卡原版布局（无个人拈选，保持不变）
    ctx.fillStyle = CINNABAR;
    ctx.fillRect(W / 2 - 40, 352, 80, 4);
    ctx.fillStyle = INK;
    ctx.font = `30px ${KAI}`;
    ctx.fillText(d.dateLabel, W / 2, 424);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `26px ${KAI}`;
    ctx.fillText(d.pillars, W / 2, 468);
    ctx.fillStyle = CINNABAR;
    ctx.font = `26px ${KAI}`;
    ctx.fillText(d.daysText, W / 2, 512);
  } else {
    // 直播签卡：日期干支（当日众人相同）淡化为一行小字
    ctx.fillStyle = INK_FAINT;
    ctx.font = `20px ${KAI}`;
    ctx.fillText([d.dateLabel, d.pillars, d.daysText].filter(Boolean).join(' · '), W / 2, 340);

    // 主角区：个人拈选（一人一签）朱砂浅底横幅，字号按行宽自适应防出格
    ctx.fillStyle = '#efe3d0';
    ctx.strokeStyle = CINNABAR;
    ctx.lineWidth = 2;
    roundedRectPath(ctx, 70, 372, W - 140, 218, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CINNABAR;
    ctx.font = `20px ${KAI}`;
    ctx.fillText('为 你 生 成 · 一 人 一 张', W / 2, 412);
    ctx.fillStyle = INK;
    d.personal!.slice(0, 3).forEach((p, i) => {
      let f = 27;
      while (f > 19) {
        ctx.font = `${f}px ${KAI}`;
        if (ctx.measureText(p).width <= W - 220) break;
        f -= 1;
      }
      ctx.font = `${f}px ${KAI}`;
      ctx.fillText(p, W / 2, 462 + i * 42);
    });
  }

  // 三候（众人相同，直播签卡淡化处理）
  const phStart = hasPersonal ? 648 : 586;
  ctx.fillStyle = hasPersonal ? INK_FAINT : INK;
  ctx.font = hasPersonal ? `22px ${KAI}` : `28px ${KAI}`;
  d.phenology.forEach((p, i) => ctx.fillText(p, W / 2, phStart + i * (hasPersonal ? 34 : 44)));

  // 民俗摘录（直播签卡：更小字、更少行，只做背景氛围）
  ctx.textAlign = 'left';
  ctx.font = hasPersonal ? `20px ${KAI}` : `24px ${KAI}`;
  ctx.fillStyle = INK_SOFT;
  const lines = wrapText(ctx, d.customs, W - 160).slice(0, hasPersonal ? 3 : 6);
  lines.forEach((l, i) => ctx.fillText(l, 80, (hasPersonal ? 792 : 748) + i * (hasPersonal ? 30 : 38)));

  // 诗（直播签卡淡化）
  ctx.textAlign = 'center';
  ctx.fillStyle = hasPersonal ? INK_FAINT : INK;
  ctx.font = hasPersonal ? `24px ${KAI}` : `30px ${KAI}`;
  ctx.fillText(`「${d.poemLine}」`, W / 2, hasPersonal ? 940 : 972);
  ctx.fillStyle = INK_FAINT;
  ctx.font = hasPersonal ? `19px ${KAI}` : `22px ${KAI}`;
  ctx.fillText(`—— ${d.poemSource}`, W / 2, hasPersonal ? 974 : 1010);

  // 页脚
  ctx.font = `18px ${KAI}`;
  ctx.fillText('节气民俗 · 传统文化分享 · 观俗 GUANSU', W / 2, hasPersonal ? 1030 : 1050);
}

/** ============ 执镜签（直播引文卡） ============ */

export interface MirrorCardData {
  nickname: string;
  serviceName: string;   // 签品名，如「执镜签」
  themeLabel: string;    // 本周主题，如「选择与纠结」
  traditionName: string; // 庄子 / 道德经 / 孙子兵法 / 毛泽东选集
  lens: string;          // 换视角 / 做减法 / 评估代价 / 逼拿事实
  quoteText: string;
  quoteSource: string;
  ask: string;
  experiment: string;
  /** 唯一签号（如「第 7 签」） */
  cardNo?: string;
  /** 签品名号（如「水镜签 · 第廿三号」），印在卡面左上 */
  lotName?: string;
  /** 今解：这面镜子能给持签人带来什么（由镜类自动生成） */
  interpretation?: string;
}

export function drawMirrorCard(canvas: HTMLCanvasElement, d: MirrorCardData): void {
  const W = 720;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, W - 56, H - 56);
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, W - 72, H - 72);

  ctx.textAlign = 'center';
  ctx.fillStyle = INK_FAINT;
  ctx.font = `20px ${KAI}`;
  ctx.fillText(`执 镜 · ${d.serviceName}`, W / 2, 104);

  if (d.cardNo) {
    ctx.textAlign = 'right';
    ctx.fillStyle = CINNABAR;
    ctx.font = `22px ${KAI}`;
    ctx.fillText(d.cardNo, W - 70, 88);
    ctx.textAlign = 'center';
  }
  if (d.lotName) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3d5a52';
    ctx.font = `22px ${KAI}`;
    ctx.fillText(d.lotName, 70, 88);
    ctx.textAlign = 'center';
  }

  ctx.fillStyle = CINNABAR;
  ctx.font = `28px ${KAI}`;
  ctx.fillText(`赠  @${d.nickname}`, W / 2, 156);

  ctx.fillStyle = INK_FAINT;
  ctx.font = `20px ${KAI}`;
  ctx.fillText(`本周主题 · ${d.themeLabel}    镜子 · ${d.traditionName}「${d.lens}」`, W / 2, 196);

  ctx.fillStyle = CINNABAR;
  ctx.fillRect(W / 2 - 40, 216, 80, 4);

  // 引文（朱砂引号线 + 居中折行，按长度自适应字号：长文自动降号，杜绝出格）
  ctx.fillStyle = CINNABAR;
  ctx.fillRect(88, 268, 5, 300);
  ctx.fillStyle = INK;
  let qFont = 34;
  let qLH = 52;
  let qLines = wrapText(ctx, `「${d.quoteText}」`, W - 220);
  if (qLines.length > 4) {
    ctx.font = `28px ${KAI}`;
    qFont = 28;
    qLH = 44;
    qLines = wrapText(ctx, `「${d.quoteText}」`, W - 220);
  }
  qLines = qLines.slice(0, qFont === 34 ? 4 : 5);
  ctx.font = `${qFont}px ${KAI}`;
  qLines.forEach((l, i) => ctx.fillText(l, W / 2 + 12, 320 + i * qLH));
  ctx.fillStyle = INK_SOFT;
  ctx.font = `24px ${KAI}`;
  const srcY = 334 + qLines.length * qLH;
  ctx.fillText(`—— ${d.quoteSource}`, W / 2 + 12, srcY);

  // 今解：这面镜子能给你带来什么（固定版面，自动由镜类生成，非断语）
  if (d.interpretation) {
    const iy = Math.min(Math.max(srcY + 44, 580), 600);
    ctx.fillStyle = '#3d5a52';
    ctx.font = `20px ${KAI}`;
    const iLines = wrapText(ctx, `今解 · ${d.interpretation}`, W - 200).slice(0, 2);
    iLines.forEach((l, i) => ctx.fillText(l, W / 2 + 12, iy + i * 32));
  }

  // 镜问
  ctx.textAlign = 'left';
  ctx.fillStyle = CINNABAR;
  ctx.font = `24px ${KAI}`;
  ctx.fillText('镜  问', 80, 660);
  ctx.fillStyle = INK;
  ctx.font = `26px ${KAI}`;
  const aLines = wrapText(ctx, d.ask, W - 160).slice(0, 3);
  aLines.forEach((l, i) => ctx.fillText(l, 80, 704 + i * 40));

  // 小实验
  ctx.fillStyle = '#3d5a52';
  ctx.font = `24px ${KAI}`;
  ctx.fillText('可执行小实验', 80, 660 + 52 + aLines.length * 40);
  ctx.fillStyle = INK_SOFT;
  ctx.font = `24px ${KAI}`;
  const eLines = wrapText(ctx, d.experiment, W - 160).slice(0, 3);
  const eY = 704 + 52 + aLines.length * 40;
  eLines.forEach((l, i) => ctx.fillText(l, 80, eY + i * 38));

  // 页脚（雷同合规信息，淡化）
  ctx.textAlign = 'center';
  ctx.fillStyle = INK_FAINT;
  ctx.font = `18px ${KAI}`;
  ctx.fillText('经典引文 · 只提供看问题的角度 · 非医疗法律财务建议', W / 2, 1014);
  ctx.fillText('执镜 ZHIJING', W / 2, 1046);
}
