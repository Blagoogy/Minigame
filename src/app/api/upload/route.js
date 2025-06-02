import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // Use promises version of fs
import path from 'path';

// Define the upload directory path
// Ensure this directory exists or create it if it doesn't
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Helper function to ensure the upload directory exists
async function ensureUploadDirExists() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        console.log(`Upload directory ensured: ${UPLOAD_DIR}`);
    } catch (error) {
        console.error("Could not create upload directory:", error);
        // Optionally re-throw or handle appropriately
        throw new Error("Failed to ensure upload directory exists.");
    }
}

export async function POST(req) { // req is the standard Web API Request object
    console.log("POST /api/upload hit"); // Log when the route is hit

    try {
        // 1. Ensure the upload directory exists before processing
        await ensureUploadDirExists();

        // 2. Parse the FormData from the request
        const formData = await req.formData();
        console.log("FormData parsed");

        // 3. Get the file from the FormData object
        //    'imageFile' must match the name attribute in your HTML input field <input name="imageFile" .../>
        const file = formData.get('imageFile');

        // 4. Basic validation
        if (!file) {
            console.log("No file found in FormData");
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });
        }

        // Check if it's actually a file (it could be a string if the field name is wrong)
         if (!(file instanceof Blob)) { // In Node.js runtime, uploaded files are Blobs (which includes File)
             console.log("Uploaded item is not a file/blob");
             return NextResponse.json({ message: 'Uploaded item is not a file' }, { status: 400 });
         }

        console.log(`File received: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

        // 5. Get the file content as an ArrayBuffer, then convert to Buffer
        //    Blobs have arrayBuffer() method
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        console.log("File buffer created");

        // 6. Create a unique filename (important!)
        const uniqueFilename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`; // Sanitize filename slightly
        const filePath = path.join(UPLOAD_DIR, uniqueFilename);
        console.log(`Saving file to: ${filePath}`);

        // 7. Write the file to the filesystem
        await fs.writeFile(filePath, fileBuffer);
        console.log("File written successfully");

        // 8. Respond with success and the filename
        return NextResponse.json({
            message: 'File uploaded successfully!',
            filename: uniqueFilename, // Send the generated filename back
        });

    } catch (error) {
        console.error('Error in POST /api/upload:', error);
        // Check if the error is from ensureUploadDirExists or elsewhere
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
    }
}