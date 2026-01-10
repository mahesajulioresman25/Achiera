import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
    try {

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validate file type (images only)
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validate file size (max 10MB for designs)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
        }

        // Generate unique filename
        const filename = `design-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

        // Convert to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage (bucket: 'uploads')
        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(`designs/${filename}`, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(`designs/${filename}`);

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }
}
