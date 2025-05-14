"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./sign-up.module.css";
import { createUserWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../../firebase/config";

const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await set(ref(db, `users/${uid}`), {
        name,
        email,
        status: "pending",
        filename: null,
        file: null,
        time: null,
      });

      router.push("/");
    } catch (err: any) {
      switch (err.code) {
        case AuthErrorCodes.WEAK_PASSWORD:
          setError("Password should be at least 6 characters.");
          break;
        case AuthErrorCodes.EMAIL_EXISTS:
          setError("This email is already in use.");
          break;
        default:
          setError(err.message || "An unexpected error occurred.");
      }
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.img}>
        <Image src="/background-nature.jpg" alt="Background" fill style={{ objectFit: "cover" }} />
      </div>

      <div className={styles.formContainer}>
        <Link href="/" className={styles.logoImg}>
          <Image src="/logo.png" alt="Logo" width={50} height={50} />
        </Link>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Image className={styles.userProfileImg} src="/profile-img-2.jpg" alt="User" width={100} height={100} />

          <div className={styles.inputContainer}>
            <label htmlFor="name">Name*</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className={styles.inputContainer}>
            <label htmlFor="email">Email*</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={error.toLowerCase().includes("email") ? styles.errorInput : ""} />
          </div>

          <div className={styles.inputContainer}>
            <label htmlFor="password">Password*</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={error.toLowerCase().includes("password") ? styles.errorInput : ""}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.signupButton}>
            Sign Up
          </button>

          <p className={styles.loginText}>
            Already have an account? <Link href="/log-in">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
