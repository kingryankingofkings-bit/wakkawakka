import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireAuth } from "@/lib/apiValidation";
import {
  apiSuccess,
  apiBadRequest,
  _apiUnauthorized,
  apiInternalError,
} from "@/lib/apiResponse";
import { createLogger } from "@/lib/logger";

// =============================================================================
// WakkaWakka — File Upload Route
// Validates authentication, MIME types, file size, and magic bytes.
// =============================================================================

const log = createLogger("Upload");

const ALLOWED_MIME_TYPES = [
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm",
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime",
];

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

/**
 * Magic byte signatures for file type verification.
 * Prevents MIME spoofing attacks by checking actual file content.
 */
const MAGIC_BYTES: Record<string, { offset: number; hex: string }[]> = {
  "image/jpeg": [{ offset: 0, hex: "FFD8FF" }],
  "image/png": [{ offset: 0, hex: "89504E47" }],
  "image/gif": [{ offset: 0, hex: "47494638" }],
  "image/webp": [{ offset: 8, hex: "57454250" }], // "WEBP" at offset 8
  "video/mp4": [
    { offset: 4, hex: "66747970" }, // "ftyp"
  ],
  "audio/webm": [{ offset: 0, hex: "1A45DFA3" }],
  "video/webm": [{ offset: 0, hex: "1A45DFA3" }],
  "audio/mpeg": [
    { offset: 0, hex: "FFE0" },   // MPEG-1 Layer 3
    { offset: 0, hex: "FFE1" },
    { offset: 0, hex: "FFE2" },
    { offset: 0, hex: "FFE3" },
    { offset: 0, hex: "FFFB" },   // MPEG-1 Layer 3 without CRC
    { offset: 0, hex: "FFF3" },
    { offset: 0, hex: "FFF2" },
    { offset: 0, hex: "494433" }, // ID3 tag
  ],
  "audio/ogg": [{ offset: 0, hex: "4F676753" }], // "OggS"
  "video/ogg": [{ offset: 0, hex: "4F676753" }],
  "audio/wav": [{ offset: 0, hex: "52494646" }], // "RIFF"
};

/**
 * Verify file content matches its declared MIME type by checking magic bytes.
 * Returns true if verification passes or is not available for the MIME type.
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return true; // No signature to check — allow

  return signatures.some((sig) => {
    const bytes = buffer.subarray(sig.offset, sig.offset + sig.hex.length / 2);
    return bytes.toString("hex").toUpperCase() === sig.hex.toUpperCase();
  });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Require authentication
    const auth = await requireAuth(req);
    if (auth.response) return auth.response;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return apiBadRequest("No file uploaded");
    }

    // 2. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return apiBadRequest(
        `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
      );
    }

    // 3. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiBadRequest(`Unsupported file type: ${file.type}`);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 4. Magic bytes verification to prevent MIME spoofing
    if (!verifyMagicBytes(buffer, file.type)) {
      log.warn("Magic byte mismatch — possible MIME spoofing attempt", {
        data: {
          userId: auth.userId,
          claimedType: file.type,
          fileName: file.name,
        },
      });
      return apiBadRequest("File content does not match declared type");
    }

    // 5. Sanitize filename to prevent path traversal
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const subDir = file.type.startsWith("audio/")
      ? "audio"
      : file.type.startsWith("video/")
        ? "video"
        : "images";
    const uploadDir = path.resolve(
      process.cwd(),
      "public",
      "uploads",
      subDir,
    );

    // 6. Verify resolved path is inside the upload directory (prevent traversal)
    const baseUploadDir = path.resolve(process.cwd(), "public", "uploads");
    if (!uploadDir.startsWith(baseUploadDir)) {
      log.error("Path traversal attempt detected", {
        data: { uploadDir, baseUploadDir, userId: auth.userId },
      });
      return apiBadRequest("Invalid upload path");
    }

    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${subDir}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    // Final path safety check
    const resolvedFilePath = path.resolve(filePath);
    if (!resolvedFilePath.startsWith(baseUploadDir)) {
      log.error("Path traversal in final path", {
        data: { resolvedFilePath, baseUploadDir, userId: auth.userId },
      });
      return apiBadRequest("Invalid upload path");
    }

    await fs.writeFile(filePath, buffer);

    log.info("File uploaded successfully", {
      data: {
        userId: auth.userId,
        filename,
        size: file.size,
        type: file.type,
      },
    });

    return apiSuccess({ url: `/uploads/${subDir}/${filename}` });
  } catch (error) {
    log.error("Upload failed", { error });
    return apiInternalError("Failed to upload file");
  }
}
