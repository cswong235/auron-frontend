import { useState, useEffect } from 'react';
import { Alert, Col, Row } from 'react-bootstrap';
import { apiFetch } from '../services/helpers';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { session } = useAuth();
  const token = session.access_token;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  return (
    <Row>
      <Col xs={8}>
        {loading && <p>Loading...</p>}
        {error && <Alert>{error}</Alert>}
      </Col>
    </Row>
  );
}
