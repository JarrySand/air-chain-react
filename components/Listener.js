import React, { useState, useEffect } from 'react';
import { collection, addDoc, where, query, getDocs, Timestamp, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from '../utils/firebase';
import { getAttestationsByRecipient } from '../utils/easscan';
import PostList from './Listener/PostList';
import ProfileCard from './Listener/ProfileCard';
import FeedbackSection from './General/FeedbackSection';
import Navbar from './Listener/Navbar';
import AttestationsTable from './Listener/AttestationsTable';
import PostForm from './Listener/PostForm';
import SignUpForm from './Listener/SignUpForm'; 
import WalletConnector from './General/WalletConnector';

const defaultPostOptions = ["Opinion", "Question", "Request"];

const Listener = () => {
  const [loading, setLoading] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [signUpForm, setSignUpForm] = useState({ penName: "" });
  const [user, setUser] = useState(null);
  const [attestations, setAttestations] = useState([]);
  const [showDetails, setShowDetails] = useState({});
  const [radioStations, setRadioStations] = useState([]);
  const [listenerPostForm, setListenerPostForm] = useState({
    station: '',
    postType: '',
    content: ''
  });
  const defaultPostTypeOptions = defaultPostOptions;
  const [postTypeOptions, setPostTypeOptions] = useState([]);
  const [computedPostTypeOptions, setComputedPostTypeOptions] = useState([defaultPostTypeOptions]);
  const [listenerPosts, setListenerPosts] = useState([]);
 
  useEffect(() => {
    if (recipientAddress) {
      getAttestationsByRecipient(recipientAddress)
        .then(setAttestations)
        .catch(console.error);
  
      const fetchRadioStations = async () => {
        try {
          const radioStationsRef = collection(db, "radioStations");
          const radioStationsSnapshot = await getDocs(radioStationsRef);
          const radioStationsData = radioStationsSnapshot.docs.map(doc => doc.data());
          setRadioStations(radioStationsData);
        } catch (error) {
          console.error("Error fetching radio stations data:", error);
        }
      };
  
      fetchRadioStations();
    }
  }, [recipientAddress]);

  useEffect(() => {
    const fetchRadioStationsAndPostTypeOptions = async () => {
      const radioStationsSnapshot = await getDocs(collection(db, "radioStations"));
      const radioStationsData = radioStationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRadioStations(radioStationsData);
  
      const postTypeOptionsSnapshot = await getDocs(collection(db, "postTypeOptions"));
      const postTypeOptionsData = postTypeOptionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPostTypeOptions(postTypeOptionsData);
    };
  
    fetchRadioStationsAndPostTypeOptions();
  }, []); 
  
  
  useEffect(() => {
    const computePostTypeOptions = () => {
      const selectedStation = listenerPostForm.station;
      const radioStation = radioStations.find((station) => station.name === selectedStation);
  
      let selectedStationPostTypeOptions = [];
      if (radioStation) {
        const customPostOptions = postTypeOptions.filter((option) => option.radioStationWalletAddress === radioStation.walletAddress);
        selectedStationPostTypeOptions = customPostOptions.length > 0 ? customPostOptions : defaultPostOptions;
      }
  
      setComputedPostTypeOptions(selectedStationPostTypeOptions);
    };
  
    computePostTypeOptions();
  }, [listenerPostForm.station, radioStations, postTypeOptions]);

  useEffect(() => {
    if (user && user.walletAddress) {
      const listenerPostsRef = collection(db, 'listenerPosts');
      const q = query(listenerPostsRef, where('walletAddress', '==', user.walletAddress), orderBy("timestamp", "desc")) ;
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const posts = [];
        querySnapshot.forEach((doc) => {
          posts.push({ id: doc.id, ...doc.data() });
        });
        setListenerPosts(posts);
      });
  
      return () => unsubscribe();
    }
  }, [user]);
  
  const createUser = async penName => {
    const userData = {
      penName,
      walletAddress: recipientAddress,
    };

    await addDoc(collection(db, "users"), userData);
    setUser(userData);
  };
  
  const login = async (address) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("walletAddress", "==", address));
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      setUser(userData);
    } else {
      const penName = signUpForm.penName;
      if (penName) {
        await createUser(penName);
      }
    }
  };

  const handleWalletConnect = ({ address }) => {
    setRecipientAddress(address);
    login(address); 
  };
  
  const signUp = async event => {
    event.preventDefault();
    const penName = signUpForm.penName;
    if (penName) {
      await createUser(penName);
    }
  };

  const handleChange = (event) => {
    setSignUpForm({ penName: event.target.value });
  };

  const toggleDetails = id => {
    setShowDetails(prevShowDetails => ({
      ...prevShowDetails,
      [id]: !prevShowDetails[id],
    }));
  };

  const getRadioStationName = attesterAddress => {
    const radioStation = radioStations.find(
      station => station.walletAddress === attesterAddress
    );
    return radioStation ? radioStation.name : null;
  };

  const easScanUrl = id => `https://sepolia.easscan.org/attestation/view/${id}`;

  const handleFormSubmit = (e) => {
    e.preventDefault();
  
    if (!listenerPostForm.station || !listenerPostForm.postType || !listenerPostForm.content) {
      alert('All fields are required.');
      return;
    }
  
    const listenerPostsRef = collection(db, 'listenerPosts');
  
    const postWithAdditionalInfo = {
      ...listenerPostForm,
      penName: user.penName,
      walletAddress: user.walletAddress,
      radioStationWalletAddress: selectedStationWalletAddress,
      timestamp: Timestamp.now(),
    };
  
    addDoc(listenerPostsRef, postWithAdditionalInfo)
      .then(() => {
        alert('Post submitted successfully!');
        setListenerPostForm({
          station: '',
          postType: '',
          content: ''
        });
      })
      .catch((error) => {
        alert(`Error submitting post: ${error.message}`);
      });
  };

  const [selectedStationWalletAddress, setSelectedStationWalletAddress] = useState('');


  const deletePost = async (postId) => {
    const postRef = doc(db, 'listenerPosts', postId);
    await deleteDoc(postRef);
  };
  
  return (
    <div id="mainContent">
      <h1>on AIR/CHAIN</h1>
      <Navbar 
        recipientAddress={recipientAddress}
        user={user}
        attestations={attestations}
        listenerPosts={listenerPosts}
      />
      <WalletConnector onConnect={handleWalletConnect} />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {!user && recipientAddress && (
            <SignUpForm signUpForm={signUpForm} setSignUpForm={setSignUpForm} signUp={signUp} />
          )}
          {user && user.walletAddress && (
            <>
              <ProfileCard 
                user={user} 
                recipientAddress={recipientAddress} 
                attestations={attestations} 
                listenerPosts={listenerPosts} 
                getRadioStationName={getRadioStationName} 
              />
              {attestations.length > 0 && (
                <AttestationsTable
                  attestations={attestations}
                  showDetails={showDetails}
                  toggleDetails={toggleDetails}
                  getRadioStationName={getRadioStationName}
                  easScanUrl={easScanUrl}
                />
              )}
              <PostForm
                handleFormSubmit={handleFormSubmit}
                listenerPostForm={listenerPostForm}
                setListenerPostForm={setListenerPostForm}
                radioStations={radioStations}
                setSelectedStationWalletAddress={setSelectedStationWalletAddress}
                computedPostTypeOptions={computedPostTypeOptions}
              />
              <div>
                {listenerPosts.length > 0 && (
                  <div>
                    <h2 id="yourPosts">Your Posts:</h2>
                    <PostList posts={listenerPosts} onDelete={deletePost} />
                  </div>
                )}
              </div>
            </>
          )}
          <FeedbackSection />
        </>
      )}
    </div>
  );
};

export default Listener;
