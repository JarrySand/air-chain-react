import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, updateDoc } from '@firebase/firestore';
import { Button, Modal, Form, Table } from 'react-bootstrap';

function RadioStationSettings({
  db,
  radioStation,
  setRadioStation,
  backToMain,
  initialShowEditPage,
  initialShowPostTypeOptionSetting,
}) {
  const [postTypeOptions, setPostTypeOptions] = useState([]);
  const [radioStationForm, setRadioStationForm] = useState({ description: '', podcastLink: '' });
  const [postTypeOptionForm, setPostTypeOptionForm] = useState({ name: '' });
  const [showEditPage, setShowEditPage] = useState(initialShowEditPage);
  const [showPostTypeOptionSetting, setShowPostTypeOptionSetting] = useState(initialShowPostTypeOptionSetting);


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

  const closeModalAndBack = () => {
    setShowEditPage(false);
    setShowPostTypeOptionSetting(false);
    backToMain();
  };

  const updateRadioStationAndClose = async (e) => {
    await updateRadioStation(e);
    closeModalAndBack();
  };

  const definePostTypeOptionsAndClose = async (e) => {
    await definePostTypeOptions(e);
    closeModalAndBack();
  };

  return (
    <>

      {/* Edit My Page Modal */}
      <Modal show={showEditPage} onHide={backToMain}>
        <Modal.Header closeButton>
          <Modal.Title>Edit My Page</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={updateRadioStationAndClose}>
            <Form.Group controlId="description">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={radioStationForm.description} onChange={e => setRadioStationForm({ ...radioStationForm, description: e.target.value })} required />
            </Form.Group>

            <Form.Group controlId="podcastLink">
              <Form.Label>Podcast Link</Form.Label>
              <Form.Control type="url" value={radioStationForm.podcastLink} onChange={e => setRadioStationForm({ ...radioStationForm, podcastLink: e.target.value })} required />
            </Form.Group>

            <Button variant="primary" type="submit">Save Changes</Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModalAndBack}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Post Type Option Settings Modal */}
      <Modal show={showPostTypeOptionSetting} onHide={backToMain}>
        <Modal.Header closeButton>
          <Modal.Title>Post Type Option Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={definePostTypeOptionsAndClose}>
            <Form.Group controlId="postTypeOption">
              <Form.Label>Post Type Option</Form.Label>
              <Form.Control type="text" value={postTypeOptionForm.name} onChange={e => setPostTypeOptionForm({ name: e.target.value })} required />
            </Form.Group>

            <Button variant="primary" type="submit">Add Post Type Option</Button>
          </Form>

          {radioStation && radioStation.walletAddress && (
            <div>
              <h3>Current post type options</h3>
              <Table striped bordered hover>
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
                        <Button variant="danger" onClick={() => deletePostTypeOption(option.id)}>Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModalAndBack}>Close</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default RadioStationSettings;
