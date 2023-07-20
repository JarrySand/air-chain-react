import { useState, useEffect } from "react";
import { getFirestore, collection, query, where, getDocs, addDoc, doc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { ethers } from 'ethers';
import { db } from '../utils/firebase';
import PostList from '../components/PostList';
import NavBar from './RadioStationPage/NavBar';
import PostForm from './RadioStationPage/PostForm';
import FeedbackSection from './FeedbackSection';
import SignUpForm from './Listener/SignUpForm';  
import WalletConnector from './WalletConnector';

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
    fetchRadioStationInfo();
    fetchPostTypeOptions();
    fetchUserPosts();
    if (walletAddress) {
      login();
    }
  }, [walletAddress, user?.penName, radioStation?.name]);

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

  const handleWalletConnect = ({ address }) => {
    setRecipientAddress(address);
    login(address); 
  };

  const login = async (address) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("walletAddress", "==", recipientAddress));
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      setUser(userData);
      setIsLoadingUser(false);
    } else {
      const penName = signUpForm.penName;
      if (penName) {
        await createUser(penName);
      } else {
          setIsLoadingUser(false);
      }
    }
  };

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
      radioStationWalletAddress: radioStation?.walletAddress,
      timestamp: serverTimestamp(),
      walletAddress: recipientAddress
    };
  
    if (postData.content && postData.postType && userPenName && radioStation) {
      try {
        await addDoc(collection(db, "listenerPosts"), postData);
        fetchUserPosts();
        alert('Post submitted successfully!');
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
      <NavBar 
        recipientAddress={recipientAddress} 
        userPenName={userPenName} 
      />
      {radioStation ? (
        <div>
           <WalletConnector onConnect={handleWalletConnect} />
          <h1>{radioStation.name}</h1>
          <a className="center-text" href={radioStation.podcastLink} target="_blank" rel="noopener noreferrer">
           Listen to the radio
          </a>
          <p className="center-text" dangerouslySetInnerHTML={{ __html: formattedDescription }} />
          <img src={radioStation.imageURL} alt={radioStation.name} />

          {!user && recipientAddress && !isLoadingUser ? (
            <SignUpForm 
              signUpForm={signUpForm}
              setSignUpForm={setSignUpForm}
              signUp={signUp}
            />
          ) : (
            isLoadingUser ? <h2>Loading...</h2> : (
              <div>
                {recipientAddress ? (
                  <>
                    <PostForm 
                      user={user} 
                      radioStation={radioStation} 
                      postForm={postForm} 
                      setPostForm={setPostForm} 
                      createPost={createPost} 
                      postTypeOptions={postTypeOptions} 
                    />
                    <h2 id="yourPosts"> Previous posts for {radioStation.name}</h2>
                    <PostList posts={userPosts} onDelete={deletePost} />
                  </>
                ) : (
                  <h1>Please connect your wallet to create posts</h1>
                )}
                <FeedbackSection />
              </div>
            )
          )}
        </div>
      ) : (
        isLoadingUser ? <h2>Loading...</h2> : (
          <div>
            ...
          </div>
        )
      )}
    </div>
  );
}

export default RadioStationPage;
