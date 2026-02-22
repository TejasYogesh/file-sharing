"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { storage } from "@/lib/appwrite";
import Link from "next/link";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function SharePage() {
  const { fileId } = useParams();
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const f = await storage.getFile(BUCKET_ID, fileId);
        setFile(f);
      } catch {
        setError("File not found or no longer available.");
      } finally {
        setLoading(false);
      }
    }
    if (fileId) load();
  }, [fileId]);

  function handleDownload() {
    const url = storage.getFileDownload(BUCKET_ID, fileId);
    window.open(url, "_blank");
  }

  const isImage = file?.mimeType?.startsWith("image/");
  const previewUrl = isImage ? storage.getFilePreview(BUCKET_ID, fileId, 600, 400) : null;

  return (
    <div style={styles.page}>
      <div style={styles.glow} />

      <div className="fade-up" style={styles.box}>
        <Link href="/" style={styles.logo}>
          <span style={{ color: "var(--accent)", fontSize: "1.3rem" }}>⬡</span>
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>FileVault</span>
        </Link>

        {loading && (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto" }} />
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🚫</p>
            <p className="error-msg">{error}</p>
          </div>
        )}

        {file && (
          <>
            <div style={styles.sharedTag}>Shared File</div>
            <h1 style={styles.fileName}>{file.name}</h1>
            <p style={styles.meta}>
              {formatSize(file.sizeOriginal)} · Uploaded {new Date(file.$createdAt).toLocaleDateString()}
            </p>

            {isImage && (
              <div style={styles.previewBox}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt={file.name} style={{ width: "100%", borderRadius: 10 }} />
              </div>
            )}

            <button className="btn-primary" onClick={handleDownload} style={{ width: "100%", justifyContent: "center", marginTop: "1.5rem" }}>
              ⬇ Download File
            </button>

            <p style={styles.footer}>
              Want to share your own files?{" "}
              <Link href="/register" style={{ color: "var(--accent)" }}>Sign up free →</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative" },
  glow: { position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,109,250,0.1) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" },
  box: { width: "100%", maxWidth: 500, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "2.5rem", position: "relative", zIndex: 1 },
  logo: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", fontWeight: 800, fontSize: "1.1rem" },
  sharedTag: { display: "inline-block", background: "rgba(124,109,250,0.15)", color: "var(--accent)", padding: "0.25rem 0.8rem", borderRadius: 20, fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.8rem" },
  fileName: { fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.4rem", wordBreak: "break-word" },
  meta: { color: "var(--muted)", fontSize: "0.82rem", fontFamily: "'Space Mono', monospace", marginBottom: "0.5rem" },
  previewBox: { marginTop: "1.5rem", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" },
  footer: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "var(--muted)" },
};
