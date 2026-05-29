import React from 'react';
import { Navigate } from 'react-router-dom';

const AddMemberPage: React.FC = () => <Navigate to="/admin/members" replace />;

export default AddMemberPage;
