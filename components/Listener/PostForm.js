import React from 'react';

function PostForm({ handleFormSubmit, listenerPostForm, setListenerPostForm, radioStations, setSelectedStationWalletAddress, computedPostTypeOptions }) {
  return (
    <>
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
    </>
  );
}

export default PostForm;
