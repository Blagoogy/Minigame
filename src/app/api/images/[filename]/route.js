// app/api/images/[filename]/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export async function GET(request, context) {
    try {
        // --- THIS IS THE FIX ---
        // Await context.params to get the actual parameters object.
        // Then, destructure filename from the awaited result.
        const { filename } = await context.params;
        // --- END FIX ---

        // Basic security: Prevent path traversal
        // Now you can safely use the resolved 'filename' variable
        if (!filename || typeof filename !== 'string' || filename.includes('..') || filename.includes('/')) {
            console.log(`Invalid filename detected: ${filename}`);
            return NextResponse.json({ message: 'Invalid filename' }, { status: 400 });
        }

        const filePath = path.join(UPLOAD_DIR, filename);
        console.log(`Attempting to access file: ${filePath}`); // Log the path

        // Check if file exists and is readable
        try {
             await fs.promises.access(filePath, fs.constants.R_OK);
             console.log(`File access check passed for: ${filePath}`);
        } catch (err) {
             console.error(`File not found or not readable: ${filePath}`, err);
             return NextResponse.json({ message: 'Image not found' }, { status: 404 });
        }

        // Get file stats for size
        const stats = await fs.promises.stat(filePath);
        const contentType = mime.lookup(filePath) || 'application/octet-stream';
        console.log(`Serving file: ${filename}, Type: ${contentType}, Size: ${stats.size}`);


        // Read the file content
        const fileBuffer = await fs.promises.readFile(filePath);

        // Create the response
        const response = new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': stats.size.toString(),
                // 'Cache-Control': 'public, max-age=3600', // Optional
            },
        });

        return response;

    } catch (error) {
        // Log the error more specifically, especially if filename resolution failed
        console.error(`Server error in GET /api/images/[filename] route:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error processing image request', error: errorMessage }, { status: 500 });
    }
}
