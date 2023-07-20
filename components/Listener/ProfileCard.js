import React from 'react';

const ProfileCard = ({ user, recipientAddress, attestations, listenerPosts, getRadioStationName }) => {

  const attestationCountsByStation = attestations.reduce((acc, curr) => {
    const stationName = getRadioStationName(curr.attester);
    acc[stationName] = (acc[stationName] || 0) + 1;
    return acc;
  }, {});

  const postCountsByStation = listenerPosts.reduce((acc, curr) => {
    const stationName = curr.station; // corrected line
    acc[stationName] = (acc[stationName] || 0) + 1;
    return acc;
  }, {});

  const maxAttestation = Math.max(...Object.values(attestationCountsByStation));

  return (
    <div className="profile-card">
      <div className="top">
        <div className="profile-info">
          <h1 className="penName">{user?.penName}</h1>  {/* Apply bigger font for penName */}
          <div className="wallet-address" title={recipientAddress}>{recipientAddress}</div>  {/* Apply smaller font for wallet address */}
        </div>
      </div>
      <div className="left">
        <div className="profile-info">Attestations: {attestations.length}</div>
        <a href="#attestations" className="button button-white">Check your attestations</a>
        <ul className="bar-list">
            {Object.entries(attestationCountsByStation)
            .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
            .map(([station, count]) => {
                const fullBars = Math.floor(count / 10);
                const partialBar = count % 10;
                const bars = [];

                for(let i = 0; i < fullBars; i++) {
                    bars.push(<div key={`full-${i}`} className="bar full-bar" />);
                }
                if(partialBar > 0) {
                    bars.push(<div key={`partial`} className="bar partial-bar" style={{width: `${partialBar * 10}%`}} />);
                }

                return (
                    <li key={station} className="bar-item">
                    <div className="station-name">{station}: {count}</div>
                    <div className="bars-container">{bars}</div>
                    </li>
                )
            })}
        </ul>
      </div>
      <div className="right">
        <div className="profile-info">Posts: {listenerPosts.length}</div>
        <a href="#yourPosts" className="button button-white">Check your posts</a>
        <ul className="bar-list">
            {Object.entries(postCountsByStation)
                .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
                .map(([station, count]) => {
                const fullBars = Math.floor(count / 10);
                const partialBar = count % 10;
                const bars = [];

                for(let i = 0; i < fullBars; i++) {
                    bars.push(<div key={`full-${i}`} className="bar full-bar" />);
                }
                if(partialBar > 0) {
                    bars.push(<div key={`partial`} className="bar partial-bar" style={{width: `${partialBar * 10}%`}} />);
                }

                return (
                    <li key={station} className="bar-item">
                    <div className="station-name">{station}: {count}</div>
                    <div className="bars-container">{bars}</div>
                    </li>
                )
            })}
        </ul>
      </div>
    </div>
  );
};

export default ProfileCard;
