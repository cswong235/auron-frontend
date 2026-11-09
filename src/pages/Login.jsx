import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
import { apiFetch } from '../services/helpers';
import { useAuth } from '../context/AuthContext';
import Aurora from '../components/Aurora';
import './Login.css';

export default function Login() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // If already logged in, the user doesn't need to be in the login screen
  if (session) {
    return <Navigate to="/" replace />;
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if(mode === 'signup' && password !== confirmPassword){
        setError('Passwords do not match.');
        return;
    }
    setBusy(true);
    try {
      // Both routes return a session, so signing up logs you in too
      const path = mode === 'signup' ? '/signup' : '/login';
      const json = await apiFetch(path, { method: 'POST', body: { email, password } });
      // Hand the backend's session to the Supabase client so it's stored,
      // auto-refreshed, and picked up by AuthContext
      await supabase.auth.setSession({
        access_token: json.session.access_token,
        refresh_token: json.session.refresh_token,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function googleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  function toggleMode() {
    setMode(mode === 'signup' ? 'login' : 'signup');
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <Aurora colorStops={['#4a90c2', '#8e7cc3', '#4a90c2']} amplitude={1} blend={0.5} />
      </div>

      <Card className="login-card">
        <Row className="g-0">
          <Col className="login-form-side">
            <div className="login-logo">AURON</div>
            <h1 className="login-title">{mode === 'signup' ? 'Create an account' : 'Welcome back!'}</h1>
            <p className="login-subtitle">
              {mode === 'signup' ? 'Start tracking your daily budget' : 'Log in to keep your budget on track'}
            </p>

            <Form onSubmit={submit}>
              <Form.Group className="mb-3" controlId="loginEmail">
                <Form.Label visuallyHidden>Email</Form.Label>
                <Form.Control placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3" controlId="loginPassword">
                <Form.Label visuallyHidden>Password</Form.Label>
                <Form.Control
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Form.Group>
              {mode === 'signup' && (
                <Form.Group className="mb-3" controlId="loginConfirmPassword">
                  <Form.Label visuallyHidden>Confirm password</Form.Label>
                  <Form.Control
                    placeholder="Confirm password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </Form.Group>
              )}
              {error && <Alert variant="danger" className="py-2">{error}</Alert>}
              <Button type="submit" className="login-submit w-100" disabled={busy}>
                {mode === 'signup' ? 'Sign up' : 'Log in'}
              </Button>
            </Form>

            <div className="login-divider">Or continue with</div>
            <Button className="login-google w-100" onClick={googleLogin} type="button">
              Continue with Google
            </Button>
            <Button variant="link" className="login-toggle w-100" type="button" onClick={toggleMode}>
              {mode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
