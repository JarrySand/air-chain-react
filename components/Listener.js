import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { collection, addDoc, where, query, getDocs, Timestamp, onSnapshot, deleteDoc, doc, orderBy } from "firebase/firestore";
import { db } from '../utils/firebase';
import Web3Modal from "web3modal";
import { getAttestationsByRecipient } from '../utils/easscan';
import PostList from '../components/PostList';
import ProfileCard from './ProfileCard';

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
    connectWallet();
  }, []);

  useEffect(() => {
    if (recipientAddress) {
      getAttestationsByRecipient(recipientAddress)
        .then(setAttestations)
        .catch(console.error);
  
      // Fetch radio stations data from Firebase Firestore
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
  
      // Call the fetch function
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
  }, []); // Empty dependency array means this effect runs once when the component mounts.
  
  
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
  
      // Clean up the listener when the component is unmounted
      return () => unsubscribe();
    }
  }, [user]);
  
  const createUser = async penName => {
    const userData = {
      penName,
      walletAddress: recipientAddress,
    };

    // Save user data to Firebase Firestore
    await addDoc(collection(db, "users"), userData);
    setUser(userData);
  };
  
  const login = async (address) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("walletAddress", "==", address));
    const snapshot = await getDocs(q);
  
    if (!snapshot.empty) {
      // User already exists, set the user state
      const userData = snapshot.docs[0].data();
      setUser(userData);
    } else {
      // User does not exist, proceed with signUp
      const penName = signUpForm.penName;
      if (penName) {
        await createUser(penName);
      }
    }
  };

  const connectWallet = async () => {
    setLoading(true);
    try {
      const providerOptions = {
        walletconnect: {
          package: WalletConnectProvider,
          options: {
            infuraId: "2ff2983fb66349749d43fcb0a3402469",
          },
        },
      };
  
      const web3Modal = new Web3Modal({ network: "mainnet", cacheProvider: true, providerOptions });
      const provider = await web3Modal.connect();
  
      const web3 = new Web3(provider);
      const accounts = await web3.eth.getAccounts();
      const rawAddress = accounts[0];
      const checksumAddress = web3.utils.toChecksumAddress(rawAddress);
      setRecipientAddress(checksumAddress);
      
      // login or signUp if user does not exist
      await login(checksumAddress);  // Passing the address directly
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    } finally {
      setLoading(false);
    }
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
  
    // validation
    if (!listenerPostForm.station || !listenerPostForm.postType || !listenerPostForm.content) {
      alert('All fields are required.');
      return;
    }
  
    // submit post to Firebase
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
  
  // render function
  return (
    <div id="mainContent">
      <h1>on AIR/CHAIN</h1>
      <nav>
        <ul>
          <li id="navFlexContainerLi">
            <div className="nav-flex-container" id="navFlexContainer">
              {recipientAddress && (
                <>
                  <div>Your Address:</div>
                  <div title={recipientAddress}>{recipientAddress}</div>
                </>
              )}
              {user && user.penName && (
                <>
                  <div>Pen name:</div>
                  <div>{user.penName}</div>
                </>
              )}
            </div>
          </li>
          {attestations.length > 0 && (
            <li><a href="#attestations">Attestations ({attestations.length})</a></li>
          )}
          {recipientAddress && (
            <li><a href="#makeAPost">Make a post</a></li>
          )}
          {listenerPosts.length > 0 && recipientAddress && (
            <li><a href="#yourPosts">Your Posts</a></li>
          )}
          {recipientAddress && (
            <li><a href="#feedback">Feedback</a></li>
          )}
        </ul>
      </nav>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {!user && !recipientAddress && (
            <button className="center-text" onClick={connectWallet}>Connect Wallet</button>
          )}

          {!user && recipientAddress && (
            <div>
              <h2>Sign Up</h2>
              <form onSubmit={signUp}>
                <label htmlFor="penName">Pen Name:</label>
                <input
                  type="text"
                  id="penName"
                  value={signUpForm.penName}
                  onChange={handleChange}
                  required
                />
                <button type="submit">Sign Up</button>
              </form>
            </div>
          )}
          <ProfileCard 
            user={user} 
            recipientAddress={recipientAddress} 
            attestations={attestations} 
            listenerPosts={listenerPosts} 
            getRadioStationName={getRadioStationName} // Pass it here
          />
          {user && attestations.length > 0 && (
            <div>
              <h2 id="attestations">Attestations ({attestations.length}):</h2>
              <table>
                <thead>
                  <tr>
                    <th>Radio Station</th>
                    <th>Data</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attestations.map(attestation => (
                    <React.Fragment key={attestation.id}>
                      <tr>
                        <td>{getRadioStationName(attestation.attester)}</td>
                        <td>
                          Station Name: {attestation.decodedData.stationName} <br/>
                          Date: {attestation.decodedData.date} <br/>
                          Participation Type: {attestation.decodedData.participationType}
                        </td>
                        <td>
                          <button onClick={() => toggleDetails(attestation.id)}>Details</button>
                        </td>
                      </tr>
                      {showDetails[attestation.id] && (
                        <tr>
                          <td colSpan="3">
                            <strong>ID:</strong> {attestation.id}<br />
                            <strong>Attester:</strong> {attestation.attester}<br />
                            <strong>Recipient:</strong> {attestation.recipient}<br />
                            <strong>RefUID:</strong> {attestation.refUID}<br />
                            <strong>Revocable:</strong> {attestation.revocable}<br />
                            <strong>Revocation Time:</strong> {attestation.revocationTime}<br />
                            <strong>Expiration Time:</strong> {attestation.expirationTime}<br />
                            <strong>EASscan URL:</strong> <a href={easScanUrl(attestation.id)} target="_blank" rel="noreferrer">{easScanUrl(attestation.id)}</a>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h2 id="makeAPost">Make a post</h2>
          <form onSubmit={handleFormSubmit} className="form">
            <div className="form-row">
              <div className="form-group half-width">
                <label htmlFor="station">Choose a radio station:</label>
                <div className="select-container">
                <select id="station" value={listenerPostForm.station} required 
                onChange={e => {
                    setListenerPostForm({...listenerPostForm, station: e.target.value});
                    const selectedStation = radioStations.find(station => station.name === e.target.value);
                    setSelectedStationWalletAddress(selectedStation ? selectedStation.walletAddress : '');
                }}>
                    <option value="">Select a station</option>
                    {radioStations.map((station, index) => 
                    <option key={index} value={station.name}>
                        {station.name}
                    </option>
                    )}
                </select>
                </div>
              </div>
              <div className="form-group half-width">
                <label htmlFor="postType">Choose a type of post:</label>
                <div className="select-container">
                  <select id="postType" value={listenerPostForm.postType} required onChange={e => setListenerPostForm({...listenerPostForm, postType: e.target.value})}>
                    <option value="">Select a post type</option>
                    {computedPostTypeOptions.map((option, index) =>
                      <option key={index} value={option.name || option}>
                        {option.name || option}
                      </option>
                    )}
                  </select>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="postContent">Post content:</label>
              <textarea id="postContent" value={listenerPostForm.content} className="textarea" required onChange={e => setListenerPostForm({...listenerPostForm, content: e.target.value})}></textarea>
            </div>
            <button type="submit" className="submit-button">Submit Post</button>
          </form>
          <div>
            {listenerPosts.length > 0 && user && user.walletAddress &&
              <div>
                <h2 id="yourPosts">Your Posts:</h2>
                <PostList posts={listenerPosts} onDelete={deletePost} />
              </div>
            }
          </div>
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
        </>
      )}
    </div>
  );
};

export default Listener;
