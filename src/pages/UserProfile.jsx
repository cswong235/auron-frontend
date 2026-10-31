import { useState, useEffect } from 'react';
import { Alert, Card } from 'react-bootstrap';
import { apiFetch } from '../services/helpers';
import { useAuth } from '../context/AuthContext';
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

  return (
    <>
      <h1>User Profile</h1>
      {loading && <p>Loading user...</p>}
      {error && <Alert>{error}</Alert>}

      {user && (
        <Card>
          <Card.Header>User Profile</Card.Header>
          <Card.Body>
            <h2>{user.username}</h2>
            <h3>Joined Auron <strong>{new Date(user.created_at).toLocaleDateString()}</strong></h3>
            <p>Email: <strong>{session.user.email}</strong></p>
          </Card.Body>
        </Card>
      )}
    </>
  );
}
