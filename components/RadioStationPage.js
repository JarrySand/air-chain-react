import { useState, useEffect } from "react";
import Link from 'next/link';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3Modal from "web3modal";
import { ethers } from 'ethers';
import { db } from '../utils/firebase';

function RadioStationPage({ walletAddress }) {
  const [radioStation, setRadioStation] = useState({});
  const [recipientAddress, setRecipientAddress] = useState("");
  const [signUpForm, setSignUpForm] = useState({ penName: "" });
  const [user, setUser] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [postForm, setPostForm] = useState({ content: "", postType: "" });
  const [postTypeOptions, setPostTypeOptions] = useState([]);
  const [userPosts, setUserPosts] = useState([]);

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  useEffect(() => {
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

  async function login() {
    const q = query(
      collection(db, "users"),
      where("walletAddress", "==", recipientAddress)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await signUp();
    } else {
      const userData = snapshot.docs[0].data();
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

  async function createPost() {
    const postData = {
      content: postForm.content,
      postType: postForm.postType,
      penName: userPenName,
      station: radioStation?.name,
      createdAt: serverTimestamp(),
    };

    if (postData.content && postData.postType && userPenName && radioStation) {
      await addDoc(collection(db, "listenerPosts"), postData);
      fetchUserPosts();
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
      {radioStation ? (
        <div>
          <h1>
            <Link href={`/radio-station/${radioStation.id}`}>
              {radioStation.name}
            </Link>
          </h1>
          <h1>{radioStation.name}</h1>
          <p dangerouslySetInnerHTML={{ __html: formattedDescription }} />
          <img src={radioStation.imageURL} alt={radioStation.name} />
          <button onClick={connectWallet}>Connect Wallet</button>
          {!user && (
            <form onSubmit={signUp}>
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
          )}
          {user && (
            <div>
              <h2>Welcome, {user.penName}</h2>
              <form onSubmit={createPost}>
                <textarea
                  placeholder="Write your post..."
                  value={postForm.content}
                  onChange={(e) =>
                    setPostForm({ ...postForm, content: e.target.value })
                  }
                />
                <select
                  value={postForm.postType}
                  onChange={(e) =>
                    setPostForm({ ...postForm, postType: e.target.value })
                  }
                >
                  {postTypeOptions.map((postType, index) => (
                    <option key={index} value={postType.name}>
                      {postType.name}
                    </option>
                  ))}
                </select>
                <button type="submit">Post</button>
              </form>
              {userPosts.map((post, index) => (
                <div key={index}>
                  <h3>{post.postType}</h3>
                  <p>{post.content}</p>
                  <button onClick={() => deletePost(post)}>Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <h1>Loading...</h1>
      )}
    </div>
  );
}

export default RadioStationPage;
