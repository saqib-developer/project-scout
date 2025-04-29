// app/log-in/page.tsx   (or wherever your component lives)
"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import styles from "./log-in.module.css";

import { signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { auth } from "../../firebase/config"; // Adjusted the path to match the relative structure.

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); // reset

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in user:", cred.user);
      router.push("/"); // navigate home
    } catch (err: any) {
      if (err.code === AuthErrorCodes.INVALID_PASSWORD) {
        setError("Wrong password. Try again.");
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.img}>
        <Image src="/background-nature.jpg" alt="background" fill style={{ objectFit: "cover" }} />
      </div>

      <div className={styles.formContainer}>
        <Link href="/" className={styles.logoImg}>
          <Image src="/logo.png" alt="Project Scout Logo" width={50} height={50} />
        </Link>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Image className={styles.userProfileImg} src="/profile-img-2.jpg" alt="User avatar" width={100} height={100} />

          <div className={styles.inputContainer}>
            <label htmlFor="email">
              <Image src="/profile-img-3.png" alt="email icon" width={20} height={20} />
            </label>
            <input id="email" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className={styles.inputContainer}>
            <label htmlFor="password">
              <Image src="/lock.png" alt="lock icon" width={20} height={20} />
            </label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={error ? styles.errorInput : ""}
            />
          </div>

          {error && <p className={styles.errorMessage}>{error}</p>}

          <button type="submit" className={styles.loginButton}>
            LOGIN
          </button>

          <p className={styles.signUpText}>
            Don't have an account? <Link href="/sign-up">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
