"use client";
import { storage } from "@/lib/appwrite";

const FILE_ICONS = {
  image: "🖼",
  video: "🎬",
  audio: "🎵",
  pdf: "📄",
  zip: "🗜",
  text: "📝",
  default: "📦",
};

function getIcon(mimeType) {
  if (!mimeType) return FILE_ICONS.default;
  if (mimeType.startsWith("image/")) return FILE_ICONS.image;
  if (mimeType.startsWith("video/")) return FILE_ICONS.video;
  if (mimeType.startsWith("audio/")) return FILE_ICONS.audio;
  if (mimeType === "application/pdf") return FILE_ICONS.pdf;
  if (mimeType.includes("zip") || mimeType.includes("compressed")) return FILE_ICONS.zip;
  if (mimeType.startsWith("text/")) return FILE_ICONS.text;
  return FILE_ICONS.default;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FileCard({ file, bucketId, onDelete, onCopy, copied, isMobile }) {
  const isImage = file.mimeType?.startsWith("image/");

  function handleDownload() {
    const url = storage.getFileDownload(bucketId, file.$id);
    window.open(url, "_blank");
  }

  // Mobile: horizontal list item layout
  if (isMobile) {
    return (
      <div style={styles.mobileCard}>
        {/* Left: icon or thumbnail */}
        <div style={styles.mobileThumb}>
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={storage.getFilePreview(bucketId, file.$id, 80, 80)}
              alt={file.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
            />
          ) : (
            <span style={{ fontSize: "1.8rem" }}>{getIcon(file.mimeType)}</span>
          )}
        </div>

        {/* Middle: info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.name} title={file.name}>{file.name}</div>
          <div style={styles.meta}>
            <span>{formatSize(file.sizeOriginal)}</span>
            <span style={{ color: "var(--border)" }}>·</span>
            <span>{formatDate(file.$createdAt)}</span>
          </div>
          {/* Inline actions on mobile */}
          <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={onCopy}
              style={{
                ...styles.actionBtn,
                background: copied ? "rgba(77,250,158,0.15)" : "var(--surface2)",
                color: copied ? "var(--success)" : "var(--muted)",
                borderColor: copied ? "var(--success)" : "var(--border)",
                flex: "none",
              }}
            >
              {copied ? "✓" : "🔗"} {copied ? "Copied!" : "Share"}
            </button>
            <button onClick={handleDownload} style={{ ...styles.actionBtn, flex: "none" }}>
              ⬇ Download
            </button>
            <button className="btn-danger" onClick={onDelete}>🗑</button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop: card layout
  return (
    <div style={styles.card}>
      {/* Preview or icon */}
      <div style={styles.preview}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={storage.getFilePreview(bucketId, file.$id, 300, 160)}
            alt={file.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: "2.5rem" }}>{getIcon(file.mimeType)}</span>
        )}
      </div>

      {/* Info */}
      <div style={styles.info}>
        <div style={styles.name} title={file.name}>{file.name}</div>
        <div style={styles.meta}>
          <span>{formatSize(file.sizeOriginal)}</span>
          <span style={{ color: "var(--border)" }}>·</span>
          <span>{formatDate(file.$createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div style={styles.actions}>
        <button
          onClick={onCopy}
          style={{
            ...styles.actionBtn,
            background: copied ? "rgba(77,250,158,0.15)" : "var(--surface2)",
            color: copied ? "var(--success)" : "var(--muted)",
            borderColor: copied ? "var(--success)" : "var(--border)",
          }}
          title="Copy share link"
        >
          {copied ? "✓ Copied!" : "🔗 Share"}
        </button>
        <button onClick={handleDownload} style={styles.actionBtn} title="Download">
          ⬇ Download
        </button>
        <button className="btn-danger" onClick={onDelete} title="Delete">
          🗑
        </button>
      </div>
    </div>
  );
}

const styles = {
  // Desktop card
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    overflow: "hidden",
    transition: "border-color 0.2s, transform 0.2s",
    cursor: "default",
  },
  preview: {
    height: 120,
    background: "var(--surface2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  info: { padding: "0.8rem 1rem 0.4rem" },
  name: {
    fontWeight: 700,
    fontSize: "0.9rem",
    marginBottom: "0.2rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  meta: { color: "var(--muted)", fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", display: "flex", gap: "0.4rem" },
  actions: { display: "flex", gap: "0.4rem", padding: "0.8rem", flexWrap: "wrap" },
  actionBtn: {
    flex: 1,
    padding: "0.4rem 0.6rem",
    border: "1px solid var(--border)",
    borderRadius: 8,
    background: "var(--surface2)",
    color: "var(--muted)",
    fontSize: "0.78rem",
    fontFamily: "'Syne', sans-serif",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },

  // Mobile list item
  mobileCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 14,
    padding: "0.9rem 1rem",
  },
  mobileThumb: {
    width: 56, height: 56, flexShrink: 0,
    background: "var(--surface2)",
    borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden",
  },
};
