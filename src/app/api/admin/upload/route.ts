import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage (bucket: 'uploads', folder: 'mockups')
        const filename = `mockups/upload-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw uploadError;
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: `Failed to upload file: ${error.message}` }, { status: 500 });
    }
}
