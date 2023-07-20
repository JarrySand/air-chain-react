import React from 'react';

function Navbar({ recipientAddress, user, attestations, listenerPosts }) {
  return (
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
  );
}

export default Navbar;
