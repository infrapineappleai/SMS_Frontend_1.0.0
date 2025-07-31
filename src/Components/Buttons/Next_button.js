// // src/Components/Buttons/Next_button.js
// import React from 'react';

// const NextButton = ({ label = 'Next', onClick }) => {
//   const style = {
//     width: '427px',
//     height: '46px',
//     borderRadius: '5px',
//     background: '#1F6978',
//     color: '#FFFFFF',
//     fontWeight: 700,
//     fontSize: '16px',
//     border: 'none',
//     cursor: 'pointer'
//   };

//   return (
//     <button type="button" style={style} onClick={onClick}>
//       {label}
//     </button>
//   );
// };

// export default NextButton;





import React, { useState, useEffect } from 'react';

const NextButton = ({ label = 'Next', onClick }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Base styles
  let style = {
    width: '427px',
    height: '46px',
    borderRadius: '5px',
    background: '#1F6978',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer'
  };

  // Override styles on mobile screens
  if (windowWidth <= 480) {
    style = {
      ...style,
      width: '90vw',
      height: '42px',
      fontSize: '14px'
    };
  } else if (windowWidth <= 768) {
    style = {
      ...style,
      width: '300px',
      height: '44px',
      fontSize: '15px'
    };
  }

  return (
    <button type="button" style={style} onClick={onClick}>
      {label}
    </button>
  );
};

export default NextButton;
