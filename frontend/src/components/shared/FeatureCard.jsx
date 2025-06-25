import React from 'react';
import { Card } from 'react-bootstrap';

const FeatureCard = ({ icon, title, description }) => {
  return (
    <Card className="h-100 border-0 shadow-sm hover-shadow transition-all">
      <Card.Body className="p-4 text-center">
        <div className="icon-lg bg-light-primary rounded-circle mb-3 mx-auto">
          <span className="fs-1">{icon}</span>
        </div>
        <h3 className="h5">{title}</h3>
        <p className="mb-0 text-muted">{description}</p>
      </Card.Body>
    </Card>
  );
};

export default FeatureCard;