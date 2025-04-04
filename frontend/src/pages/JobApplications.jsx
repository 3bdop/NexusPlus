import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Link,
  Dialog, DialogTitle, DialogContent, IconButton,
  TextField, Select, MenuItem, InputAdornment, Button,
  CircularProgress, Alert, Card, CardContent, CardActions, Chip,
  Paper, Divider, Tooltip
} from '@mui/material';
import {
  Close, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, CheckCircle,
  Cancel, Work, People, PictureAsPdf, Email
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
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);

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

  const fetchApplicants = (jobId) => {
    setApplicantsLoading(true);
    setApplicantsError(null);

    api.get(`/api/job/${jobId}/applicants`)
      .then(res => {
        setApplicants(res.data.applicants || []);
        setSelectedJob({
          id: res.data.job_id,
          title: res.data.job_title,
          applicant_count: res.data.applicant_count
        });
        setApplicantsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching applicants:', err);
        setApplicantsError(err.response?.data?.message || 'Failed to fetch applicants');
        setApplicantsLoading(false);
      });
  };

  const handleViewCV = (applicantId) => {
    // Set the PDF URL to view
    setSelectedPdf(`/api/cv/${applicantId}`);
    setPdfLoading(true);
    setPdfError(null);
  };

  const handleApprove = (jobId, applicantId) => {
    api.post(`/api/job/${jobId}/applicant/${applicantId}/status`, { status: 'accepted' })
      .then(res => {
        // Update the applicants list to show the new status
        setApplicants(prevApplicants =>
          prevApplicants.map(applicant =>
            applicant.id === applicantId
              ? { ...applicant, status: 'accepted' }
              : applicant
          )
        );
      })
      .catch(err => {
        console.error('Error approving application:', err);
        alert('Failed to approve application: ' + (err.response?.data?.message || 'Unknown error'));
      });
  };

  const handleReject = (jobId, applicantId) => {
    api.post(`/api/job/${jobId}/applicant/${applicantId}/status`, { status: 'rejected' })
      .then(res => {
        // Update the applicants list to show the new status
        setApplicants(prevApplicants =>
          prevApplicants.map(applicant =>
            applicant.id === applicantId
              ? { ...applicant, status: 'rejected' }
              : applicant
          )
        );
      })
      .catch(err => {
        console.error('Error rejecting application:', err);
        alert('Failed to reject application: ' + (err.response?.data?.message || 'Unknown error'));
      });
  };

  const closeApplicantsDialog = () => {
    setSelectedJob(null);
    setApplicants([]);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 4,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Typography
          variant="h3"
          fontWeight="bold"
          color="#FFFFFF"
          gutterBottom
        >
          Company Job Applications
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
          Manage applications for jobs posted by your company
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 8, gap: 3 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" color="text.secondary">Loading company jobs...</Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            my: 4,
            py: 2,
            fontSize: '1rem',
            '& .MuiAlert-icon': { fontSize: 28 }
          }}
        >
          {error}
        </Alert>
      ) : jobs.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            my: 4,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: '#f9f9f9'
          }}
        >
          <Work sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No jobs found for your company
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
            When your company posts jobs, they will appear here for you to manage applications.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 3 }}>
          {jobs.map((job, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 3,
                borderRadius: 2,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <Box sx={{
                bgcolor: '#323238', // Dark theme color from tailwind config
                color: 'white',
                py: 1.5,
                px: 2,
                borderTopLeftRadius: 8,
                borderTopRightRadius: 8
              }}>
                <Typography variant="h6" fontWeight="bold">
                  {job.title}
                </Typography>
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip
                    icon={<Work />}
                    label={`Experience: ${job.experience}`}
                    variant="outlined"
                    sx={{ borderColor: '#1d1c20', color: '#FFFFFF' }}
                    size="medium"
                  />
                  <Chip
                    icon={<People />}
                    label={`${job.applicants_count} ${job.applicants_count === 1 ? 'Applicant' : 'Applicants'}`}
                    variant="outlined"
                    color={job.applicants_count > 0 ? "success" : "default"}
                    size="medium"
                  />
                </Box>
                <Typography variant="body1" sx={{ mb: 2, color: 'text.primary', minHeight: '80px' }}>
                  {job.description.length > 180 ? `${job.description.substring(0, 180)}...` : job.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                <Button
                  size="large"
                  variant="contained"
                  sx={{
                    borderRadius: '8px',
                    px: 3,
                    py: 1,
                    fontWeight: 'bold',
                    boxShadow: 2,
                    bgcolor: '#1d1c20',
                    '&:hover': {
                      bgcolor: '#323238',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => fetchApplicants(job.job_id)}
                  startIcon={<People />}
                >
                  View Applications ({job.applicants_count})
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Applicants Dialog */}
      <Dialog
        open={Boolean(selectedJob)}
        onClose={closeApplicantsDialog}
        maxWidth="lg"
        fullWidth
        sx={{ '& .MuiDialog-paper': { minHeight: '80vh' } }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#323238', // Dark theme color from tailwind config
            color: 'white',
            py: 1.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <People sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight="bold">
              {selectedJob ? `Applicants for ${selectedJob.title}` : 'Applicants'}
            </Typography>
            {selectedJob && selectedJob.applicant_count > 0 && (
              <Chip
                label={`${selectedJob.applicant_count} ${selectedJob.applicant_count === 1 ? 'Applicant' : 'Applicants'}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold',
                  ml: 1
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={closeApplicantsDialog}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.15)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#f5f5f5' }}>
          {applicantsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 6, gap: 2 }}>
              <CircularProgress size={50} thickness={4} />
              <Typography variant="subtitle1" color="text.secondary">Loading applicants...</Typography>
            </Box>
          ) : applicantsError ? (
            <Alert
              severity="error"
              sx={{
                my: 3,
                py: 1.5,
                fontSize: '1rem',
                '& .MuiAlert-icon': { fontSize: 24 }
              }}
            >
              {applicantsError}
            </Alert>
          ) : applicants.length === 0 ? (
            <Paper
              elevation={1}
              sx={{
                p: 4,
                my: 3,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: '#f9f9f9'
              }}
            >
              <People sx={{ fontSize: 50, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No applicants yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 2 }}>
                When candidates apply for this job, their applications will appear here.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 3, mb: 3 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#1d1c20' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Experience</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>CV</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '1rem' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applicants.map((applicant, index) => (
                    <TableRow
                      key={applicant.id}
                      sx={{ '&:nth-of-type(odd)': { backgroundColor: 'action.hover' }, '&:hover': { backgroundColor: 'action.selected' } }}
                    >
                      <TableCell sx={{ fontSize: '0.95rem', py: 2 }}>
                        <Typography variant="subtitle1" fontWeight="medium">{applicant.name}</Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.95rem', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Email sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                          <Typography>{applicant.email}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.95rem', py: 2 }}>{applicant.experience}</TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {applicant.has_cv ? (
                          <Tooltip title="View CV">
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PictureAsPdf />}
                              onClick={() => handleViewCV(applicant.id)}
                              sx={{
                                borderRadius: '8px',
                                bgcolor: '#1d1c20',
                                '&:hover': { bgcolor: '#323238' }
                              }}
                            >
                              View CV
                            </Button>
                          </Tooltip>
                        ) : (
                          <Chip label="No CV" variant="outlined" size="small" color="default" />
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="medium"
                            startIcon={<CheckCircle />}
                            onClick={() => handleApprove(selectedJob.id, applicant.id)}
                            disabled={applicant.status === 'accepted'}
                            sx={{ borderRadius: '8px', minWidth: '100px' }}
                          >
                            {applicant.status === 'accepted' ? 'Accepted' : 'Accept'}
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            size="medium"
                            startIcon={<Cancel />}
                            onClick={() => handleReject(selectedJob.id, applicant.id)}
                            disabled={applicant.status === 'rejected'}
                            sx={{ borderRadius: '8px', minWidth: '100px' }}
                          >
                            {applicant.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog
        open={Boolean(selectedPdf)}
        onClose={() => setSelectedPdf(null)}
        maxWidth="xl"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxWidth: '90vw',
            margin: '20px',
            borderRadius: '12px',
            boxShadow: 24
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#323238', // Dark theme color from tailwind config
            color: 'white',
            py: 1.5
          }}
        >
          <Typography variant="h6" fontWeight="bold">Applicant CV</Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              px: 1,
              py: 0.5
            }}>
              <IconButton
                onClick={() => changePage(-1)}
                disabled={pageNumber <= 1}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ChevronLeft />
              </IconButton>
              <TextField
                type="number"
                value={pageNumber}
                onChange={(e) => setPageNumber(Math.min(Math.max(Number(e.target.value), 1), numPages))}
                InputProps={{
                  endAdornment: <InputAdornment position="end" sx={{ color: 'white' }}>/ {numPages || 0}</InputAdornment>,
                  sx: { color: 'white', width: 80, input: { textAlign: 'center', color: 'white' } }
                }}
                variant="standard"
                size="small"
              />
              <IconButton
                onClick={() => changePage(1)}
                disabled={pageNumber >= numPages}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ChevronRight />
              </IconButton>
            </Box>

            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'rgba(255,255,255,0.15)',
              borderRadius: '20px',
              px: 1,
              py: 0.5
            }}>
              <IconButton
                onClick={() => changeScale(scale - 0.1)}
                disabled={scale <= 0.5}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ZoomOut />
              </IconButton>
              <Select
                value={scale}
                onChange={(e) => setScale(e.target.value)}
                variant="standard"
                sx={{
                  color: 'white',
                  '& .MuiSelect-icon': { color: 'white' },
                  '&:before, &:after': { borderBottomColor: 'white' },
                  width: 70
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 200 }
                  }
                }}
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3].map((zoom) => (
                  <MenuItem key={zoom} value={zoom}>
                    {(zoom * 100).toFixed(0)}%
                  </MenuItem>
                ))}
              </Select>
              <IconButton
                onClick={() => changeScale(scale + 0.1)}
                disabled={scale >= 3}
                sx={{ color: 'white', '&.Mui-disabled': { color: 'rgba(255,255,255,0.3)' } }}
              >
                <ZoomIn />
              </IconButton>
            </Box>

            <IconButton
              onClick={() => setSelectedPdf(null)}
              sx={{
                color: 'white',
                bgcolor: 'rgba(255,255,255,0.15)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            position: 'relative',
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'center',
            bgcolor: '#f5f5f5',
            p: 3
          }}
        >
          <Box sx={{
            border: '1px solid #ddd',
            borderRadius: 2,
            p: 2,
            bgcolor: 'white',
            overflow: 'auto',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            {pdfLoading && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={60} />
                <Typography variant="h6">Loading PDF...</Typography>
              </Box>
            )}
            {pdfError && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Alert severity="error" sx={{ width: '100%', maxWidth: 400 }}>
                  <Typography variant="subtitle1">Failed to load PDF</Typography>
                  <Typography variant="body2">{pdfError.message}</Typography>
                </Alert>
              </Box>
            )}

            <Document
              file={selectedPdf}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<CircularProgress />}
              noData={<Typography variant="h6">No PDF file specified</Typography>}
              error={<Typography variant="h6" color="error">Error loading PDF!</Typography>}
            >
              <Page
                pageNumber={pageNumber}
                width={650 * scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                canvasBackground="white"
              />
            </Document>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}