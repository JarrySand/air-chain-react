import { useState, useEffect } from "react";
import Link from 'next/link';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import { ethers } from 'ethers';
import { db } from '../utils/firebase';
import PostList from '../components/PostList';


function RadioStationPage({ walletAddress }) {
  const [radioStation, setRadioStation] = useState({});
  const [recipientAddress, setRecipientAddress] = useState("");
  const [signUpForm, setSignUpForm] = useState({ penName: "" });
  const [user, setUser] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [postForm, setPostForm] = useState({ content: "", postType: "" });
  const [postTypeOptions, setPostTypeOptions] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);


  useEffect(() => {
    fetchWalletDetails();
    fetchRadioStationInfo();
    fetchPostTypeOptions();
    fetchUserPosts();
  }, [walletAddress, user?.penName, radioStation?.name]);

  useEffect(() => {
    fetchRadioStationInfo();
    fetchPostTypeOptions();
    if (user?.penName && radioStation?.name) {
      fetchUserPosts();
    }
  }, [walletAddress, user?.penName, radioStation?.name]);

  useEffect(() => {
    if (walletAddress) {
      setRecipientAddress(walletAddress);
      login();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (recipientAddress) {
      login();
    }
  }, [recipientAddress]);
 
  const userPenName = user ? user.penName : null;

  const formattedDescription = radioStation && radioStation.description
    ? radioStation.description.replace(/\n/g, '<br>')
    : '';

  async function fetchRadioStationInfo() {
    const db = getFirestore();
    const q = query(collection(db, 'radioStations'), where('walletAddress', '==', walletAddress));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      setRadioStation(querySnapshot.docs[0].data());
    } else {
      console.log("No such document!");
    }
  }

  async function fetchWalletDetails() {
    const provider = new ethers.providers.JsonRpcProvider("https://mainnet.infura.io/v3/2ff2983fb66349749d43fcb0a3402469");
    setRecipientAddress(walletAddress);

    if (walletAddress) {
        await login(); // call login if a walletAddress is found
    }
  }


  async function connectWallet() {
    try {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: "2ff2983fb66349749d43fcb0a3402469",
          },
        },
      };

      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions,
      });

      const provider = await web3Modal.connect();
      const web3Instance = new Web3(provider);

      setWeb3(web3Instance);

      const accounts = await web3Instance.eth.getAccounts();
      const rawAddress = accounts[0];
      const checksumAddress = web3Instance.utils.toChecksumAddress(rawAddress);
      setRecipientAddress(checksumAddress);

      await login();
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  }

  async function login() {
    setIsLoading(true);
    const q = query(
      collection(db, "users"),
      where("walletAddress", "==", recipientAddress)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      if (signUpForm.penName) {
        await signUp();
      } else {
        setIsLoading(false);
      }
    } else {
      const userData = snapshot.docs[0].data();
      setUser(userData);
      setIsLoading(false);
    }
    setIsLoadingUser(false);  // Set user loading state to false
  }

    
  async function signUp() {
    const penName = signUpForm.penName;
    if (penName) {
      const userData = {
        penName,
        walletAddress: recipientAddress,
      };
      await addDoc(collection(db, "users"), userData);
      setUser(userData);
    }
  }
  
  async function fetchPostTypeOptions() {
    console.log("Wallet Address:", walletAddress); // Add this line
    const q = query(
      collection(db, "postTypeOptions"),
      where("radioStationWalletAddress", "==", walletAddress)
    );
    const snapshot = await getDocs(q);
    const postTypes = snapshot.docs.map((doc) => doc.data());
    setPostTypeOptions(postTypes);
}
  

  async function fetchUserPosts() {
    if (userPenName && radioStation?.name) {
      const q = query(
        collection(db, "listenerPosts"),
        where("penName", "==", userPenName),
        where("station", "==", radioStation?.name),
        orderBy("timestamp", "desc")
      );
      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map((doc) => doc.data());
      setUserPosts(posts);
    }
  }

  async function createPost(e) {
    e.preventDefault();
  
    const postData = {
      content: postForm.content,
      postType: postForm.postType,
      penName: userPenName,
      station: radioStation?.name,
      timestamp: serverTimestamp(),
      walletAddress: recipientAddress
    };
  
    if (postData.content && postData.postType && userPenName && radioStation) {
      try {
        await addDoc(collection(db, "listenerPosts"), postData);
        fetchUserPosts();
      } catch (error) {
        console.error('Error creating post:', error);
      }
    }
  }
  
  async function deletePost(post) {
    const q = query(collection(db, "listenerPosts"), where("id", "==", post.id));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const postRef = snapshot.docs[0].ref;
      await deleteDoc(postRef);
      fetchUserPosts();
    }
  }

  return (
    <div>
      <nav>
          <ul>
              <li id="navFlexContainerLi">
                  <div className="nav-flex-container" id="navFlexContainer">
                      {recipientAddress && 
                      <>
                          <div>Your Address:</div>
                          <div title={recipientAddress}>{recipientAddress}</div>
                      </>}
                      {userPenName && 
                      <>
                          <div>Pen name:</div>
                          <div>{userPenName}</div>
                      </>}
                  </div>
              </li>
              {recipientAddress && 
              <li><a href="#makeAPost">Make a post</a></li>
              }
              {recipientAddress && 
              <li><a href="#yourPosts">Your posts</a></li>
              }
              <li><a href="#feedback">Feedback</a></li>
              <li><Link href="/">Go back to main page</Link></li>
          </ul>
      </nav>
      {radioStation ? (
        <div>
          <h1>{radioStation.name}</h1>
          <a className="center-text" href={radioStation.podcastLink} target="_blank" rel="noopener noreferrer">
           Listen to the radio
          </a>
          <p className="center-text" dangerouslySetInnerHTML={{ __html: formattedDescription }} />
          <img src={radioStation.imageURL} alt={radioStation.name} />
          {!recipientAddress && 
            <button className="center-text" onClick={connectWallet}>Connect Wallet</button>
          }
          {!user && recipientAddress && !isLoadingUser ? (
            <form className="center-text" onSubmit={signUp}>
              <input
                type="text"
                placeholder="Pen Name"
                value={signUpForm.penName}
                onChange={(e) =>
                  setSignUpForm({ ...signUpForm, penName: e.target.value })
                }
              />
              <button type="submit">Sign Up</button>
            </form>
          ) : (
            isLoading ? <h2>Loading...</h2> : (
              <div>
                <h2 id="makeAPost"> Welcome, {user.penName}. Let's make a post for {radioStation.name}</h2>
                <form onSubmit={createPost} className="form">
                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="postType">Choose a type of post:</label>
                      <div className="select-container">
                        <select
                          id="postType"
                          value={postForm.postType}
                          required
                          onChange={(e) =>
                            setPostForm({ ...postForm, postType: e.target.value })
                          }
                        >
                          <option value="">Select a post type</option>
                          {postTypeOptions.map((option, index) => (
                            <option key={index} value={option.name || option}>
                              {option.name || option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                      <label htmlFor="postContent">Post content:</label>
                      <textarea
                          id="postContent"
                          value={postForm.content}
                          className="textarea"
                          required
                          onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                          style={{ width: "100%", height: "200px" }}  // Inline style for demonstration
                      />
                  </div>
                  <button type="submit" className="submit-button">Submit Post</button>
                </form>
                <h2 id="yourPosts"> Previous posts for {radioStation.name}</h2>
                <PostList posts={userPosts} onDelete={deletePost} />
                <div className="feedback-section">
                    <h2 id="feedback">We'd love to hear your feedback</h2>
                    <p>Your input helps us improve. Please take a moment to share your thoughts on our platform.</p>
                    <a 
                        href="https://docs.google.com/forms/d/e/1FAIpQLSf1OZuDeuVU9Q6wnRQVEZ46jOlWEgXbnoQ2QYPsay5BxiuSmQ/viewform" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="feedback-button"
                    >
                        Leave Feedback
                    </a>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        isLoading || isLoadingUser ? <h2>Loading...</h2> : (  // Check user loading state here too
            <div>
              ...
            </div>
        )
      )}
    </div>
  );
}

export default RadioStationPage;
