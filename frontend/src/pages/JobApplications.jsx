import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Link,
  Dialog, DialogTitle, DialogContent, IconButton,
  TextField, Select, MenuItem, InputAdornment, Button,
  CircularProgress, Alert, Card, CardContent, CardActions, Chip
} from '@mui/material';
import {
  Close, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, CheckCircle,
  Cancel, Work, People
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { border } from '@mui/system';
import api from '../services/api';

export default function CompanyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);

  useEffect(() => {
    // Get the current user ID from localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    // Fetch employer-specific jobs
    api.get(`/api/company/jobs/applications?user_id=${userId}`)
      .then(res => {
        if (res.data.status === 'success') {
          setJobs(res.data.jobs);
        } else {
          setError('Error fetching company jobs');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching company jobs:', err);
        setError(err.response?.data?.detail || 'Failed to fetch company jobs');
        setLoading(false);
      });
  }, []);

  function onDocumentLoadSuccess({ numPages }) {
    setPdfLoading(false);
    setNumPages(numPages);
    setPageNumber(1);
  }

  function onDocumentLoadError(error) {
    setPdfLoading(false);
    setPdfError(error);
  }

  function changePage(offset) {
    setPageNumber(prev => Math.min(Math.max(prev + offset, 1), numPages));
  }

  function changeScale(newScale) {
    setScale(Math.min(Math.max(newScale, 0.5), 3));
  }

  const handleApprove = (applicationId) => {
    // Placeholder for approval logic
    console.log(`Approved application: ${applicationId}`);
    // You would typically call an API here to update the application status
  };

  const handleReject = (applicationId) => {
    // Placeholder for rejection logic
    console.log(`Rejected application: ${applicationId}`);
    // You would typically call an API here to update the application status
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Jobs Posted by Your Company
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : jobs.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>No jobs found for your company</Alert>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
          {jobs.map((job, index) => (
            <Card key={index} sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="div" gutterBottom>
                  {job.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Work sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Experience: {job.experience}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <People sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Applicants: {job.applicants_count}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: '8px', ml: 1, mb: 1 }}
                  onClick={() => console.log(`View applications for job: ${job.job_id}`)}
                >
                  View Applications ({job.applicants_count})
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

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
            {pdfLoading && <Typography>Loading PDF...</Typography>}
            {pdfError && <Typography color="error">Failed to load PDF</Typography>}

            <Document
              file={selectedPdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<Typography>Loading PDF...</Typography>}
            >
              <Page
                pageNumber={pageNumber}
                width={500 * scale}
              />
            </Document>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}