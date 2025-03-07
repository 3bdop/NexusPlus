// pages/AttendeeApplications.jsx
import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

export default function JobApplications() {
  // const [applications, setApplications] = React.useState([]);

  // React.useEffect(() => {
  //   // Fetch employer-specific data
  //   axios.get('/api/applications')
  //     .then(res => setApplications(res.data))
  //     .catch(console.error);
  // }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attendee Applications
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Position</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>{application.name}</TableCell>
                <TableCell>{application.position}</TableCell>
                <TableCell>{application.status}</TableCell>
                <TableCell>{new Date(application.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))} */}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}