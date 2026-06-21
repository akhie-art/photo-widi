import { EventConfig, PlacedSticker } from "../hooks/usePhotoboothStore";

export interface RenderOptions {
  photos: string[]; // array of base64 data urls (captured webcam frames)
  layout: "strip" | "grid" | "polaroid";
  config: EventConfig;
  placedStickers?: PlacedSticker[];
}

export async function renderPhotoStrip({
  photos,
  layout,
  config,
  placedStickers,
}: RenderOptions): Promise<string> {
  const activeTemplate =
    config.presetTemplates?.find((p) => p.id === config.activePresetTemplateId) ||
    config.presetTemplates?.[0];

  const isCustomFrame = !!activeTemplate;

  return new Promise((resolve, reject) => {
    // Load all photos as HTMLImageElements first
    const imagePromises = photos.map((src) => {
      return new Promise<HTMLImageElement>((res, rej) => {
        if (!src) {
          rej(new Error("Image source is empty or invalid"));
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = (e) => rej(e);
        img.src = src;
      });
    });

    // Preload image-based stickers
    const imageStickers = (placedStickers || []).filter((placed) => {
      const asset = config.customStickers?.find((s) => s.id === placed.stickerId);
      if (!asset) return false;
      return (
        asset.imageUrl.startsWith("data:") ||
        asset.imageUrl.includes("/") ||
        asset.imageUrl.startsWith("http")
      );
    });

    const stickerPromises = imageStickers.map((placed) => {
      const asset = config.customStickers.find((s) => s.id === placed.stickerId)!;
      return new Promise<{ id: string; img: HTMLImageElement }>((res) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res({ id: placed.id, img });
        img.onerror = () => res({ id: placed.id, img: new Image() });
        img.src = asset.imageUrl;
      });
    });

    const overlayPromise = new Promise<HTMLImageElement | null>((res) => {
      if (activeTemplate?.imageOverlay) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = activeTemplate.imageOverlay;
      } else {
        res(null);
      }
    });

    Promise.all([Promise.all(imagePromises), Promise.all(stickerPromises), overlayPromise])
      .then(([loadedImages, loadedStickerImages, loadedOverlayImg]) => {
        const stickerImgMap = new Map<string, HTMLImageElement>();
        loadedStickerImages.forEach((item) => {
          stickerImgMap.set(item.id, item.img);
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get 2D context"));
          return;
        }

        const { frameStyle, frameText, eventName, location } = config;

        // Configuration based on layout or custom template
        if (isCustomFrame && activeTemplate) {
          const padding = 0;
          const is2R = activeTemplate.paperSize === "2R" || !activeTemplate.paperSize;
          const w = is2R ? 591 : 1205;
          const totalH = is2R ? 1772 : 1795;
          const scaleX = w / 500;
          const scaleY = totalH / 1202.5;

          canvas.width = w;
          canvas.height = totalH;

          drawBackground(ctx, w, totalH, frameStyle, !!activeTemplate?.imageOverlay);

          const slots = (activeTemplate.customSlots && activeTemplate.customSlots.length > 0)
            ? activeTemplate.customSlots
            : [{ id: "default_0", xPct: 5, yPct: 5, widthPct: 90, heightPct: 90, rotation: 0 }];

          const collatorR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
          const sortedSlots = [...slots].sort((a, b) => collatorR.compare(a.id, b.id));

          sortedSlots.forEach((slot, i) => {
            const img = loadedImages[i];
            if (!img) return;

            const sw = (slot.widthPct / 100) * 500 * scaleX;
            const sh = (slot.heightPct / 100) * 1202.5 * scaleY;
            const sx = (slot.xPct / 100) * 500 * scaleX;
            const sy = (slot.yPct / 100) * 1202.5 * scaleY;
            const angle = ((slot.rotation || 0) * Math.PI) / 180;

            if (!loadedOverlayImg) {
              drawPhotoContainer(ctx, img, sx, sy, sw, sh, frameStyle, i);
            } else {
              ctx.save();
              const cx = sx + sw / 2;
              const cy = sy + sh / 2;
              ctx.translate(cx, cy);
              ctx.rotate(angle);
              ctx.beginPath();
              ctx.rect(-sw / 2, -sh / 2, sw, sh);
              ctx.clip();

              const imgAspect = img.width / img.height;
              const slotAspect = sw / sh;
              let sx_crop = 0, sy_crop = 0, sw_crop = img.width, sh_crop = img.height;
              if (imgAspect > slotAspect) {
                sw_crop = img.height * slotAspect;
                sx_crop = (img.width - sw_crop) / 2;
              } else {
                sh_crop = img.width / slotAspect;
                sy_crop = (img.height - sh_crop) / 2;
              }
              ctx.drawImage(img, sx_crop, sy_crop, sw_crop, sh_crop, -sw / 2, -sh / 2, sw, sh);
              ctx.restore();
            }
          });

          if (loadedOverlayImg) {
            const overlayX = activeTemplate.overlayX ?? 0;
            const overlayY = activeTemplate.overlayY ?? 0;
            const overlayW = activeTemplate.overlayW ?? 100;
            const overlayH = activeTemplate.overlayH ?? 100;

            const ow = (overlayW / 100) * 500 * scaleX;
            const oh = (overlayH / 100) * 1202.5 * scaleY;
            const ox = (overlayX / 100) * 500 * scaleX;
            const oy = (overlayY / 100) * 1202.5 * scaleY;
            const oAngle = ((activeTemplate.overlayRotation ?? 0) * Math.PI) / 180;

            ctx.save();
            ctx.translate(ox + ow / 2, oy + oh / 2);
            ctx.rotate(oAngle);
            ctx.drawImage(loadedOverlayImg, -ow / 2, -oh / 2, ow, oh);
            ctx.restore();
          }
        } else if (layout === "strip") {
          // Classic vertical strip: width 500px, 4 photos vertically
          const w = 500;
          const padding = 25;
          const photoW = w - padding * 2; // 450px
          const photoH = Math.round(photoW * (3 / 4)); // 337.5px (4:3 aspect ratio)
          const gap = 15;
          const footerH = 110;

          const totalH = padding + (loadedImages.length * photoH) + ((loadedImages.length - 1) * gap) + footerH + padding;

          canvas.width = w;
          canvas.height = totalH;

          // 1. Draw Frame Background
          drawBackground(ctx, w, totalH, frameStyle, false);

          // 2. Draw Photos
          loadedImages.forEach((img, index) => {
            const y = padding + index * (photoH + gap);
            drawPhotoContainer(ctx, img, padding, y, photoW, photoH, frameStyle, index);
          });

          // 3. Draw Footer Text
          drawFooterText(ctx, w, totalH, footerH, padding, config);

        } else if (layout === "grid") {
          // 2x2 grid: width 800px, height based on square photos
          const w = 800;
          const padding = 40;
          const gap = 25;
          const photoW = (w - padding * 2 - gap) / 2; // 347.5px
          const photoH = photoW; // 1:1 square
          const footerH = 130;

          const totalH = padding + (2 * photoH) + gap + footerH + padding;

          canvas.width = w;
          canvas.height = totalH;

          drawBackground(ctx, w, totalH, frameStyle, false);

          // Draw up to 4 images
          const positions = [
            { x: padding, y: padding },
            { x: padding + photoW + gap, y: padding },
            { x: padding, y: padding + photoH + gap },
            { x: padding + photoW + gap, y: padding + photoH + gap },
          ];

          loadedImages.slice(0, 4).forEach((img, index) => {
            const pos = positions[index];
            drawPhotoContainer(ctx, img, pos.x, pos.y, photoW, photoH, frameStyle, index);
          });

          drawFooterText(ctx, w, totalH, footerH, padding, config);

        } else {
          // Polaroid layout
          const padding = 35;
          const w = 600;
          const photoW = w - padding * 2;
          const photoH = photoW;
          const footerH = 140;
          const totalH = padding + photoH + footerH + padding;

          canvas.width = w;
          canvas.height = totalH;

          drawBackground(ctx, w, totalH, frameStyle, false);

          if (loadedImages[0]) {
            drawPhotoContainer(ctx, loadedImages[0], padding, padding, photoW, photoH, frameStyle, 0);
          }

          drawFooterText(ctx, w, totalH, footerH, padding, config);
        }

        const drawStickers = () => {
          if (placedStickers && placedStickers.length > 0 && config.customStickers) {
            placedStickers.forEach((placed) => {
              const asset = config.customStickers.find((s) => s.id === placed.stickerId);
              if (!asset) return;

              const x = (placed.xPct / 100) * canvas.width;
              const y = (placed.yPct / 100) * canvas.height;
              const scaleWidth = (placed.scalePct / 100) * canvas.width;

              ctx.save();
              ctx.translate(x, y);
              ctx.rotate((placed.rotation * Math.PI) / 180);

              const isImg =
                asset.imageUrl.startsWith("data:") ||
                asset.imageUrl.includes("/") ||
                asset.imageUrl.startsWith("http");

              if (isImg) {
                const img = stickerImgMap.get(placed.id);
                if (img && img.width > 0) {
                  const aspect = img.height / img.width;
                  const scaleHeight = scaleWidth * aspect;
                  ctx.drawImage(img, -scaleWidth / 2, -scaleHeight / 2, scaleWidth, scaleHeight);
                }
              } else {
                ctx.font = `${scaleWidth}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(asset.imageUrl, 0, 0);
              }
              ctx.restore();
            });
          }
        };

        drawStickers();
        resolve(canvas.toDataURL("image/png"));
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  style: string,
  hasOverlay?: boolean
) {
  if (hasOverlay) {
    // Keep background transparent for templates with custom overlays
    return;
  }
  if (style === "neon") {
    // Dark deep blue-indigo space background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#0b0813");
    grad.addColorStop(1, "#150e29");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (style === "classic-white") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  } else if (style === "classic-black") {
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);
  } else if (style === "pastel") {
    // Pastel cotton candy gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#ffdcd9");
    grad.addColorStop(0.5, "#fae8ff");
    grad.addColorStop(1, "#e0e7ff");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (style === "filmstrip") {
    ctx.fillStyle = "#18181b"; // dark charcoal
    ctx.fillRect(0, 0, w, h);
    
    // Draw sprocket holes on left and right for filmstrip look
    ctx.fillStyle = "#09090b"; // black holes
    const holeW = 12;
    const holeH = 16;
    const holeGap = 20;
    
    for (let y = 15; y < h - 15; y += holeH + holeGap) {
      // Left sprocket hole
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(8, y, holeW, holeH, 3) : ctx.rect(8, y, holeW, holeH);
      ctx.fill();

      // Right sprocket hole
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(w - 8 - holeW, y, holeW, holeH, 3) : ctx.rect(w - 8 - holeW, y, holeW, holeH);
      ctx.fill();
    }
  } else {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }
}

function drawPhotoContainer(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  style: string,
  index: number
) {
  ctx.save();

  if (style === "neon") {
    // Neon glow borders
    ctx.shadowColor = index % 2 === 0 ? "#00ffff" : "#ff00ff";
    ctx.shadowBlur = 10;
    ctx.strokeStyle = index % 2 === 0 ? "#00ffff" : "#ff00ff";
    ctx.lineWidth = 4;
    
    // Draw photo container border
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 6) : ctx.rect(x, y, w, h);
    ctx.stroke();

    // Clip image to container
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x + 2, y + 2, w - 4, h - 4, 4) : ctx.rect(x + 2, y + 2, w - 4, h - 4);
    ctx.clip();

  } else if (style === "classic-white") {
    // Elegant border
    ctx.strokeStyle = "#e4e4e7";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.clip();

  } else if (style === "classic-black") {
    // Elegant border
    ctx.strokeStyle = "#27272a";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    ctx.beginPath();
    ctx.rect(x + 2, y + 2, w - 4, h - 4);
    ctx.clip();

  } else if (style === "pastel") {
    // Soft pastel rounded cards
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 5;
    
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 16) : ctx.rect(x, y, w, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x + 2.5, y + 2.5, w - 5, h - 5, 13) : ctx.rect(x + 2.5, y + 2.5, w - 5, h - 5);
    ctx.clip();
  } else if (style === "filmstrip") {
    // Center alignment offsets to keep away from sprocket holes
    const adjustedX = x + 10;
    const adjustedW = w - 20;
    
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 2;
    ctx.strokeRect(adjustedX, y, adjustedW, h);

    ctx.beginPath();
    ctx.rect(adjustedX + 1, y + 1, adjustedW - 2, h - 2);
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
  }

  // Draw image cropped & centered
  const imgAspect = img.width / img.height;
  const containerAspect = w / h;
  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (style === "filmstrip") {
    drawW = w - 20;
    drawX = x + 10;
  }

  if (imgAspect > containerAspect) {
    // Image is wider than container - crop sides
    const scale = h / img.height;
    const sW = img.height * containerAspect;
    const sx = (img.width - sW) / 2;
    ctx.drawImage(img, sx, 0, sW, img.height, drawX, drawY, drawW, drawH);
  } else {
    // Image is taller than container - crop top/bottom
    const scale = w / img.width;
    const sH = img.width / containerAspect;
    const sy = (img.height - sH) / 2;
    ctx.drawImage(img, 0, sy, img.width, sH, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
}

function drawFooterText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  footerH: number,
  padding: number,
  config: EventConfig
) {
  // Disabled as templates already have their own designs and no dynamic text is needed
  return;
  const { eventName, date, location, frameText, frameStyle } = config;
  const centerY = h - footerH / 2 - 10;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  if (frameStyle === "neon") {
    // Cyan glow event name
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Outfit', 'Segoe UI', sans-serif";
    ctx.fillText(eventName.toUpperCase(), w / 2, centerY - 15);

    // Fuchsia glow caption text
    ctx.shadowColor = "#ff00ff";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#ff80ff";
    ctx.font = "italic 15px 'Segoe UI', sans-serif";
    ctx.fillText(frameText, w / 2, centerY + 15);

    // Tiny details
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6b7280";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${location}  •  ${date}`, w / 2, centerY + 40);

  } else if (frameStyle === "classic-white") {
    ctx.fillStyle = "#09090b";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(eventName, w / 2, centerY - 15);

    ctx.fillStyle = "#71717a";
    ctx.font = "13px sans-serif";
    ctx.fillText(frameText, w / 2, centerY + 12);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${location} | ${date}`, w / 2, centerY + 33);

  } else if (frameStyle === "classic-black") {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px Georgia, serif";
    ctx.fillText(eventName, w / 2, centerY - 15);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "13px sans-serif";
    ctx.fillText(frameText, w / 2, centerY + 12);

    ctx.fillStyle = "#52525b";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${location} | ${date}`, w / 2, centerY + 33);

  } else if (frameStyle === "pastel") {
    ctx.fillStyle = "#4c1d95"; // deep purple
    ctx.font = "bold 22px 'Comic Sans MS', sans-serif";
    ctx.fillText(eventName, w / 2, centerY - 15);

    ctx.fillStyle = "#db2777"; // dark pink
    ctx.font = "bold 15px sans-serif";
    ctx.fillText(frameText, w / 2, centerY + 12);

    ctx.fillStyle = "#7c3aed";
    ctx.font = "11px sans-serif";
    ctx.fillText(`${location}  •  ${date}`, w / 2, centerY + 35);
  } else if (frameStyle === "filmstrip") {
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "bold 20px 'Courier New', monospace";
    ctx.fillText(`[ ${eventName} ]`, w / 2, centerY - 15);

    ctx.fillStyle = "#a1a1aa";
    ctx.font = "13px 'Courier New', monospace";
    ctx.fillText(frameText, w / 2, centerY + 12);

    ctx.fillStyle = "#71717a";
    ctx.font = "11px 'Courier New', monospace";
    ctx.fillText(`LOC: ${location} // DATE: ${date}`, w / 2, centerY + 33);
  }

  ctx.restore();
}
