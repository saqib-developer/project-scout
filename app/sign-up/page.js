"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./sign-up.module.css";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";

export default function Signup() {
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

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

  const createAccount = async (event) => {
    event.preventDefault();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("saving the data sir!!!");

      const response = await fetch("/api/insertData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({ id: `${userCredential.user.uid}`, name, email, status: "pending", filename: null, file: null, time: null }),
      });

      if (!response.ok) {
        throw new Error("Failed to insert data");
      } else {
        const data = await response.json();
        console.log(data);
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Error inserting data:", error);
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
    <div className={styles.signupContainer}>
      <div className={styles.img}>
        <Image src={"/background-nature.jpg"} alt="" width={1500} height={1500} />
      </div>
      <div className={styles.formContainer}>
        <Link className={styles.logoImg} href="/">
          <Image src={"/logo.png"} alt="Project Scout Logo" width={50} height={50} />
        </Link>

        <form onSubmit={createAccount}>
          <Image className={styles.userProfileImg} src={"/profile-img-2.jpg"} alt="" width={100} height={100} />
          <div className={styles.inputContainer}>
            <label htmlFor="name">Name*</label>
            <input value={name} onChange={(event) => setName(event.target.value)} required id="name" type="text" placeholder="Name" />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="email">Email*</label>
            <input value={email} onChange={(event) => setEmail(event.target.value)} required id="email" type="email" placeholder="Email" />
          </div>
          <div className={styles.inputContainer}>
            <label htmlFor="password">Password*</label>
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

          <button type="submit">Signup</button>
          <p>
            Already have an account? <Link href={"/log-in"}>Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
