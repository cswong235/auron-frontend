import { Nav, Offcanvas } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeftDoubleIcon, ArrowRightDoubleIcon } from '@hugeicons/core-free-icons';
import LogoutModal from './LogoutModal';
import './Sidebar.css';

// The pages in the sidebar, in the same order as the wireframe
const LINKS = [
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/statistics', label: 'Statistics' },
  { to: '/friends', label: 'Friends' },
  { to: '/currency-rates', label: 'Currency rates' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar({ show, onOpen, onClose }) {
  return (
    <>
      <div className="sidebar-rail d-none d-md-flex">
        <button type="button" className="sidebar-toggle" onClick={onOpen} aria-label="Open menu">
          <HugeiconsIcon icon={ArrowRightDoubleIcon} size={18} />
        </button>
      </div>

      <Offcanvas show={show} onHide={onClose} className="sidebar" data-bs-theme="dark">
        <Offcanvas.Header>
          <Link to="/" className="app-logo" onClick={onClose}>AURON</Link>
        </Offcanvas.Header>

        <Offcanvas.Body className="sidebar-body">
          <Nav className="flex-column">
            {LINKS.map((link) => (
              <Nav.Link key={link.to} as={NavLink} to={link.to} onClick={onClose}>
                {link.label}
              </Nav.Link>
            ))}
          </Nav>

          <div className="mt-auto">
            <LogoutModal />
          </div>

          <button type="button" className="sidebar-toggle sidebar-close" onClick={onClose} aria-label="Close menu">
            <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={18} />
          </button>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
