'use server';

import { supabase } from '@/lib/supabase';

/**
 * Upload product image to Supabase Storage
 */
export async function uploadProductImage(formData: FormData) {
    try {
        const file = formData.get('image') as File;
        if (!file) {
            return { success: false, error: 'No file provided' };
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.'
            };
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return {
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Generate unique filename
        const ext = file.name.split('.').pop();
        const filename = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            return { success: false, error: error.message };
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        return {
            success: true,
            path: publicUrl
        };
    } catch (error: any) {
        console.error('Image Upload Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload image'
        };
    }
}

/**
 * Upload multiple product images
 * Returns array of image paths
 */
export async function uploadMultipleProductImages(formData: FormData) {
    try {
        const files = formData.getAll('images') as File[];
        if (!files || files.length === 0) {
            return { success: false, error: 'No files provided' };
        }

        // Limit to 5 images
        if (files.length > 5) {
            return {
                success: false,
                error: 'Maximum 5 images allowed'
            };
        }

        const uploadedPaths: string[] = [];

        for (const file of files) {
            const singleFormData = new FormData();
            singleFormData.append('image', file);

            const result = await uploadProductImage(singleFormData);

            if (!result.success) {
                return result; // Return error from first failed upload
            }

            uploadedPaths.push(result.path!);
        }

        return {
            success: true,
            paths: uploadedPaths
        };
    } catch (error: any) {
        console.error('Multiple Image Upload Error:', error);
        return {
            success: false,
            error: error.message || 'Failed to upload images'
        };
    }
}
