"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./log-in.module.css";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";

export default function Login() {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  const login = async (event) => {
    event.preventDefault();

    const firebaseConfig = {
      apiKey: "AIzaSyAitg_ZCEIPOhb6R7l_SOo4vpuhzjwKGQQ",
      authDomain: "proposal-scout.firebaseapp.com",
      projectId: "proposal-scout",
      storageBucket: "proposal-scout.appspot.com",
      messagingSenderId: "561559952969",
      appId: "1:561559952969:web:09dce9fdf59c2dca146998",
      measurementId: "G-V3607WBKEX",
    };
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(userCredential.user);
      window.location.href = "/";
    } catch (error) {
      console.log(error);
      showLoginError(error);
    }
  };

  const showLoginError = (error) => {
    document.getElementById("password").style.border = "1.5px solid red";
    if (error.code === AuthErrorCodes.INVALID_PASSWORD) {
      document.getElementById("showError").innerHTML = "Wrong Password. Try again";
    } else {
      document.getElementById("showError").innerHTML = `Error: ${error.message}`;
    }
    setTimeout(() => {
      document.getElementById("showError").innerHTML = "";
      document.getElementById("password").style.border = "1.5px solid grey";
    }, 6000);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.img}>
        <Image src={"/background-nature.jpg"} alt="" width={1500} height={1500} />
      </div>
      <div className={styles.formContainer}>
        <Link className={styles.logoImg} href="/">
          <Image src={"/logo.png"} alt="Project Scout Logo" width={50} height={50} />
        </Link>

        <form onSubmit={login}>
          <Image className={styles.userProfileImg} src={"/profile-img-2.jpg"} alt="" width={100} height={100} />
          <div className={styles.inputContainer}>
            <label htmlFor="email">
              <Image src={"/profile-img-3.png"} alt="" width={20} height={20} />
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              id="email"
              type="email"
              placeholder="email"
            />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="password">
              <Image src={"/lock.png"} alt="" width={20} height={20} />
            </label>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              id="password"
              type="password"
              placeholder="Password"
            />
          </div>
          <p id="showError" style={{ color: "red" }}></p>

          <button type="submit">LOGIN</button>
          <p>
            Don't have an account? <Link href={"/sign-up"}> Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
