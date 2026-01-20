import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}-${originalName}`;

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage (bucket: 'uploads')
        // Ensure you have a bucket named 'uploads' (or 'public') in your Supabase Storage
        const { data, error } = await supabase
            .storage
            .from('uploads') // Defaulting to 'uploads' bucket
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            // Fallback to 'public' bucket if 'uploads' doesn't exist? 
            // For now, let's assume 'uploads' exists or fail.
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        return NextResponse.json({
            url: publicUrl,
            filename,
            size: file.size,
            type: file.type
        });

    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: `Failed to upload file: ${error.message}` }, { status: 500 });
    }
}
