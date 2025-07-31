// import React from 'react';

// const LongNextButton = ({ onClick }) => {
//   const styles = {
//     buttonWrapper: {
//       position: 'absolute',
//       bottom: '20px', // distance from bottom
//       left: '50%',
//       transform: 'translateX(-50%)', // center horizontally
//       width: '860px',
//       height: '46px',
//       zIndex: 1000,
//     },
//     button: {
//       width: '100%',
//       height: '100%',
//       borderRadius: '5px',
//       backgroundColor: '#1F6978',
//       color: '#fff',
//       fontSize: '16px',
//       fontWeight: 600,
//       border: 'none',
//       cursor: 'pointer',
//     },
//   };

//   return (
//     <div style={styles.buttonWrapper}>
//       <button style={styles.button} onClick={onClick}>
//         Next
//       </button>
//     </div>
//   );
// };

// export default LongNextButton;



import React, { useState, useEffect } from 'react';

const LongNextButton = ({ onClick }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getResponsiveWidth = () => {
    if (windowWidth <= 480) return '90vw';      // phones
    if (windowWidth <= 768) return '300px';     // tablets
    return '860px';                             // desktop
  };

  const styles = {
    buttonWrapper: {
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: getResponsiveWidth(),
      height: '46px',
      zIndex: 1000,
    },
    button: {
      width: '100%',
      height: '100%',
      borderRadius: '5px',
      backgroundColor: '#1F6978',
      color: '#fff',
      fontSize: windowWidth <= 480 ? '14px' : '16px',
      fontWeight: 600,
      border: 'none',
      cursor: 'pointer',
    },
  };

  return (
    <div style={styles.buttonWrapper}>
      <button style={styles.button} onClick={onClick}>
        Next
      </button>
    </div>
  );
};

export default LongNextButton;
