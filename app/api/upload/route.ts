import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { mkdir } from "fs/promises";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure upload directory exists
        const uploadDir = join(process.cwd(), "public/uploads");
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const ext = file.name.split('.').pop() || 'webm';
        const filename = `${uuidv4()}.${ext}`;
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return the URL accessible via public folder
        const fileUrl = `/uploads/${filename}`;

        return NextResponse.json({ fileUrl, type: file.type });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
