import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const ALLOWED_MIME_TYPES = [
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime"
];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB from MAX_FILE_SIZE_MB in config

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds size limits" }, { status: 400 });
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Security Validation: Magic Bytes check for WebM/EBML headers
    if (file.type === "audio/webm" || file.type === "video/webm") {
      const header = buffer.subarray(0, 4).toString("hex").toUpperCase();
      if (header !== "1A45DFA3") {
        return NextResponse.json({ error: "Security check failed: File integrity mismatch" }, { status: 400 });
      }
    }

    // 4. Sanitize Input Name to prevent path traversal or other exploits
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const subDir = file.type.startsWith("audio/") ? "audio" : file.type.startsWith("video/") ? "video" : "images";
    const uploadDir = path.join(process.cwd(), "public", "uploads", subDir);

    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${subDir}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ url: `/uploads/${subDir}/${filename}` });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
