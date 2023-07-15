import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc } from '@firebase/firestore';

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

function EditPostTypeOptions({
  db,
  radioStation,
  backToMain,
  showPostTypeOptionSetting,
}) {
  const [postTypeOptions, setPostTypeOptions] = useState([]);
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

  const closeModalAndBack = () => {
    backToMain();
  };

  const definePostTypeOptionsAndClose = async (e) => {
    await definePostTypeOptions(e);
    closeModalAndBack();
  };

  return (
    <Popup isOpen={showPostTypeOptionSetting} onClose={backToMain}>
      <h2>Post Type Option Settings</h2>

      <form onSubmit={definePostTypeOptionsAndClose} className="form">
        <div className="form-group">
          <label>Post Type Option</label>
          <input type="text" value={postTypeOptionForm.name} onChange={e => setPostTypeOptionForm({ name: e.target.value })} required />
        </div>

        <button variant="primary" type="submit" className="feedback-button">Add Post Type Option</button>
      </form>

      {radioStation && radioStation.walletAddress && (
        <div>
          <h3>Current post type options</h3>
          <table className="table table-striped table-bordered table-hover">
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
                    <button variant="danger" onClick={() => deletePostTypeOption(option.id)} className="btn btn-danger">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Popup>
  );
}

export default EditPostTypeOptions;
