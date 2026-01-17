
/**
 * Utility to compress images on the client side using Canvas API.
 * This helps avoid 413 Payload Too Large errors on server actions.
 */
export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.75): Promise<File> {
    // If file is already reasonably small (< 200KB) and not a huge dimension, don't bother
    if (file.size < 200 * 1024) return file;

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
                    (blob) => {
                        if (blob) {
                            // Ensure the output is JPEG to keep size down
                            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                            const compressedFile = new File([blob], fileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });

                            // If it's still > 2MB, try one more pass with lower quality
                            if (compressedFile.size > 2 * 1024 * 1024 && quality > 0.5) {
                                resolve(compressImage(compressedFile, maxWidth * 0.8, maxHeight * 0.8, quality - 0.2));
                            } else {
                                resolve(compressedFile);
                            }
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
