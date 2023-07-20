import React from "react";
import Link from 'next/link';

const NavBar = ({ recipientAddress, userPenName }) => {
  return (
    <nav>
      <ul>
        <li id="navFlexContainerLi">
          <div className="nav-flex-container" id="navFlexContainer">
            {recipientAddress && 
            <>
              <div>Your Address:</div>
              <div title={recipientAddress}>{recipientAddress}</div>
            </>}
            {userPenName && 
            <>
              <div>Pen name:</div>
              <div>{userPenName}</div>
            </>}
          </div>
        </li>
        {recipientAddress && 
        <li><a href="#makeAPost">Make a post</a></li>
        }
        {recipientAddress && 
        <li><a href="#yourPosts">Your posts</a></li>
        }
        <li><a href="#feedback">Feedback</a></li>
        <li><Link href="/">Go back to main page</Link></li>
      </ul>
    </nav>
  );
};

export default NavBar;
