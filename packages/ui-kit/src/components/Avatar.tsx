import React from 'react';

interface AvatarProps {
  name: string;
  onClick?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({ name, onClick }) => {
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      onClick={onClick}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#007bff',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: 'bold',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      title={name}
    >
      {initial}
    </div>
  );
};

export default Avatar;
