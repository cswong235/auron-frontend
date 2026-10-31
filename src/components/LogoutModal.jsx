import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LogoutModal() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  async function handleLogOut() {
    setShow(false);
    await logout();
    navigate('/login');
  }

  return (
    <>
      <Button variant="fs-red" size="sm" className="me-2" onClick={handleShow}>
        Log out
      </Button>

      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered contentClassName="fs-modal">
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>Leave Auron?</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to log out?</Modal.Body>
        <Modal.Footer>
          <Button variant="fs-silver" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="fs-red" onClick={handleLogOut}>
            Log out
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
