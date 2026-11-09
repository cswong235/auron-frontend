import { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { apiFetch } from '../services/helpers';
import { useAuth } from '../context/AuthContext';
import LoadingCard from '../components/LoadingCard';
import './UserProfile.css';

export default function UserProfile() {
  const { session } = useAuth();
  const token = session.access_token;

  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchUser(){
    return apiFetch(`/profile`, { token })
      // /profile sends back a single user object, so store it as is
      .then((data) => setUser(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchUser();
  }, [])

  let joined = '';
  let memberSince = '';
  if (user) {
    const joinedDate = new Date(user.created_at);
    joined = joinedDate.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' });
    memberSince = joinedDate.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  }

  return (
    <>
      <h1 className="profile-title">Profile</h1>
      {loading && <LoadingCard text="Loading profile..." />}
      {error && <Alert variant="danger">{error}</Alert>}

      {user && (
        <div className="profile-card">
          <div className="profile-banner"></div>

          <div className="profile-avatar">
            <HugeiconsIcon icon={UserIcon} size={56} />
          </div>

          <h2 className="profile-name">{user.username}</h2>
          <p className="profile-since">Saving with Auron since {memberSince}</p>

          <div className="profile-details">
            <div className="profile-detail">
              <HugeiconsIcon icon={Mail01Icon} size={22} />
              <div>
                <div className="profile-label">Email</div>
                <div>{session.user.email}</div>
              </div>
            </div>

            <div className="profile-detail">
              <HugeiconsIcon icon={Calendar03Icon} size={22} />
              <div>
                <div className="profile-label">Joined</div>
                <div>{joined}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
