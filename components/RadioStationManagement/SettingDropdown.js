import { useState, useEffect, useRef } from 'react';
import EditMyPage from './EditMyPage';
import EditPostTypeOptions from './EditPostTypeOptions';

function SettingsDropdown({ db, radioStation, setRadioStation, backToMain, recipientAddress }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const [showPostTypeOptionSetting, setShowPostTypeOptionSetting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const clickListener = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', clickListener);

    const hashChangeListener = () => {
      if (window.location.hash === '#settings') {
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    };

    window.addEventListener('hashchange', hashChangeListener);

    return () => {
      document.removeEventListener('click', clickListener);
      window.removeEventListener('hashchange', hashChangeListener);
    };
  }, []);

  const handleOptionClick = (option) => (event) => {
    event.stopPropagation();
    if (option === 'page') {
      setShowEditPage(true);
    } else if (option === 'postTypeOptions') {
      setShowPostTypeOptionSetting(true);
    }
    setShowDropdown(false); // close dropdown after clicking on an option
  };

  return (
    <>
      <div ref={dropdownRef} className="dropdown">
        <button
          className="button"
          variant="success"
          id="settings"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          Settings {/* Replace icon with "Settings" text */}
        </button>
        {showDropdown && (
          <div className="dropdown-menu">
            <button className="nav ul li" onClick={handleOptionClick('page')}>Edit My Page</button>
            <button className="nav ul li" onClick={handleOptionClick('postTypeOptions')}>Edit Post Type Options</button>
            <button className="nav ul li" onClick={() => window.open(`/radio-station/${recipientAddress}`, '_blank')}>View My Form Page</button>
          </div>
        )}
      </div>

      <EditMyPage
        db={db}
        radioStation={radioStation}
        setRadioStation={setRadioStation}
        backToMain={() => {setShowEditPage(false); backToMain();}}
        showEditPage={showEditPage}
      />

      <EditPostTypeOptions
        db={db}
        radioStation={radioStation}
        backToMain={() => {setShowPostTypeOptionSetting(false); backToMain();}}
        showPostTypeOptionSetting={showPostTypeOptionSetting}
      />
    </>
  );
}

export default SettingsDropdown;
