import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Link,
  Dialog, DialogTitle, DialogContent, IconButton
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useState } from 'react';
import { Document, Page } from 'react-pdf';


export default function JobApplications() {
  // const [applications, setApplications] = React.useState([]);
  const applications = [
    {
      name: "mehdi",
      position: "Data analyst",
      cv: '/CV/1mb.pdf',
      date: Date.now(),
    },
    {
      name: "abood",
      position: "Data analyst",
      cv: '../../public/CV/Abdulrahman Muhanna 60101806.pdf',
      date: Date.now(),
    },
    {
      name: "ali",
      position: "Data analyst",
      cv: '/CV/1mb.pdf',
      date: Date.now(),
    },
  ]
  // React.useEffect(() => {
  //   // Fetch employer-specific data
  //   axios.get('/api/applications')
  //     .then(res => setApplications(res.data))
  //     .catch(console.error);
  // }, []);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  console.log(numPages)
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
              <TableCell>CV</TableCell>
              <TableCell>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {applications.map((application) => (
              <TableRow key={application.id}>
                <TableCell>{application.name}</TableCell>
                <TableCell>{application.position}</TableCell>
                <TableCell>
                  <Link
                    component="button"
                    onClick={() => setSelectedPdf(application.cv)}
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                  >
                    View CV
                  </Link>
                </TableCell>
                <TableCell>{new Date(application.date).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* PDF Viewer Modal */}
      <Dialog
        open={Boolean(selectedPdf)}
        onClose={() => setSelectedPdf(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          View CV
          <IconButton
            onClick={() => setSelectedPdf(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: '100vh' }}>
            <Document
              file={selectedPdf}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              <Page
                pageNumber={pageNumber}
                width={500}
                height={500}
              />
            </Document>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography>
              Page {pageNumber} of {numPages}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}