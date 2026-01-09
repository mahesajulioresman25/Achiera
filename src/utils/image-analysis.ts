/**
 * Detects the number of distinct colors in an image.
 * Uses a distance threshold to group similar colors (handling anti-aliasing/compression artifacts).
 */
export async function detectColors(imageSrc: string): Promise<{ count: number, colors: string[] }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageSrc;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve({ count: 1, colors: ['#000000'] });
                return;
            }

            // Downscale for performance (max 500px dimension)
            const MAX_SIZE = 500;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const uniqueColors: { r: number, g: number, b: number }[] = [];
            const THRESHOLD = 30; // Delta E or RGB distance threshold

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                // Ignore transparent pixels
                if (a < 128) continue;

                // Check if color is similar to any existing unique color
                let isNewColor = true;
                for (const color of uniqueColors) {
                    const dist = Math.sqrt(
                        Math.pow(r - color.r, 2) +
                        Math.pow(g - color.g, 2) +
                        Math.pow(b - color.b, 2)
                    );

                    if (dist < THRESHOLD) {
                        isNewColor = false;
                        break;
                    }
                }

                if (isNewColor) {
                    uniqueColors.push({ r, g, b });
                }

                // Safety break for performance/spam
                if (uniqueColors.length > 20) {
                    break;
                }
            }

            // Convert to Hex
            const hexColors = uniqueColors.map(c =>
                "#" + ((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1).toUpperCase()
            );

            resolve({
                count: uniqueColors.length,
                colors: hexColors
            });
        };

        img.onerror = (err) => {
            console.error("Error loading image for color detection", err);
            resolve({ count: 1, colors: [] });
        };
    });
}
