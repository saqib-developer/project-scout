"use client";
import { initializeApp } from "firebase/app";
import { get, ref as databaseRef, getDatabase, set } from "firebase/database";
import React, { useState, useEffect } from "react";
import styles from "./admin.module.css";


export default function Admin() {
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
  const db = getDatabase(app);

  const [projects, setProjects] = useState([]);
  useEffect(() => {
    get(databaseRef(db, `users/`)).then((snapshot) => {
      let temp = [];
      for (const key in snapshot.val()) {
        if (Object.hasOwnProperty.call(snapshot.val(), key)) {
          const element = snapshot.val()[key];
          console.log(element);
          if (element.status === "submitted") {
            temp.push({
              userid: key,
              name: element.name,
              fileName: element.fileName,
              submittedOn: element.time,
              url: element.file,
            });
          }
        }
      }
      setProjects(temp);
    });
  }, []);

  const projectAccept =  (userid) => {
    try {
      const userRef = databaseRef(db, `users/${userid}`);
      get(userRef)
        .then((snapshot) => {
          set(userRef, {
            file: snapshot.val().file,
            fileName: snapshot.val().fileName,
            name: snapshot.val().name,
            status: "accepted",
            time: snapshot.val().time,
            username: snapshot.val().username,
          });
          const userEmail = snapshot.val().username; // Extract user email

          //   window.location.href = "/";
        })
        .catch((error) => {
          console.error("Error fetching data from Firebase Realtime Database:", error);
        });
    } catch (error) {
      console.error("Error updating the status:", error);
    }
  };

  const projectReject = (userid) => {
    try {
      const userRef = databaseRef(db, `users/${userid}`);
      get(userRef)
        .then((snapshot) => {
          set(userRef, {
            file: snapshot.val().file,
            fileName: snapshot.val().fileName,
            name: snapshot.val().name,
            status: "rejected",
            time: snapshot.val().time,
            username: snapshot.val().username,
          });

          //   window.location.href = "/";
        })
        .catch((error) => {
          console.error("Error fetching data from Firebase Realtime Database:", error);
        });
    } catch (error) {
      console.error("Error updating the status:", error);
    }
  };

  return (
    <div>
      <h1>Project Proposals</h1>
      <div className={styles.projects}>
        {projects.length !== 0 ? (
          projects.map((value, index) => (
            <div className={styles.fileDetail}>
              <a key={index} href={value.url} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                <div className={styles.fileData}>
                  <p style={{ fontSize: "1.1em", fontWeight: "bolder" }}>{value.name}</p>
                  <p>Submitted on: {new Date(value.submittedOn).toLocaleDateString("en-GB")}</p>
                  <p>Click to View file</p>
                </div>
              </a>
              <div className={styles.fileNavigation}>
                <button onClick={() => projectAccept(value.userid)} className={styles.secandary}>
                  Accept
                </button>
                <button onClick={() => projectReject(value.userid)} className={styles.btn}>
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No Project Proposals to Show</p>
        )}
      </div>
    </div>
  );
}
