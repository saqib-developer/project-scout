"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./log-in.module.css";
import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { auth, db, storage } from "../../firebase/config";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/");
    } catch (err: any) {
      if (err.code === AuthErrorCodes.INVALID_PASSWORD) {
        setError("Wrong password. Try again.");
      } else if (err.code === AuthErrorCodes.USER_DELETED) {
        setError("No account found with this email.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className={styles.page}>
      <aside className={styles.imagePanel}>
        <Image src="/background-nature.jpg" alt="Login background" fill className={styles.bgImage} />
      </aside>

      <main className={styles.mainPanel}>
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo.png" alt="Logo" width={60} height={60} />
        </Link>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Image src="/profile-img-2.jpg" alt="Avatar" width={80} height={80} className={styles.avatar} />

          <div className={styles.inputGroup}>
            
            <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
          </div>

          <div className={styles.inputGroup}>
            
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={`${styles.input} ${error ? styles.errorInput : ""}`}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.submitButton}>
            Log In
          </button>

          <p className={styles.switchText}>
            Don’t have an account?{" "}
            <Link href="/sign-up" className={styles.switchLink}>
              Sign up
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
