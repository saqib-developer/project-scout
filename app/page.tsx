"use client";

import React, { useState, useEffect, useRef, ChangeEvent, DragEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

import { onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage, ref as storageRef, getMetadata, getDownloadURL, listAll, uploadBytesResumable, deleteObject } from "firebase/storage";
import { ref as dbRef, onValue, set, update } from "firebase/database";
import { auth, db, storage } from "../firebase/config"; // adjust path if needed
import Admin from "./Admin";

interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string;
}

export default function Home() {
  const router = useRouter();

  // Auth & user state
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [userUid, setUserUid] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<string>("pending");
  const [submittedOn, setSubmittedOn] = useState<number | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [fileInfos, setFileInfos] = useState<FileInfo[]>([]);

  const uploaderRef = useRef<HTMLDivElement>(null);
  const progresserRef = useRef<HTMLDivElement>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
        setLoggedIn(true);
      } else {
        setUserUid(null);
        setLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch user profile from DB
  useEffect(() => {
    if (!loggedIn || !userUid) return;
    const userRef = dbRef(db, `users/${userUid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setName(data.name || "");
        setEmail(data.email || "");
        setStatus(data.status || "pending");
        setSubmittedOn(data.time || null);
        setFilename(data.filename || null);
      }
    });
    return () => unsubscribe();
  }, [loggedIn, userUid]);

  // List files in Storage
  useEffect(() => {
    if (!loggedIn || !userUid) return;
    const listRef = storageRef(storage, `Projects Proposals/${userUid}/`);
    listAll(listRef)
      .then((res) => {
        return Promise.all(
          res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            return {
              name: metadata.name,
              type: metadata.contentType || "",
              size: metadata.size,
              url,
            } as FileInfo;
          })
        );
      })
      .then((infos) => setFileInfos(infos))
      .catch((err) => console.error("Error listing files:", err));
  }, [loggedIn, userUid, status]);

  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Upload file effect
  useEffect(() => {
    if (!selectedFile || !userUid) return;
    const upload = async () => {
      const path = `Projects Proposals/${userUid}/${selectedFile.name}`;
      const storageReference = storageRef(storage, path);
      const uploadTask = uploadBytesResumable(storageReference, selectedFile, { contentType: selectedFile.type });

      uploaderRef.current?.classList.add(styles.hidden);
      progresserRef.current?.classList.remove(styles.hidden);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(pct);
        },
        (err) => console.error("Upload error:", err),
        async () => {
          // Complete
          const downloadURL = await getDownloadURL(storageReference);
          // Update DB
          await update(dbRef(db, `users/${userUid}`), {
            status: "submitted",
            filename: selectedFile.name,
            file: downloadURL,
            time: Date.now(),
          });
          // Refresh UI
          setSelectedFile(null);
          setProgress(0);
          router.refresh();
        }
      );
    };
    upload();
  }, [selectedFile, userUid, router]);

  // Delete file
  const deleteFile = async () => {
    if (!userUid || !filename) return;
    try {
      // Delete from storage
      await deleteObject(storageRef(storage, `Projects Proposals/${userUid}/${filename}`));
      // Reset DB
      await update(dbRef(db, `users/${userUid}`), {
        status: "pending",
        filename: null,
        file: null,
        time: null,
      });
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logoContainer}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>
        <nav className={styles.navigationBar}>
          {loggedIn ? (
            <>
              <button className={styles.btn} onClick={logout}>
                Sign out
              </button>
              <div className={styles.nameContainer}>
                <Image src="/profile-img-3.jpg" alt="Avatar" width={50} height={50} />
                <p>{name}</p>
              </div>
            </>
          ) : (
            <ul className={styles.ul}>
              <li className={styles.li}>
                <Link href="/sign-up">Sign up</Link>
              </li>
              <li className={styles.li}>
                <Link href="/log-in">Log in</Link>
              </li>
            </ul>
          )}
        </nav>
      </header>

      <main className={styles.main}>
        {loggedIn ? (
          email === "muhammadsaqib8379@gmail.com" ? (
            <Admin />
          ) : status === "pending" ? (
            <>
              <div ref={uploaderRef} className={styles.container} onDrop={handleDrop} onDragOver={handleDragOver}>
                <Image src="/cloud-upload-img.png" alt="Upload" width={150} height={150} />
                <p>Drag & Drop to Upload File</p>
                <p>OR</p>
                <label htmlFor="file-upload" className={styles.customFileUpload}>
                  Choose File
                </label>
                <input id="file-upload" type="file" className={styles.inputFile} onChange={handleFileChange} />
              </div>
              <div ref={progresserRef} className={`${styles.progressBarContainer} ${styles.hidden}`}>
                <Image src="/uploading.jpg" alt="Uploading" width={250} height={250} />
                <div className={styles.progressBar}>
                  <div style={{ width: `${progress}%` }}></div>
                </div>
                <p>{Math.floor(progress)}%</p>
              </div>
            </>
          ) : fileInfos.length > 0 ? (
            fileInfos.map((fileInfo, idx) => (
              <div key={idx} className={styles.fileContainer}>
                <div className={styles.fileDetail}>
                  <p className={styles.status} style={{ color: status === "Accepted" ? "green" : status === "Rejected" ? "red" : "orange" }}>
                    {status}
                  </p>
                  <a href={fileInfo.url} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                    {fileInfo.type.startsWith("image/") && <img width={225} height={225} src={fileInfo.url} alt="" />}
                    {fileInfo.type === "application/pdf" && <Image src="/pdf.png" alt="PDF" width={225} height={225} />}
                    {fileInfo.type === "application/zip" && <Image src="/zip.png" alt="ZIP" width={225} height={225} />}
                  </a>
                  <div className={styles.fileData}>
                    <p className={styles.fileName}>{fileInfo.name}</p>
                    <p>Size: {Math.round((fileInfo.size / (1024 * 1024)) * 10) / 10} MB</p>
                    <p>Submitted on: {submittedOn ? new Date(submittedOn).toLocaleDateString("en-GB") : ""}</p>
                    <div className={styles.fileNavigation}>
                      <a href={fileInfo.url} download={`file_${idx + 1}`} target="_blank" rel="noreferrer">
                        <span>View</span>
                      </a>
                      <button className={styles.btn} onClick={deleteFile}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : null
        ) : (
          <>
            <Image src="/background.png" alt="Welcome" width={400} height={400} style={{ width: "70%", height: "auto" }} />
            <div className={styles.contentContainer}>
              <div className={styles.loginContainer}>
                <Image src="/not-logged-in.png" alt="Not logged in" width={400} height={400} className={styles.notLoggedInImage} />
                <p className={styles.notLoggedInText}>Login to view your data</p>
              </div>
              <div className={styles.descriptionContainer}>
                <p className={styles.descriptionText}>This platform allows students to submit project proposals and administrators to review them.</p>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
