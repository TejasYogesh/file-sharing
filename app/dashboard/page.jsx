"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { storage, ID } from "@/lib/appwrite";
import FileCard from "@/components/FileCard";

const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID;

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fetchingFiles, setFetchingFiles] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const fileInputRef = useRef(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // Fetch files on mount
  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  async function fetchFiles() {
    setFetchingFiles(true);
    try {
      const res = await storage.listFiles(BUCKET_ID);
      setFiles(res.files);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setFetchingFiles(false);
    }
  }

  async function uploadFile(file) {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      await storage.createFile(BUCKET_ID, ID.unique(), file, undefined, (progress) => {
        setUploadProgress(Math.round((progress.chunksUploaded / progress.chunksTotal) * 100));
      });
      await fetchFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  async function deleteFile(fileId) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
      setFiles(prev => prev.filter(f => f.$id !== fileId));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  }

  function getShareUrl(fileId) {
    return `${window.location.origin}/share/${fileId}`;
  }

  async function copyShareLink(fileId) {
    await navigator.clipboard.writeText(getShareUrl(fileId));
    setCopiedId(fileId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  if (loading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <span style={{ color: "var(--accent)", fontSize: "1.4rem" }}>⬡</span>
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>FileVault</span>
        </div>
        <nav style={styles.nav}>
          <div style={styles.navItem}>
            <span>📁</span> My Files
          </div>
        </nav>
        <div style={styles.userSection}>
          <div style={styles.avatar}>{user.name?.[0]?.toUpperCase() || "U"}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ color: "var(--muted)", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
          </div>
          <button className="btn-ghost" onClick={handleLogout} style={{ padding: "0.4rem 0.7rem", fontSize: "0.75rem" }}>
            Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.heading}>My Files</h1>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{files.length} file{files.length !== 1 ? "s" : ""} uploaded</p>
          </div>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? <><span className="spinner" /> Uploading...</> : "+ Upload File"}
          </button>
          <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={e => uploadFile(e.target.files[0])} />
        </div>

        {/* Upload progress */}
        {uploading && (
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Drop zone */}
        <div
          style={{ ...styles.dropzone, ...(dragOver ? styles.dropzoneActive : {}) }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <span style={{ fontSize: "2rem" }}>⬆</span>
          <p style={{ fontWeight: 600 }}>Drop a file here or click to upload</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Any file type · Max 50MB</p>
        </div>

        {/* File grid */}
        {fetchingFiles ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: "0 auto 1rem" }} />
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
            <p style={{ fontSize: "1.1rem" }}>No files yet. Upload your first file!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {files.map((file, i) => (
              <div key={file.$id} className="fade-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
                <FileCard
                  file={file}
                  bucketId={BUCKET_ID}
                  onDelete={() => deleteFile(file.$id)}
                  onCopy={() => copyShareLink(file.$id)}
                  copied={copiedId === file.$id}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  root: { display: "flex", minHeight: "100vh" },
  sidebar: {
    width: 240,
    background: "var(--surface)",
    borderRight: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    padding: "1.5rem",
    position: "sticky",
    top: 0,
    height: "100vh",
    flexShrink: 0,
  },
  sidebarLogo: { display: "flex", alignItems: "center", gap: "0.6rem", fontWeight: 800, fontSize: "1.1rem", marginBottom: "2rem", letterSpacing: "-0.02em" },
  nav: { flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: "0.7rem",
    padding: "0.7rem 1rem", borderRadius: 10,
    background: "var(--surface2)", border: "1px solid var(--border)",
    fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
  },
  userSection: { display: "flex", alignItems: "center", gap: "0.7rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border)" },
  avatar: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--accent)", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontWeight: 700, fontSize: "0.9rem", flexShrink: 0,
  },
  main: { flex: 1, padding: "2rem", maxWidth: 900 },
  header: { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" },
  heading: { fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em" },
  progressBar: { height: 4, background: "var(--surface2)", borderRadius: 4, marginBottom: "1rem", overflow: "hidden" },
  progressFill: { height: "100%", background: "var(--accent)", borderRadius: 4, transition: "width 0.3s ease" },
  dropzone: {
    border: "2px dashed var(--border)",
    borderRadius: 16,
    padding: "2rem",
    textAlign: "center",
    cursor: "pointer",
    marginBottom: "2rem",
    transition: "all 0.2s",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
  },
  dropzoneActive: { borderColor: "var(--accent)", background: "rgba(124,109,250,0.05)" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" },
};
