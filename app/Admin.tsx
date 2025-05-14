"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Image from "next/image";
import styles from "./admin.module.css";
import { ref as dbRef, onValue, update } from "firebase/database";
import { db, storage } from "../firebase/config";
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  filename?: string | null;
  file?: string | null;
  time?: number | string | null;
}

type Action = "Accept" | "Reject";

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [action, setAction] = useState<Action>("Accept");
  const [reason, setReason] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // fetch all users
  useEffect(() => {
    const unsub = onValue(
      dbRef(db, "users"),
      (snap) => {
        const data = snap.val() || {};
        const arr: User[] = Object.entries(data).map(([id, val]) => ({
          id,
          ...(val as Omit<User, "id">),
        }));
        setUsers(arr);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openModal = (user: User, act: Action) => {
    setSelectedUser(user);
    setAction(act);
    setReason("");
    setNewFile(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const updates: Record<string, any> = {
      status: action,
      responseMsg: reason.trim(),
    };

    if (newFile) {
      setUploading(true);
      const path = `responses/${selectedUser.id}/${newFile.name}`;
      const sRef = storageRef(storage, path);
      const task = uploadBytesResumable(sRef, newFile);
      await new Promise<void>((res, rej) => {
        task.on(
          "state_changed",
          null,
          (err) => rej(err),
          async () => {
            const url = await getDownloadURL(task.snapshot.ref);
            updates.responseFileURL = url;
            updates.responseFilename = newFile.name;
            updates.responseNote = "File was updated by admin.";
            res();
          }
        );
      });
      setUploading(false);
    }

    await update(dbRef(db, `users/${selectedUser.id}`), updates);
    setSelectedUser(null);
  };

  if (loading) {
    return <p className={styles.emptyState}>Loading...</p>;
  }

  const submitted = users.filter((u) => u.status === "submitted");

  return (
    <>
      <header className={styles.header}>
        <h1>Project Proposals</h1>
        <div className={styles.userInfo}>
          <span>Admin</span>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              /* implement logout */
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      {submitted.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No Proposals Yet</h2>
          <p>Once students submit their projects, they’ll appear here for review.</p>
        </div>
      ) : (
        <div className={styles.projects}>
          {submitted.map((user) => (
            <div key={user.id} className={styles.fileDetail}>
              <a href={user.file!} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                <div className={styles.fileData}>
                  <p className={styles.name}>{user.name}</p>
                  <p>Submitted on: {user.time ? new Date(Number(user.time)).toLocaleDateString("en-GB") : ""}</p>
                  <p>Click to View file</p>
                </div>
              </a>
              <div className={styles.fileNavigation}>
                <button onClick={() => openModal(user, "Accept")} className={styles.secondary}>
                  Accept
                </button>
                <button onClick={() => openModal(user, "Reject")} className={styles.btn}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3>
              {action} Project: {selectedUser.name}
            </h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <label>
                Response Message:
                <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className={styles.textarea} required={action === "Reject"} />
              </label>

              <label>
                {action === "Accept" ? "Replace file (optional):" : "Upload a corrected file (optional):"}
                <input type="file" onChange={(e) => setNewFile(e.target.files ? e.target.files[0] : null)} className={styles.fileInput} />
              </label>

              <div className={styles.popupActions}>
                <button type="button" onClick={() => setSelectedUser(null)} className={styles.cancelBtn} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className={styles.confirmBtn} disabled={uploading || (action === "Reject" && !reason.trim())}>
                  {uploading ? "Uploading…" : `Confirm ${action}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
