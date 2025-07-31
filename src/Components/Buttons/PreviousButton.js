// import React from 'react';

// const PreviousButton = ({onClick}) => {
//   const style = {
//     width: '427px', height: '46px',
//     borderRadius: '5px',
//     background: '#FFFFFF',
//     color: '#1F6978',
//     fontWeight: 600,
//     fontSize: '16px',
//     border: '1px solid #1F6978',
//     cursor: 'pointer'
//   };
//   return <button type="button" style={style} onClick={onClick}>Previous</button>;
// };


// export default PreviousButton;



import React, { useState, useEffect } from 'react';

const PreviousButton = ({ onClick }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const style = {
    width: isMobile ? '90vw' : '427px',
    height: isMobile ? '42px' : '46px',
    borderRadius: '5px',
    background: '#FFFFFF',
    color: '#1F6978',
    fontWeight: 600,
    fontSize: isMobile ? '14px' : '16px',
    border: '1px solid #1F6978',
    cursor: 'pointer'
  };

  return <button type="button" style={style} onClick={onClick}>Previous</button>;
};

export default PreviousButton;
