import { Spinner } from 'react-bootstrap';
import './LoadingCard.css';

export default function LoadingCard({ text }) {
  return (
    <div className="loading-screen">
      <div className="loading-card">
        <Spinner animation="border" role="status" />
        <p className="loading-text">{text}</p>
      </div>
    </div>
  );
}
