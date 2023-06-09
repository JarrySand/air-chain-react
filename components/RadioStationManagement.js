import React, { useState, useEffect } from 'react';
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from "web3";
import { ethers } from 'ethers';
import { db } from '../utils/firebase';
import { collection, addDoc, where, query, getDocs, updateDoc, onSnapshot, doc, deleteDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { getAttestationsByAttester } from '../utils/easscan';
import RadioStationSettings from './RadioStationSettings';

const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26

const RadioStationManagement = () => {
    const [recipientAddress, setRecipientAddress] = useState(null);
    const [radioStationSignUpForm, setRadioStationSignUpForm] = useState({ name: '' });
    const [radioStation, setRadioStation] = useState(null);
    const [radioStationPosts, setRadioStationPosts] = useState([]);
    const [signer, setSigner] = useState(null);
    const [selectedParticipationType, setSelectedParticipationType] = useState(null);
    const [attestations, setAttestations] = useState([]);
    const [showDetails, setShowDetails] = useState({});
    const [users, setUsers] = useState([]);
    const [showSettings, setShowSettings] = useState(false);


    useEffect(() => {
        if (recipientAddress) {
            loginRadioStation(recipientAddress);
        }
    }, [recipientAddress]);

    useEffect(() => {
        if (radioStation) {
            fetchPosts();
        }
    }, [radioStation]);

    useEffect(() => {
        if (recipientAddress) {
            loginRadioStation(recipientAddress);
        }
    }, [recipientAddress]);

    useEffect(() => {
        if (recipientAddress) {
            const fetchAttestations = async () => {
                const attestationsData = await getAttestationsByAttester(recipientAddress);
                setAttestations(attestationsData);
            };
            fetchAttestations();
        }
    }, [recipientAddress]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnapshot = await getDocs(collection(db, "users"));
            const usersData = usersSnapshot.docs.map(doc => doc.data());
            setUsers(usersData);
        };
        fetchUsers();
    }, []);


    const handleRadioStationNameChange = (event) => {
        setRadioStationSignUpForm({ name: event.target.value });
    }

    const fetchPosts = async () => {
        const postsCollection = collection(db, "listenerPosts");
        const q = query(postsCollection, where("station", "==", radioStation.name));
        const postsSnapshot = await getDocs(q);
        const posts = postsSnapshot.docs.map(doc => doc.data());
        setRadioStationPosts(posts);
    };

    const connectWallet = async () => {
        try {
            const providerOptions = {
                walletconnect: {
                    package: WalletConnectProvider,
                    options: {
                        rpc: {
                            1: "https://mainnet.infura.io/v3/2ff2983fb66349749d43fcb0a3402469",
                        },
                    },
                },
            };

            const web3Modal = new Web3Modal({
                cacheProvider: true,
                providerOptions,
            });

            const provider = await web3Modal.connect();
            const web3 = new Web3(provider);

            const signerFromProvider = new ethers.providers.Web3Provider(provider).getSigner();
            setSigner(signerFromProvider); // update the signer state
            const accounts = await web3.eth.getAccounts();
            const rawAddress = accounts[0];
            const checksumAddress = ethers.utils.getAddress(rawAddress);
            setRecipientAddress(checksumAddress);

            // Here you can fetch attestations and log in radio station as well
            // Not sure how you want to implement it so leaving it blank for now
            loginRadioStation(checksumAddress); // login when address is connected
        } catch (error) {
            console.error("Error connecting to wallet:", error);
        }
    }

    const signUpRadioStation = async () => {
        const radioStationName = radioStationSignUpForm.name;
        if (radioStationName) {
            const radioStationData = {
                name: radioStationName,
                walletAddress: recipientAddress,
            };
            await addDoc(collection(db, "radioStations"), radioStationData);
            setRadioStation(radioStationData);
        }
    }

    const loginRadioStation = async (address) => {
        const q = query(
            collection(db, "radioStations"),
            where("walletAddress", "==", address)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            await signUpRadioStation();
        } else {
            const radioStationData = snapshot.docs[0].data();
            setRadioStation(radioStationData);
        }
    }

    const createAttestation = async (post) => {
        if(!radioStation || !post || !post.participationType) {
            console.error('Invalid data, cannot create attestation');
            return;
        }
    
        const eas = new EAS(EASContractAddress);
        eas.connect(signer);
    
        const date = new Date();
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2); 
        const day = ("0" + date.getDate()).slice(-2);
        const formattedDate = year + month + day; 
    
        const schemaEncoder = new SchemaEncoder("string[] RadioStationName,uint64 Date,string TypeofParticipation");
        const encodedData = schemaEncoder.encodeData([
            { name: "RadioStationName", value: [radioStation.name], type: "string[]" },
            { name: "Date", value: Number(formattedDate), type: "uint64" },
            { name: "TypeofParticipation", value: post.participationType, type: "string" },
        ]);
    
        const schemaUID = "0x2a98ae55558be4e173402dbb3a2cbd38e1be1b815988cfb6faab22ffe6d45fc7";
    
        const tx = await eas.attest({
            schema: schemaUID,
            data: {
                recipient: post.walletAddress,
                expirationTime: 0,
                revocable: true,
                data: encodedData,
            },
        });
    
        const newAttestationUID = await tx.wait();
        console.log("New attestation UID:", newAttestationUID);
    }

    // New function for toggling details
    const toggleDetails = (id) => {
        setShowDetails(prevDetails => ({ ...prevDetails, [id]: !prevDetails[id] }));
    };

    // New function for generating EASscan URL
    const easScanUrl = (id) => `https://sepolia.easscan.org/attestation/view/${id}`;

    const getRecipientName = (recipientAddress) => {
        const user = users.find(user => user.walletAddress === recipientAddress);
        return user ? user.penName : 'Unknown Recipient';
    };
    
    const goToSettings = () => {
        setShowSettings(true);
    };

    const backToMain = () => {
        setShowSettings(false);
    };
    
    return (
        <div>
            {!radioStation ?
                <button onClick={connectWallet}>Connect Wallet</button> :
                <>
                    <p>Your Address: {recipientAddress}</p>
                    <button onClick={() => window.location.href=`/radio-station/${recipientAddress}`}>View My Page</button>
                    <p>Welcome, {radioStation.name}!</p>
                    <div>
                        {showSettings ? 
                            <RadioStationSettings 
                                db={db} 
                                radioStation={radioStation} 
                                setRadioStation={setRadioStation}
                                backToMain={backToMain} 
                            /> :
                            <>
                                <button onClick={goToSettings}>Go to Settings</button>
                            </>
                        }
                    </div>
                    {radioStation && recipientAddress && radioStationPosts.length > 0 && 
                        <div>
                            <h2 id="listenerPosts">Listener Posts for {radioStation.name}:</h2>
                            <table className="listener-posts">
                                <thead>
                                    <tr>
                                        <th>Pen Name</th>
                                        <th>Type</th>
                                        <th>Content</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {radioStationPosts.map(post => 
                                        <tr key={post.id} className="listener-post">
                                            <td>{post.penName}</td>
                                            <td>{post.postType}</td>
                                            <td>{post.content}</td>
                                            <td>
                                                <select id="participationType" name="participationType" 
                                                    onChange={(e) => setSelectedParticipationType({ ...post, participationType: e.target.value })}>
                                                    <option value="Selected post">Selected post</option>
                                                    <option value="The best post of the day">The best post of the day</option>
                                                    <option value="The best post of the year">The best post of the year</option>
                                                </select>
                                            </td>
                                            <td><button onClick={() => selectedParticipationType && createAttestation(selectedParticipationType)}>Attest</button></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    }
                </>
            }
            {!radioStation && recipientAddress &&
                <div>
                    <h2>Sign Up</h2>
                    <form onSubmit={signUpRadioStation}>
                        <label htmlFor="radioStationName">Radio Station Name:</label>
                        <input
                            type="text"
                            id="radioStationName"
                            value={radioStationSignUpForm.name}
                            onChange={handleRadioStationNameChange}
                            required
                        />
                        <button type="submit">Sign Up</button>
                    </form>
                </div>
            }
            {attestations.length > 0 && (
                <div>
                    <h2 id="issuedAttestations">Issued Attestations ({attestations.length}):</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Recipient</th>
                                <th>Data</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {attestations.map(attestation => (
                                <React.Fragment key={attestation.id}>
                                    <tr>
                                        <td>{getRecipientName(attestation.recipient)}</td>
                                        <td>
                                            Station Name: {attestation.decodedData.stationName} <br />
                                            Date: {attestation.decodedData.date} <br />
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
    );
    
    
};

export default RadioStationManagement;
