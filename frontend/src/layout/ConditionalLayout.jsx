import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import EmployerLayout from './EmployerLayout';

export default function ConditionalLayout() {
    const { userRole } = useOutletContext();

    return (
        <>
            {userRole === 'employer' ? (
                <EmployerLayout>
                    <Outlet />
                </EmployerLayout>
            ) : (
                <DashboardLayout>
                    <Outlet />
                </DashboardLayout>
            )}
        </>
    );
}