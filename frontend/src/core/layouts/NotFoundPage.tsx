import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

const NotFoundPage: React.FC = () => (
  <div className="empty-state">
    <div className="empty-state__icon">
      <Compass size={56} />
    </div>
    <h3 className="empty-state__title">Page not found</h3>
    <p className="empty-state__description">
      That route does not exist in this demonstration. Use the sidebar to reach the dashboard.
    </p>
    <Link className="btn btn--primary btn--md" to="/dashboard" style={{ marginTop: '0.5rem' }}>
      Back to dashboard
    </Link>
  </div>
);

export default NotFoundPage;
