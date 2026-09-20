import { createFriendReader, spriteFrame } from '@rarefriends/friendsdk/sprites';

export type FriendSpriteData = Awaited<ReturnType<ReturnType<typeof createFriendReader>['read']>>;

const reader = createFriendReader();
const spriteCache = new Map<string, FriendSpriteData>();

export async function loadFriendSprite(friendId: bigint): Promise<FriendSpriteData> {
  const key = friendId.toString();
  if (spriteCache.has(key)) {
    return spriteCache.get(key)!;
  }
  const data = await reader.read(friendId);
  spriteCache.set(key, data);
  return data;
}

export function drawFriend(
  ctx: CanvasRenderingContext2D,
  spriteData: FriendSpriteData,
  screenX: number,
  screenY: number,
  facing: 'up' | 'down' | 'left' | 'right',
  isWalking: boolean,
  timeMs: number,
  options: {
    reducedMotion?: boolean;
    scale?: number;
    showScarf?: boolean;
    scarfColor?: string;
    isFlappingAngels?: boolean;
    hasSantaHat?: boolean;
    santaSuit?: boolean;
  } = {}
) {
  const {
    reducedMotion = false,
    scale = 1.0,
    showScarf = true,
    scarfColor = '#38BDF8',
    isFlappingAngels = false,
    hasSantaHat = false,
    santaSuit = false
  } = options;

  ctx.save();

  // 1. Soft snow footprint / ground shadow
  if (!isFlappingAngels) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 4 * scale, 22 * scale, 9 * scale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(186, 214, 240, 0.45)';
    ctx.fill();
    ctx.restore();
  }

  // 2. Sprite frame extraction
  const side = facing === 'left' ? 'left' : 'right';
  const walkFrame = reducedMotion ? 0 : Math.floor(timeMs / 110) % 8;
  const frameObj = spriteFrame(spriteData, facing, isWalking, walkFrame, side);
  const rows = frameObj.frame.rows;

  const pixelSize = 4.5 * scale;
  const boxSize = 16 * pixelSize;
  const left = Math.round(screenX - boxSize / 2);
  const top = Math.round(screenY - boxSize + 6 * scale);

  // Parse pixels
  const pixels: [number, number][] = [];
  for (let py = 0; py < rows.length; py++) {
    const row = rows[py];
    for (let px = 0; px < row.length; px++) {
      if (row[px] === '#') {
        pixels.push([px, py]);
      }
    }
  }

  // If laying in snow for snow angel
  if (isFlappingAngels) {
    ctx.translate(screenX, screenY);
    ctx.rotate(Math.sin(timeMs * 0.008) * 0.1);
    ctx.translate(-screenX, -screenY);
  }

  // White halo / silhouette outline
  ctx.fillStyle = '#FFFFFF';
  for (const [px, py] of pixels) {
    ctx.fillRect(
      left + px * pixelSize - pixelSize * 0.6,
      top + py * pixelSize - pixelSize * 0.6,
      pixelSize * 2.2,
      pixelSize * 2.2
    );
  }

  // Core canonical black mask
  ctx.fillStyle = '#0F172A';
  for (const [px, py] of pixels) {
    ctx.fillRect(
      left + px * pixelSize,
      top + py * pixelSize,
      pixelSize,
      pixelSize
    );
  }

  // Winter Scarf accessory
  if (showScarf && !isFlappingAngels && !santaSuit) {
    const neckY = top + 9 * pixelSize;
    const neckX = left + 4 * pixelSize;
    const neckW = 8 * pixelSize;
    const neckH = 2.5 * pixelSize;

    ctx.fillStyle = scarfColor;
    ctx.fillRect(neckX, neckY, neckW, neckH);

    // Draping scarf tail with gentle sway
    const sway = Math.sin(timeMs * 0.004) * (2 * scale);
    ctx.fillRect(
      side === 'left' ? neckX + neckW - 3 * pixelSize : neckX + 1 * pixelSize,
      neckY + neckH,
      3 * pixelSize,
      5 * pixelSize + sway
    );

    // Warm fringe
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
      side === 'left' ? neckX + neckW - 3 * pixelSize : neckX + 1 * pixelSize,
      neckY + neckH + 5 * pixelSize + sway - 1.5 * scale,
      3 * pixelSize,
      1.5 * scale
    );
  }

  // Santa Suit (Red coat, black belt, golden buckle)
  if (santaSuit && !isFlappingAngels) {
    const coatY = top + 9 * pixelSize;
    const coatX = left + 3 * pixelSize;
    const coatW = 10 * pixelSize;
    const coatH = 6 * pixelSize;

    // Red coat base
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(coatX, coatY, coatW, coatH);

    // Black belt
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(coatX, coatY + 2.5 * pixelSize, coatW, 1.8 * pixelSize);

    // Golden belt buckle
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(coatX + coatW / 2 - 1.6 * pixelSize, coatY + 2.2 * pixelSize, 3.2 * pixelSize, 2.4 * pixelSize);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(coatX + coatW / 2 - 0.8 * pixelSize, coatY + 2.6 * pixelSize, 1.6 * pixelSize, 1.6 * pixelSize);

    // Fluffy white bottom trim
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(coatX - 0.5 * pixelSize, coatY + coatH - 1 * pixelSize, coatW + 1 * pixelSize, 1.5 * pixelSize);
  }

  // Santa Hat Accessory
  if (hasSantaHat && !isFlappingAngels) {
    const hatBaseY = top + 1 * pixelSize;
    const hatBaseX = left + 2 * pixelSize;
    const hatW = 12 * pixelSize;
    const tipSway = Math.sin(timeMs * 0.005) * (3 * scale);

    // Red conical hat
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(hatBaseX, hatBaseY);
    ctx.lineTo(hatBaseX + hatW, hatBaseY);
    // Tip curves to the side
    const tipX = side === 'left' ? hatBaseX - 3 * pixelSize + tipSway : hatBaseX + hatW + 3 * pixelSize + tipSway;
    const tipY = hatBaseY - 10 * pixelSize;
    ctx.quadraticCurveTo(hatBaseX + hatW * 0.5, hatBaseY - 8 * pixelSize, tipX, tipY);
    ctx.closePath();
    ctx.fill();

    // White fur brim
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(hatBaseX - 1 * pixelSize, hatBaseY - 1.5 * pixelSize, hatW + 2 * pixelSize, 3.2 * pixelSize, 3 * scale);
    ctx.fill();

    // Fluffy white pom-pom at tip
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(tipX, tipY, 3.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cold breath puff animation (subtle winter immersion)
  if (!reducedMotion && Math.sin(timeMs * 0.003) > 0.7) {
    const breathPhase = (timeMs * 0.003) % 1;
    const breathX = facing === 'left' ? left - 6 * scale : left + boxSize + 2 * scale;
    const breathY = top + 6 * pixelSize - breathPhase * 8 * scale;
    ctx.beginPath();
    ctx.arc(breathX, breathY, (2 + breathPhase * 3) * scale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 - breathPhase * 0.35})`;
    ctx.fill();
  }

  ctx.restore();
}
