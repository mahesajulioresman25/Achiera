
/**
 * Utility to compress images on the client side using Canvas API.
 * This helps avoid 413 Payload Too Large errors on server actions.
 */
export async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.8): Promise<File> {
    // If file is already small (< 500KB), don't bother compressing
    if (file.size < 500 * 1024) return file;

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

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });

                            // Only return compressed if it's actually smaller
                            if (compressedFile.size < file.size) {
                                resolve(compressedFile);
                            } else {
                                resolve(file);
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
