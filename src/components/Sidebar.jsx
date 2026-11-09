import { useState } from 'react';
import { Nav, Offcanvas } from 'react-bootstrap';
import { Link, NavLink } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
  DashboardSquare01Icon,
  MoneyExchange01Icon,
} from '@hugeicons/core-free-icons';
import LogoutModal from './LogoutModal';
import './Sidebar.css';

const LINKS = [
  { to: '/', label: 'Dashboard', icon: DashboardSquare01Icon },
  { to: '/currency-rates', label: 'Currency rates', icon: MoneyExchange01Icon },
];

function SidebarLinks({ onPick }) {
  return (
    <Nav className="flex-column sidebar-links">
      {LINKS.map((link) => (
        <Nav.Link key={link.to} as={NavLink} to={link.to} end onClick={onPick}>
          <HugeiconsIcon icon={link.icon} size={20} />
          <span>{link.label}</span>
        </Nav.Link>
      ))}
    </Nav>
  );
}

export default function Sidebar({ show, onClose }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="sidebar-rail d-none d-md-block">
        <div className={expanded ? 'sidebar-panel expanded' : 'sidebar-panel'}>
          {expanded && (
            <div className="sidebar-panel-content">
              <SidebarLinks onPick={() => setExpanded(false)} />
              <div className="mt-auto">
                <LogoutModal />
              </div>
            </div>
          )}

          <button
            type="button"
            className="sidebar-toggle sidebar-panel-toggle"
            onClick={() => setExpanded(!expanded)}
            aria-label={expanded ? 'Close menu' : 'Open menu'}
          >
            <HugeiconsIcon icon={expanded ? ArrowLeftDoubleIcon : ArrowRightDoubleIcon} size={18} />
          </button>
        </div>
      </div>

      <Offcanvas show={show} onHide={onClose} className="sidebar" data-bs-theme="dark">
        <Offcanvas.Header>
          <Link to="/" className="app-logo" onClick={onClose}>AURON</Link>
        </Offcanvas.Header>

        <Offcanvas.Body className="sidebar-body">
          <SidebarLinks onPick={onClose} />

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
