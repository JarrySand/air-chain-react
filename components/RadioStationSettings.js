import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, updateDoc } from '@firebase/firestore';

function RadioStationSettings({ db, radioStation, setRadioStation, backToMain }) {
  const [showEditPage, setShowEditPage] = useState(false);
  const [showPostTypeOptionSetting, setShowPostTypeOptionSetting] = useState(false);
  const [postTypeOptions, setPostTypeOptions] = useState([]);
  const [radioStationForm, setRadioStationForm] = useState({ description: '', podcastLink: '' });
  const [postTypeOptionForm, setPostTypeOptionForm] = useState({ name: '' });

  const fetchPostTypeOptions = async () => {
    const postTypeOptionsSnapshot = await getDocs(collection(db, "postTypeOptions"));
    setPostTypeOptions(postTypeOptionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })));
  };

  const getFilteredRadioStationPostTypeOptions = () => {
    if (!radioStation || !radioStation.walletAddress) {
      return [];
    }
    return postTypeOptions.filter(
      (option) => option.radioStationWalletAddress === radioStation.walletAddress
    );
  };

  useEffect(() => {
    fetchPostTypeOptions();
  }, []);

  const definePostTypeOptions = async (e) => {
    e.preventDefault();
    if (!radioStation || !radioStation.walletAddress) {
      console.error('Radio station walletAddress is not available');
      return;
    }
    const postTypeOptionData = {
      name: postTypeOptionForm.name,
      radioStationWalletAddress: radioStation.walletAddress,
    };

    const docRef = await addDoc(collection(db, "postTypeOptions"), postTypeOptionData);

    setPostTypeOptions([
      ...postTypeOptions,
      {
        id: docRef.id,
        ...postTypeOptionData,
      }
    ]);

    setPostTypeOptionForm({ name: "" });
  };

  const deletePostTypeOption = async (optionId) => {
    const optionRef = doc(db, "postTypeOptions", optionId);
    await deleteDoc(optionRef);

    setPostTypeOptions(
      postTypeOptions.filter((option) => option.id !== optionId)
    );
  };

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

  return (
    <>
      <h2 id="settings">Settings</h2>
      <button onClick={() => setShowEditPage(!showEditPage)}>
        {showEditPage ? 'Back to Dashboard' : 'Edit My Page'}
      </button>

      {showEditPage && (
        <div>
          <h2>Edit Radio Station Page</h2>
          <form onSubmit={updateRadioStation}>
            <label htmlFor="description">Description:</label>
            <textarea id="description" value={radioStationForm.description} onChange={e => setRadioStationForm({ ...radioStationForm, description: e.target.value })} required className="large-textarea"></textarea>

            <label htmlFor="podcastLink">Podcast Link:</label>
            <input type="url" id="podcastLink" value={radioStationForm.podcastLink} onChange={e => setRadioStationForm({ ...radioStationForm, podcastLink: e.target.value })} required />

            <button type="submit">Save Changes</button>
          </form>
        </div>
      )}

      <button onClick={() => setShowPostTypeOptionSetting(!showPostTypeOptionSetting)}>
        {showPostTypeOptionSetting ? 'Hide Post Type Option Setting' : 'Post Type Option Setting'}
      </button>

      {showPostTypeOptionSetting && (
        <div>
          <h2>Define Post Type Options</h2>
          <form onSubmit={definePostTypeOptions}>
            <label htmlFor="postTypeOption">Post Type Option:</label>
            <input type="text" id="postTypeOption" value={postTypeOptionForm.name} onChange={e => setPostTypeOptionForm({ name: e.target.value })} required />
            <button type="submit">Add Post Type Option</button>
          </form>

          {radioStation && radioStation.walletAddress && (
            <div>
              <h3>Current post type options</h3>
              <table>
                <thead>
                  <tr>
                    <th>Option Name</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredRadioStationPostTypeOptions().map((option) => (
                    <tr key={option.id}>
                      <td>{option.name}</td>
                      <td>
                        <button onClick={() => deletePostTypeOption(option.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <button onClick={backToMain}>Back</button>
    </>
  );
}

export default RadioStationSettings;
