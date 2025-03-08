import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Link,
  Dialog, DialogTitle, DialogContent, IconButton,
  TextField, Select, MenuItem, InputAdornment
} from '@mui/material';
import { Close, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

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
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setLoading(false);
    setNumPages(numPages);
    setPageNumber(1);
  }

  function onDocumentLoadError(error) {
    setLoading(false);
    setError(error);
  }

  function changePage(offset) {
    setPageNumber(prev => Math.min(Math.max(prev + offset, 1), numPages));
  }

  function changeScale(newScale) {
    setScale(Math.min(Math.max(newScale, 0.5), 3));
  }
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
        maxWidth="lg"

        sx={{ '& .MuiDialog-paper': { height: '100vh' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <IconButton onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
              <ChevronLeft />
            </IconButton>
            <TextField
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(Math.min(Math.max(Number(e.target.value), 1), numPages))}
              InputProps={{
                endAdornment: <InputAdornment position="end">/ {numPages}</InputAdornment>,
                style: { width: 100 }
              }}
              variant="standard"
            />
            <IconButton onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
              <ChevronRight />
            </IconButton>
          </Box>

          <Box>
            <IconButton onClick={() => changeScale(scale - 0.1)} disabled={scale <= 0.5}>
              <ZoomOut />
            </IconButton>
            <Select
              value={scale}
              onChange={(e) => setScale(e.target.value)}
              variant="standard"
            >
              {[0.5, 0.75, 1, 1.5, 2, 3].map((zoom) => (
                <MenuItem key={zoom} value={zoom}>
                  {(zoom * 100).toFixed(0)}%
                </MenuItem>
              ))}
            </Select>
            <IconButton onClick={() => changeScale(scale + 0.1)} disabled={scale >= 3}>
              <ZoomIn />
            </IconButton>
          </Box>

          <IconButton onClick={() => setSelectedPdf(null)}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ position: 'relative', flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{
            border: '1px solid #ccc',
            borderRadius: 1,
            p: 1,
            bgcolor: 'background.paper',
            overflow: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            {loading && <Typography>Loading PDF...</Typography>}
            {error && <Typography color="error">Failed to load PDF</Typography>}

            <Document
              file={selectedPdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Typography>Loading PDF...</Typography>}
            >
              <Page
                pageNumber={pageNumber}
                width={500 * scale}
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}