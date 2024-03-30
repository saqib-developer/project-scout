"use client";
import React, { useState, useEffect } from "react";
import styles from "./admin.module.css";

export default function Admin() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    const getData = async () => {
      const getresponse = await fetch(`/api/getAllUsers`);

      if (!getresponse.ok) {
        throw new Error("Failed to fetch data");
      }

      // Parse the getresponse body as JSON
      const data = await getresponse.json();
      setProjects(data.data);
    };
    getData();
  }, []);

  const projectResult = (userid, result) => {
    try {
      document.getElementById(`fileNavigation-${userid}`).style.display = "none";

      projects.forEach(async (value) => {
        if (value.id === userid) {
          const response = await fetch("/api/insertData", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              id: `${userid}`,
              name: value.name,
              username: value.username,
              status: result,
              filename: value.filename,
              file: value.file,
              time: value.time,
            }),
          });
          if (!response.ok) {
            throw new Error("Failed to insert data");
          } else {
            const data = await response.json();
            console.log(data);
          }

          const userEmail = value.username;
          const subject = `Project ${result}!`;
          const message = `Your project has been ${result} by the Admin.`;

          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail, subject, message }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Email response:", data);
              window.location.href = "/";
            })
            .catch((error) => console.error("Error sending email:", error));
        }
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
          projects.map((value, index) =>
            value.status === "submitted" ? (
              <div key={index} className={styles.fileDetail}>
                <a href={value.file} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                  <div className={styles.fileData}>
                    <p style={{ fontSize: "1.1em", fontWeight: "bolder" }}>{value.name}</p>
                    <p>Submitted on: {new Date(parseInt(value.time)).toLocaleDateString("en-GB")}</p>
                    <p>Click to View file</p>
                  </div>
                </a>
                <div className={styles.fileNavigation} id={`fileNavigation-${value.id}`}>
                  <button onClick={() => projectResult(value.id, "Accepted")} className={styles.secandary}>
                    Accept
                  </button>
                  <button onClick={() => projectResult(value.id, "Rejected")} className={styles.btn}>
                    Reject
                  </button>
                </div>
              </div>
            ) : null
          )
        ) : (
          <p>No Project Proposals to Show</p>
        )}
      </div>
    </div>
  );
}
