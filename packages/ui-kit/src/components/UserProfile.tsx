import React from 'react';

// This component is now generic and receives user data and actions via props.

export interface UserProfileData {
  name: string;
  email: string;
}

interface UserProfileProps {
  user: UserProfileData;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  if (!user) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '65px',
        right: '0px', // Adjusted for better positioning within a relative parent
        width: '250px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #eee',
        padding: '16px',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{user.name}</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{user.email}</div>
      </div>
      <button
        onClick={onLogout}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f7f7f7',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        退出登录
      </button>
    </div>
  );
};

export default UserProfile;
