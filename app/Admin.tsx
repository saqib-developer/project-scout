"use client";

import React, { useState, useEffect } from "react";
import styles from "./admin.module.css";
import { ref, onValue, update } from "firebase/database";
import { db } from "../firebase/config";

interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  filename?: string | null;
  file?: string | null;
  time?: number | string | null;
}

const Admin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [reason, setReason] = useState<string>("");

  // Fetch users once
  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const arr: User[] = Object.entries(data).map(([id, val]) => ({ id, ...(val as Omit<User, "id">) }));
        setUsers(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to fetch users:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleResult = async (user: User, result: "Accepted" | "Rejected", msg: string) => {
    try {
      await update(ref(db, `users/${user.id}`), { status: result });
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: user.email, subject: `Project ${result}!`, message: `Your project has been ${result}${msg}` }),
      });
    } catch (err) {
      console.error("Error updating user:", err);
    } finally {
      setSelectedUser(null);
      setReason("");
    }
  };

  if (loading) return <p>Loading...</p>;

  const submitted = users.filter((u) => u.status === "submitted");
  if (submitted.length === 0) return <p>No Project Proposals Submitted</p>;

  return (
    <div>
      <h1>Project Proposals</h1>

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
              <button onClick={() => handleResult(user, "Accepted", ".")} className={styles.secondary}>
                Accept
              </button>
              <button onClick={() => setSelectedUser(user)} className={styles.btn}>
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Rejection Modal */}
      {selectedUser && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupContent}>
            <h3>Reject Project: {selectedUser.name}</h3>
            <textarea rows={6} placeholder="Enter rejection reason here..." value={reason} onChange={(e) => setReason(e.target.value)} className={styles.textarea} />
            <div className={styles.popupActions}>
              <button onClick={() => setSelectedUser(null)} className={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!reason.trim()) {
                    alert("Please provide a rejection reason.");
                    return;
                  }
                  handleResult(selectedUser, "Rejected", ` because ${reason}.`);
                }}
                className={styles.rejectBtn}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
