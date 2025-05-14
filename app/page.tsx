"use client";

import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { ref as storageRef, getMetadata, getDownloadURL, listAll, uploadBytesResumable, deleteObject } from "firebase/storage";
import { ref as dbRef, onValue, update } from "firebase/database";

import { auth, db, storage } from "../firebase/config";
import Admin from "./Admin";

interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string;
}

export default function Home() {
  const router = useRouter();

  // ─── Auth State ───────────────────────────────────────────────────────────────
  const [user, setUser] = useState<FirebaseUser | null>(null);
  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // ─── Profile State ────────────────────────────────────────────────────────────
  const uid = user?.uid ?? null;
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    status: string;
    submittedOn: number | null;
    // fields added by admin:
    responseMsg?: string;
    responseFileURL?: string;
    responseFilename?: string;
    // original student file:
    filename: string | null;
  }>({
    name: "",
    email: "",
    status: "pending",
    submittedOn: null,
    filename: null,
  });

  useEffect(() => {
    if (!uid) return;
    const unsub = onValue(dbRef(db, `users/${uid}`), (snap) => {
      const d = snap.val() ?? {};
      setProfile({
        name: d.name || "",
        email: d.email || "",
        status: d.status || "pending",
        submittedOn: d.time || null,
        filename: d.filename || null,
        responseMsg: d.responseMsg || "",
        responseFileURL: d.responseFileURL || "",
        responseFilename: d.responseFilename || "",
      });
    });
    return unsub;
  }, [uid]);

  // ─── File Listing ─────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<FileInfo[]>([]);
  useEffect(() => {
    if (!uid) return;
    const folder = `Projects Proposals/${uid}/`;
    const listRef = storageRef(storage, folder);
    listAll(listRef)
      .then((res) =>
        Promise.all(
          res.items.map(async (item) => {
            const url = await getDownloadURL(item);
            const meta = await getMetadata(item);
            return { name: meta.name, type: meta.contentType ?? "", size: meta.size, url } as FileInfo;
          })
        )
      )
      .then(setFiles)
      .catch(console.error);
  }, [uid, profile.status]);

  // ─── File Upload ──────────────────────────────────────────────────────────────
  const [selFile, setSelFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const upRef = useRef<HTMLDivElement>(null);
  const prRef = useRef<HTMLDivElement>(null);

  const pickFile = (f: File) => setSelFile(f);
  const onChangeFile = (e: ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && pickFile(e.target.files[0]);
  const onDropFile = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.files[0] && pickFile(e.dataTransfer.files[0]);
  };
  const onDragOverFile = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  useEffect(() => {
    if (!selFile || !uid) return;
    const path = `Projects Proposals/${uid}/${selFile.name}`;
    const refSt = storageRef(storage, path);
    const task = uploadBytesResumable(refSt, selFile, { contentType: selFile.type });

    upRef.current?.classList.add(styles.hidden);
    prRef.current?.classList.remove(styles.hidden);

    task.on(
      "state_changed",
      (snap) => setProgress((snap.bytesTransferred / snap.totalBytes) * 100),
      console.error,
      async () => {
        const url = await getDownloadURL(refSt);
        await update(dbRef(db, `users/${uid}`), {
          status: "submitted",
          filename: selFile.name,
          file: url,
          time: Date.now(),
        });
        setSelFile(null);
        setProgress(0);
        router.refresh();
      }
    );
  }, [selFile, uid, router]);

  // ─── File Delete (with response cleanup) ────────────────────────────────────
  const deleteFile = async () => {
    if (!uid) return;

    // 1) Delete student’s original file
    if (profile.filename) {
      await deleteObject(storageRef(storage, `Projects Proposals/${uid}/${profile.filename}`));
    }

    // 2) If admin uploaded a response file, delete that too
    if (profile.responseFilename) {
      await deleteObject(storageRef(storage, `responses/${uid}/${profile.responseFilename}`));
    }

    // 3) Clear all related fields in Realtime Database
    await update(dbRef(db, `users/${uid}`), {
      status: "pending",
      filename: null,
      file: null,
      time: null,
      responseMsg: null,
      responseFileURL: null,
      responseFilename: null,
    });

    // 4) Refresh UI
    router.refresh();
  };

  // ─── Logout ───────────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
    router.push("/log-in");
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className={styles.centered}>
        <Image src="/not-logged-in.png" alt="Login required" width={240} height={240} />
        <p>
          Please <Link href="/log-in">Log in</Link>.
        </p>
      </div>
    );
  }

  if (profile.email === "muhammadsaqib8379@gmail.com") {
    return <Admin />;
  }

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>
        <div className={styles.navRight}>
          <span className={styles.welcome}>Welcome, {profile.name}</span>
          <button onClick={logout} className={styles.logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className={styles.main}>
        {profile.status === "pending" ? (
          <div ref={upRef} className={styles.uploader} onDrop={onDropFile} onDragOver={onDragOverFile}>
            <Image src="/cloud-upload-img.png" alt="Upload" width={100} height={100} />
            <p>Drag & drop your file here</p>
            <label htmlFor="file-upload" className={styles.uploadLabel}>
              Or select file
            </label>
            <input id="file-upload" type="file" className={styles.fileInput} onChange={onChangeFile} />
          </div>
        ) : (
          <>
            {/* Show Admin Response Message */}
            {profile.responseMsg && (
              <div className={styles.responseBox}>
                <h2 className={styles.responseTitle}>{profile.status.toUpperCase()}</h2>
                <p className={styles.responseText}>{profile.responseMsg}</p>
              </div>
            )}

            {/* Display Admin’s Updated File if exists */}
            <section className={styles.gallery}>
              {(profile.responseFileURL
                ? [
                    {
                      name: profile.responseFilename!,
                      url: profile.responseFileURL,
                      type: "",
                      size: 0,
                    },
                  ]
                : files
              ).map((f, i) => (
                <div key={i} className={styles.card}>
                  <a href={f.url} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                    {/* IMAGE PREVIEW */}
                    {(f.type.startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(f.name)) && <img src={f.url} alt={f.name} width={225} height={225} className={styles.filePreview} />}

                    {/* PDF ICON */}
                    {f.type === "application/pdf" && <Image src="/pdf.png" alt="PDF" width={225} height={225} className={styles.filePreview} />}

                    {/* ZIP ICON */}
                    {f.type === "application/zip" && <Image src="/zip.png" alt="ZIP" width={225} height={225} className={styles.filePreview} />}

                    {/* PPTX ICON */}
                    {/\.(pptx?)$/i.test(f.name) && <Image src="/pptx.png" alt="PowerPoint" width={225} height={225} className={styles.filePreview} />}

                    {/* DOCX ICON */}
                    {/\.(docx?)$/i.test(f.name) && <Image src="/word.png" alt="Word" width={225} height={225} className={styles.filePreview} />}
                  </a>

                  <div className={styles.details}>
                    <strong className={styles.filename}>{f.name}</strong>
                    {f.size > 0 && <small className={styles.filesize}>{Math.round((f.size / 1024 / 1024) * 10) / 10} MB</small>}
                    <button onClick={deleteFile} className={styles.delete}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        <div ref={prRef} className={`${styles.progress} ${styles.hidden}`}>
          <div className={styles.bar}>
            <div className={styles.filled} style={{ width: `${progress}%` }} />
          </div>
          <span>{Math.round(progress)}%</span>
        </div>
      </main>
    </>
  );
}
