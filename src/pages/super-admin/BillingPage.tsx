import React from 'react';
import AdminBillingPage from '../admin/BillingPage';

/**
 * Billing APIs are role-aware: SUPER_ADMIN receives records from every branch,
 * while ADMIN is restricted by the backend to their assigned branch.
 */
const SuperAdminBillingPage: React.FC = () => <AdminBillingPage hideFinalSettlement />;

export default SuperAdminBillingPage;
