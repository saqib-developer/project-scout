"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import { useEffect, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { onAuthStateChanged, getAuth, signOut } from "firebase/auth";
import { getStorage, ref as storageRef, getMetadata, getDownloadURL, listAll, uploadBytesResumable, deleteObject } from "firebase/storage";
import Admin from "./Admin";

export default function Home() {
  const firebaseConfig = {
    apiKey: "AIzaSyAitg_ZCEIPOhb6R7l_SOo4vpuhzjwKGQQ",
    authDomain: "proposal-scout.firebaseapp.com",
    projectId: "proposal-scout",
    storageBucket: "proposal-scout.appspot.com",
    messagingSenderId: "561559952969",
    appId: "1:561559952969:web:09dce9fdf59c2dca146998",
    measurementId: "G-V3607WBKEX",
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const storage = getStorage(app);

  const [loggedin, setLoggedin] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [name, setName] = useState(null);
  const [email, setEmail] = useState(null);
  const [status, setStatus] = useState(null);
  const [submittedOn, setSubmittedOn] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [filename, setFilename] = useState(null);

  const uploader = useRef(null);
  const progresser = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setSelectedFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  useEffect(() => {
    const uploadProjectFile = async () => {
      if (!selectedFile) return;

      try {
        const metadata = { contentType: selectedFile.type };
        const storageRefPath = `Projects Proposals/${userUid}/${selectedFile.name}`;
        const storageRefObj = storageRef(storage, storageRefPath);
        const uploadTask = uploadBytesResumable(storageRefObj, selectedFile, metadata);

        uploader.current.style.display = "none";
        progresser.current.style.display = "flex";

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            setProgress(progress);
          },
          (error) => {
            console.error("Error during upload:", error);
          },
          () => {
            console.log("Upload completed successfully");
          }
        );

        await uploadTask;

        const downloadURL = await getDownloadURL(storageRefObj);

        const getresponse = await fetch(`/api/singleUser?id=${userUid}`);

        if (!getresponse.ok) {
          throw new Error("Failed to fetch data");
        }

        // Parse the getresponse body as JSON
        const data = await getresponse.json();
        const { name, email } = data.data[0];

        const response = await fetch("/api/insertData", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: userUid,
            name: name,
            email: email,
            status: "submitted",
            filename: selectedFile.name,
            file: downloadURL,
            time: Date.now(),
          }), // Send data in the request body
        });

        if (!response.ok) {
          throw new Error("Failed to insert data");
        } else {
          const data = await response.json(); // Parse the response body as JSON
          console.log(data); // Log the response data
        }

        console.log("File uploaded successfully");
        window.location.href = "/";
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };

    uploadProjectFile();
  }, [selectedFile]);

  const monitorAuthState = async () => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserUid(user.uid);
        setLoggedin(true);
      } else {
        setUserUid(null);
        setName(null);
        setEmail(null);
        setStatus(null);
        setLoggedin(false);

        console.log("You are not Logged in.");
      }
    });
  };
  useEffect(() => {
    monitorAuthState();
  }, []);

  const [retriveFilesInfo, setRetriveFilesInfo] = useState([]);

  useEffect(() => {
    if (loggedin && userUid) {
      const listRef = storageRef(storage, `Projects Proposals/${userUid}/`);

      listAll(listRef)
        .then((res) => {
          const promises = res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);

            return {
              name: metadata.name,
              type: metadata.contentType,
              size: metadata.size,
              url: url,
            };
          });

          Promise.all(promises)
            .then((fileInfos) => {
              setRetriveFilesInfo(fileInfos);
            })
            .catch((error) => {
              console.error(error);
            });
        })
        .catch((error) => {
          console.error(error);
        });

      const getdata = async () => {
        const getresponse = await fetch(`/api/singleUser?id=${userUid}`);

        if (!getresponse.ok) {
          throw new Error("Failed to fetch data");
        }

        // Parse the getresponse body as JSON
        const data = await getresponse.json();

        setName(data.data[0].name);
        setEmail(data.data[0].email);

        setStatus(data.data[0].status);
        setSubmittedOn(data.data[0].time);
        setFilename(data.data[0].filename);
      };
      getdata();
    }
  }, [loggedin, userUid]);

  const logout = async () => {
    await signOut(auth);
  };

  const deleteFile = async () => {
    try {
      const getresponse = await fetch(`/api/singleUser?id=${userUid}`);

      if (!getresponse.ok) {
        throw new Error("Failed to fetch data");
      }

      // Parse the getresponse body as JSON
      const data = await getresponse.json();
      const { name, email } = data.data[0];

      const response = await fetch("/api/insertData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userUid,
          name: name,
          email: email,
          status: "pending",
          filename: null,
          file: null,
          time: null,
        }), // Send data in the request body
      });

      if (!response.ok) {
        throw new Error("Failed to insert data");
      } else {
        const data = await response.json(); // Parse the response body as JSON
        console.log(data); // Log the response data
      }

      await deleteObject(storageRef(storage, `Projects Proposals/${userUid}/${filename}`));

      console.log("File deleted and status updated successfully");
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <>
      <header className={styles.header}>
        <a className={styles.logoContainer} href="/">
          <Image className={styles.img} src={"/logo.png"} alt="Project Scout Logo" width={50} height={50} />
        </a>
        <div className={styles.navigationBar}>
          {loggedin ? (
            <>
              <button className={styles.btn} onClick={logout}>
                Sign out
              </button>
              <div className={styles.nameContainer}>
                <Image className={styles.img} src={"/profile-img-3.jpg"} alt="Project Scout Logo" width={50} height={50} />
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
        </div>
      </header>
      <main className={styles.main}>
        {loggedin ? (
          <>
            {email === "msaadraza1590@gmail.com" ? (
              <Admin />
            ) : (
              <>
                {status === "pending" ? (
                  <>
                    <div ref={uploader} className={styles.container} onDrop={handleDrop} onDragOver={handleDragOver}>
                      <Image className={styles.img} src={"/cloud-upload-img.png"} alt="Cloud Upload Image" width={150} height={150} />
                      <p>Drag & Drop to Upload File</p>
                      <p>OR</p>
                      <label htmlFor="file-upload" className={styles.customFileUpload}>
                        Choose File
                      </label>
                      <input id="file-upload" className={styles.inputFile} type="file" onChange={handleFileChange} />
                    </div>
                    <div ref={progresser} className={styles.progressBarContainer}>
                      <Image className={styles.img} src={"/uploading.jpg"} alt="Project Scout Logo" width={250} height={250} />
                      <div className={styles.progressBar}>
                        <div style={{ width: `${progress}%` }}></div>
                      </div>
                      <p>{Math.floor(progress)}%</p>
                    </div>
                  </>
                ) : retriveFilesInfo.length !== 0 ? (
                  retriveFilesInfo.map((fileInfo, index) => (
                    <div key={index} className={styles.fileContainer}>
                      <div className={styles.fileDetail}>
                        <p className={styles.status} style={{ color: status === "Accepted" ? "green" : status === "Rejected" ? "red" : "orange" }}>
                          {status}
                        </p>
                        <a href={fileInfo.url} download target="_blank" rel="noreferrer" className={styles.fileImgContainer}>
                          {fileInfo.type.startsWith("image/") && <img width={225} height={225} src={fileInfo.url} alt="" />}
                          {fileInfo.type === "application/pdf" && <Image width={225} height={225} src="/pdf.png" alt="" />}
                          {fileInfo.type === "application/x-zip-compressed" && <Image width={225} height={225} src="/zip.png" alt="" />}
                          {fileInfo.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" && (
                            <Image width={225} height={225} src="/pptx.png" alt="" />
                          )}
                          {fileInfo.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && (
                            <Image width={225} height={225} src="/word.png" alt="" />
                          )}
                        </a>
                        <div className={styles.fileData}>
                          <p className={styles.fileName}>{fileInfo.name}</p>
                          <p>Size: {Math.round((fileInfo.size / (1024 * 1024)) * 10) / 10} MB</p>
                          <p>Submitted on: {new Date(submittedOn).toLocaleDateString("en-GB")}</p>
                          <div className={styles.fileNavigation}>
                            <a key={index} href={fileInfo.url} download={`file_${index + 1}`} target="_blank" rel="noreferrer">
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
                ) : null}
              </>
            )}
          </>
        ) : (
          <>
            <Image style={{ width: "90%", height: "auto" }} src={"/background.png"} alt="" width={400} height={400} />
            <div className={styles.contentContainer}>
              <div className={styles.loginContainer}>
                <Image className={styles.notLoggedInImage} src="/not-logged-in.png" alt="Not logged in" width={400} height={400} />
                <p className={styles.notLoggedInText}>Login to view your data</p>
              </div>
              <div className={styles.descriptionContainer}>
                <p className={styles.descriptionText}>
                  This website is a comprehensive platform designed to streamline the project proposal process for students and administrators.
                  Students can create new accounts and submit their project proposals in various formats, ensuring flexibility and ease of use.
                  Administrators have the ability to review these submissions, approve or reject them based on specific criteria. Upon approval or
                  rejection, the respective student receives an email notification with the decision, ensuring timely and efficient communication.
                  This platform enhances the project submission workflow, providing a seamless experience for both students and administrators.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
