import { useState, useEffect, useRef } from 'react';
import { FaCog } from 'react-icons/fa';
import EditMyPage from './EditMyPage';
import EditPostTypeOptions from './EditPostTypeOptions';

function SettingsDropdown({ db, radioStation, setRadioStation, backToMain }) {
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

    return () => {
      document.removeEventListener('click', clickListener);
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
        id="dropdown-basic"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaCog size={20} />
      </button>
        {showDropdown && (
          <div className="dropdown-menu">
            <button className="nav ul li" onClick={handleOptionClick('page')}>Edit My Page</button>
            <button className="nav ul li" onClick={handleOptionClick('postTypeOptions')}>Edit Post Type Options</button>
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
