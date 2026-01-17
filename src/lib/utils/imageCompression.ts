/**
 * Utility to compress images on the client side using Canvas API.
 * This helps avoid 413 Payload Too Large errors on server actions.
 */
export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.6): Promise<File> {
    // If file is already reasonably small (< 150KB) and not a huge dimension, don't bother
    if (file.size < 150 * 1024 && file.type === 'image/jpeg') return file;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file); // Fallback to original
                    return;
                }

                // Draw with high quality scaling if needed, but simple drawImage is usually fine for this
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    async (blob) => {
                        if (blob) {
                            // Ensure the output is JPEG to keep size down
                            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                            let compressedFile = new File([blob], fileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });

                            console.log(`[ImageCompression] ${file.name}: ${Math.round(file.size / 1024)}KB -> ${Math.round(compressedFile.size / 1024)}KB`);

                            // Extreme fallback: if still > 1.5MB, force even smaller
                            if (compressedFile.size > 1.5 * 1024 * 1024 && quality > 0.3) {
                                console.warn(`[ImageCompression] Target still too large (${Math.round(compressedFile.size / 1024)}KB), re-compressing...`);
                                compressedFile = await compressImage(compressedFile, maxWidth * 0.7, maxHeight * 0.7, quality - 0.2);
                            }

                            resolve(compressedFile);
                        } else {
                            resolve(file); // Fallback to original
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
}
