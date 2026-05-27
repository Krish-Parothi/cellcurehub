import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/upload
 * 
 * Secure file upload endpoint. Accepts FormData with:
 *   - file(s): one or more image files
 *   - folder: string path prefix for organizing files (e.g. "repair-photos/{repairId}/pre")
 * 
 * Security:
 *   - Validates Supabase auth session from cookies
 *   - Bucket name read from server-side env (never exposed to browser)
 *   - File type validation (images only)
 *   - File size validation (max 10MB per file)
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate via Supabase session cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Read-only context, safe to ignore
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Read bucket name from env (server-side only)
    const bucketName = process.env.STORAGE_BUCKET_NAME;
    if (!bucketName) {
      console.error('[UPLOAD] STORAGE_BUCKET_NAME not configured');
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    // 3. Parse FormData
    const formData = await request.formData();
    const folder = formData.get('folder') as string | null;

    if (!folder || typeof folder !== 'string') {
      return NextResponse.json({ error: 'Missing "folder" field' }, { status: 400 });
    }

    // Collect all file entries
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key === 'file' && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // 4. Validate and upload each file
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Type check
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        );
      }

      // Size check
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 10MB` },
          { status: 400 }
        );
      }

      // Generate unique path
      const ext = file.name.split('.').pop() || 'jpg';
      const uniqueName = `${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const path = `${folder}/${uniqueName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[UPLOAD] Storage upload failed:', uploadError.message);
        return NextResponse.json(
          { error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(path);

      uploadedUrls.push(publicUrl);
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (err) {
    console.error('[UPLOAD] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
