import React, { useState, useEffect } from 'react';
import { collection, doc, query, where, updateDoc, getDocs } from '@firebase/firestore';

function Popup({ isOpen, onClose, children }) {
    if (!isOpen) return null;

    return (
        <div className='popup'>
        <div className='popup-content'>
            {children}
            <button className='close-button' onClick={onClose}>X</button>
        </div>
        </div>
    );
}

function EditMyPage({
  db,
  radioStation,
  setRadioStation,
  backToMain,
  showEditPage,
}) {
  const [radioStationForm, setRadioStationForm] = useState({ description: '', podcastLink: '' });

  useEffect(() => {
    const fetchRadioStationData = async () => {
      if (!showEditPage || !radioStation || !radioStation.walletAddress) return;

      const radioStationsCollection = collection(db, 'radioStations');
      const q = query(radioStationsCollection, where("walletAddress", "==", radioStation.walletAddress));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error('No matching documents.');
        return;
      } 

      const data = querySnapshot.docs[0].data();
      setRadioStationForm({ description: data.description, podcastLink: data.podcastLink });
    };

    fetchRadioStationData();
  }, [showEditPage, radioStation, db]);

  const updateRadioStation = async (e) => {
    e.preventDefault();
    if (!radioStation || !radioStation.walletAddress) {
      console.error('Radio station walletAddress is not available');
      return;
    }

    const radioStationsCollection = collection(db, 'radioStations');
    const q = query(radioStationsCollection, where("walletAddress", "==", radioStation.walletAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('No matching documents.');
      return;
    }

    querySnapshot.forEach((doc) => {
      updateDoc(doc.ref, radioStationForm);
    });

    setRadioStation({
      ...radioStation,
      ...radioStationForm
    });
  };

  const closeModalAndBack = () => {
    backToMain();
  };

  const updateRadioStationAndClose = async (e) => {
    await updateRadioStation(e);
    closeModalAndBack();
  };

  return (
    <Popup isOpen={showEditPage} onClose={backToMain}>
      <h2>Edit My Page</h2>

      <form onSubmit={updateRadioStationAndClose} className="form">
        <div className="form-group">
          <label>Description</label>
          <textarea rows={10} value={radioStationForm.description} onChange={e => setRadioStationForm({ ...radioStationForm, description: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>Podcast Link</label>
          <input type="url" value={radioStationForm.podcastLink} onChange={e => setRadioStationForm({ ...radioStationForm, podcastLink: e.target.value })} required />
        </div>

        <button variant="primary" type="submit" className="feedback-button">Save Changes</button>
      </form>
    </Popup>
  )
}

export default EditMyPage;
