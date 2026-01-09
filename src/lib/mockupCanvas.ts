
export interface LogoTransform {
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
}

export interface RenderParams {
    ctx: CanvasRenderingContext2D;
    canvasWidth: number;
    canvasHeight: number;
    productImg: HTMLImageElement;
    logoImg: HTMLImageElement | null;
    logoTransform?: LogoTransform;
    safeZone?: { x: number; y: number; width: number; height: number };
    showSafeZone?: boolean;
    backgroundColor?: string;

    // New Params for Tinting
    tintMaskImg?: HTMLImageElement | null;
    productColor?: string;
}

export function renderMockupCanvas({
    ctx,
    canvasWidth,
    canvasHeight,
    productImg,
    logoImg,
    logoTransform,
    safeZone,
    showSafeZone = false,
    backgroundColor = '',
    tintMaskImg = null,
    productColor = ''
}: RenderParams) {
    // 1. Clear & Background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 2. Draw Product Base
    // Fit Contain logic
    const scale = Math.min(canvasWidth / productImg.width, canvasHeight / productImg.height);
    const w = productImg.width * scale;
    const h = productImg.height * scale;
    const x = (canvasWidth - w) / 2;
    const y = (canvasHeight - h) / 2;

    ctx.drawImage(productImg, x, y, w, h);

    // 3. Apply Tint Mask (if available and color selected)
    if (tintMaskImg && productColor) {
        // Create offscreen canvas for tinting
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvasWidth;
        offCanvas.height = canvasHeight;
        const offCtx = offCanvas.getContext('2d');

        if (offCtx) {
            // Draw Mask
            offCtx.drawImage(tintMaskImg, x, y, w, h);

            // source-in to keep only the mask shape
            offCtx.globalCompositeOperation = 'source-in';
            offCtx.fillStyle = productColor;
            offCtx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Draw tinted mask over product (Multiply for realistic shading)
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.drawImage(offCanvas, 0, 0);
            ctx.restore();

            // Optional: Draw again with 'soft-light' or 'overlay' if multiply is too dark?
            // Usually Multiply on a white base works best. 
            // If the base image is already shaded gray, multiply works perfectly.
        }
    }

    // 4. Draw Logo
    if (logoImg && logoTransform) {
        ctx.save();

        // Move to logo center
        ctx.translate(logoTransform.x, logoTransform.y);
        ctx.rotate((logoTransform.rotation * Math.PI) / 180);

        // Draw centered
        try {
            ctx.drawImage(
                logoImg,
                -logoTransform.width / 2,
                -logoTransform.height / 2,
                logoTransform.width,
                logoTransform.height
            );
        } catch (e) {
            // ignore if image not ready
        }

        ctx.restore();
    }

    // 5. Safe Zone Overlay
    if (showSafeZone && safeZone) {
        ctx.save();
        ctx.strokeStyle = '#d97706'; // amber-600
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);

        // Semi-transparent fill
        ctx.fillStyle = 'rgba(217, 119, 6, 0.1)';
        ctx.fillRect(safeZone.x, safeZone.y, safeZone.width, safeZone.height);
        ctx.restore();
    }
}
