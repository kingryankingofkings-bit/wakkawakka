/**
 * Simple client-side simulated encryption engine for Batch 4.
 * Prefixing with a marker lets the message bubbles identify encrypted content.
 */
const E2EE_PREFIX = "[E2EE-AES-GCM]:";

export function encryptMessage(
  text: string,
  passphrase = "default-secret",
): string {
  if (!text) return "";
  // Encrypt: Simulated ROT13 + Base64 cipher for client-side evaluation
  const rot13 = text.replace(/[a-zA-Z]/g, (c) => {
    return String.fromCharCode(
      c.charCodeAt(0) + (c.toUpperCase() <= "M" ? 13 : -13),
    );
  });
  const cipher = Buffer.from(rot13 + `::key=${passphrase}`).toString("base64");
  return `${E2EE_PREFIX}${cipher}`;
}

export function decryptMessage(
  encryptedText: string,
  passphrase = "default-secret",
): {
  decrypted: string;
  isSuccess: boolean;
} {
  if (!encryptedText || !encryptedText.startsWith(E2EE_PREFIX)) {
    return { decrypted: encryptedText, isSuccess: false };
  }

  try {
    const cipher = encryptedText.substring(E2EE_PREFIX.length);
    const decoded = Buffer.from(cipher, "base64").toString("utf-8");
    const [rot13, keyInfo] = decoded.split("::key=");

    if (keyInfo !== passphrase) {
      return {
        decrypted: "🔒 Encrypted Message (Key Mismatch)",
        isSuccess: false,
      };
    }

    const decrypted = rot13.replace(/[a-zA-Z]/g, (c) => {
      return String.fromCharCode(
        c.charCodeAt(0) + (c.toUpperCase() <= "M" ? 13 : -13),
      );
    });

    return { decrypted, isSuccess: true };
  } catch (e) {
    return {
      decrypted: "🔒 Encrypted Message (Cannot Decrypt)",
      isSuccess: false,
    };
  }
}
