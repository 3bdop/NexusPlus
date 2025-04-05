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
  Cancel, Work, People, PictureAsPdf, Email,
  Info, Share, LocationOn, Business, CalendarToday,
  Visibility, Add, Storage, Description, DataUsage, Assignment
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { border } from '@mui/system';
import { api } from '../api/fastapi';
import { apiClient } from '../api/client';

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
  const [userId, setUserId] = useState('')
  useEffect(() => {
    const fetchUserData = async () => {
      // Step 1: Fetch session data to get userId
      const sessionResponse = await apiClient.get(
        '/api/get-session',
        { withCredentials: true } // Include cookies in the request
      );
      if (!sessionResponse.data.userId) {
        throw new Error('No user ID found in session data.');
      }

      setUserId(userId)
    };

    fetchUserData();
  }, []);

  useEffect(() => {
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

  const [topRecommendedCandidate, setTopRecommendedCandidate] = useState(null);
  const [recommendedCandidates, setRecommendedCandidates] = useState([]);

  const fetchApplicants = (jobId) => {
    setApplicantsLoading(true);
    setApplicantsError(null);
    setTopRecommendedCandidate(null);
    setRecommendedCandidates([]);

    // Fetch applicants for the selected job

    api.get(`/api/job/${jobId}/applicants`)
      .then(res => {
        const applicants = res.data.applicants || [];
        const recommended = res.data.recommended_candidates || [];

        // Double-check to make sure no applicant appears in both lists
        const recommendedIds = new Set(recommended.map(candidate => candidate.id));
        const filteredApplicants = applicants.filter(applicant => !recommendedIds.has(applicant.id));

        console.log(`Frontend filtering: ${applicants.length} total applicants, ${filteredApplicants.length} after filtering out recommended`);

        setApplicants(filteredApplicants);
        setRecommendedCandidates(recommended);

        // Set the selected job with the correct applicant count
        setSelectedJob({
          id: res.data.job_id,
          title: res.data.job_title
        });

        // Set the top recommended candidate if available
        console.log('API response data:', res.data);
        console.log('Recommended candidates from API:', recommended.length);
        console.log('Top recommended candidate from API:', res.data.top_recommended_candidate);

        if (res.data.top_recommended_candidate) {
          console.log('Setting top recommended candidate');
          setTopRecommendedCandidate(res.data.top_recommended_candidate);
        } else {
          console.log('No top recommended candidate found in response');
        }

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
    <Box sx={{
      p: { xs: 2, sm: 3, md: 4 },
      maxWidth: 1400,
      mx: 'auto',
      bgcolor: '#0E0E10', // Dark background from theme
      minHeight: '100vh',
      color: '#FFFFFF'
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        mb: 4,
        pb: 3,
        borderBottom: '2px solid',
        borderColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Work sx={{ fontSize: 36, mr: 2, color: '#323238' }} />
          <Typography
            variant="h3"
            fontWeight="bold"
            color="#FFFFFF"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              letterSpacing: '-0.01em'
            }}
          >
            Company Job Applications
          </Typography>
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            mb: 1,
            fontSize: { xs: '0.95rem', sm: '1.1rem' },
            maxWidth: '800px'
          }}
        >
          Manage applications for jobs posted by your company and find the best candidates
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          my: 8,
          gap: 3,
          py: 6
        }}>
          <CircularProgress size={60} thickness={4} sx={{ color: '#323238' }} />
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading company jobs...</Typography>
        </Box>
      ) : error ? (
        <Alert
          severity="error"
          sx={{
            my: 4,
            py: 2,
            fontSize: '1rem',
            '& .MuiAlert-icon': { fontSize: 28 },
            bgcolor: 'rgba(211, 47, 47, 0.15)',
            color: '#f8d7da',
            border: '1px solid rgba(211, 47, 47, 0.3)',
            '& .MuiAlert-icon': { color: '#f8d7da' }
          }}
        >
          {error}
        </Alert>
      ) : jobs.length === 0 ? (
        <Paper
          elevation={3}
          sx={{
            p: 5,
            my: 4,
            textAlign: 'center',
            borderRadius: 3,
            bgcolor: '#1A1A1C',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            maxWidth: 600,
            mx: 'auto'
          }}
        >
          <Box sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'rgba(50, 50, 56, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}>
            <Work sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.7)' }} />
          </Box>
          <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 'bold', mb: 2 }} gutterBottom>
            No Jobs Found for Your Company
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 450, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
            When your company posts jobs, they will appear here for you to manage applications and find the best candidates.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              bgcolor: '#323238',
              '&:hover': { bgcolor: '#424248' },
              px: 3,
              py: 1,
              borderRadius: 2
            }}
          >
            Post a New Job
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 4 }}>
          {jobs.map((job, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                borderRadius: 3,
                transition: 'transform 0.3s, box-shadow 0.3s',
                bgcolor: '#1A1A1C',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflow: 'visible',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 12px 28px rgba(0, 0, 0, 0.25)',
                  '& .job-card-header': {
                    bgcolor: '#424248'
                  }
                }
              }}
            >
              <Box
                className="job-card-header"
                sx={{
                  bgcolor: '#323238',
                  color: 'white',
                  py: 2.5,
                  px: 3,
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  transition: 'background-color 0.3s'
                }}
              >
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.1rem', lineHeight: 1.4 }}>
                  {job.title}
                </Typography>
              </Box>
              <CardContent sx={{ flexGrow: 1, pt: 3, px: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Chip
                    icon={<Work sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                    label={`Experience: ${job.experience}`}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      bgcolor: 'rgba(50, 50, 56, 0.5)',
                      '& .MuiChip-label': { fontWeight: 500 }
                    }}
                    size="medium"
                  />
                  <Chip
                    icon={<People sx={{ color: 'rgba(255, 255, 255, 0.9)' }} />}
                    label={`${job.applicants_count} ${job.applicants_count === 1 ? 'Applicant' : 'Applicants'}`}
                    variant="outlined"
                    sx={{
                      borderColor: job.applicants_count > 0 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      bgcolor: job.applicants_count > 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(50, 50, 56, 0.5)',
                      '& .MuiChip-label': { fontWeight: 500 }
                    }}
                    size="medium"
                  />
                </Box>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 3,
                    color: 'rgba(255, 255, 255, 0.8)',
                    minHeight: '80px',
                    lineHeight: 1.6,
                    fontSize: '0.95rem'
                  }}
                >
                  {job.description.length > 180 ? `${job.description.substring(0, 180)}...` : job.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 3, pt: 0, justifyContent: 'center' }}>
                <Button
                  size="large"
                  variant="contained"
                  fullWidth
                  sx={{
                    borderRadius: '10px',
                    py: 1.2,
                    fontWeight: 'medium',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    bgcolor: '#1976d2',
                    textTransform: 'none',
                    fontSize: '0.95rem',
                    '&:hover': {
                      bgcolor: '#1565c0',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)'
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
        sx={{
          '& .MuiDialog-paper': {
            minHeight: '85vh',
            bgcolor: '#0E0E10',
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#1A1A1C',
            color: 'white',
            py: 2.5,
            px: 3,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: '#323238',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <People sx={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.9)' }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1.2rem', lineHeight: 1.3 }}>
                {selectedJob ? `Applicants for ${selectedJob.title}` : 'Applicants'}
              </Typography>
              {selectedJob && (
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                  Review and manage candidates for this position
                </Typography>
              )}
            </Box>
            {selectedJob && (
              <Chip
                label={`${applicants.length + recommendedCandidates.length} ${applicants.length + recommendedCandidates.length === 1 ? 'Applicant' : 'Applicants'}`}
                size="medium"
                sx={{
                  bgcolor: '#323238',
                  color: 'white',
                  fontWeight: 'bold',
                  ml: 2,
                  borderRadius: '8px',
                  height: 32
                }}
              />
            )}
          </Box>
          <IconButton
            onClick={closeApplicantsDialog}
            sx={{
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.08)',
              width: 40,
              height: 40,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
            }}
          >
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#0E0E10', position: 'relative' }}>
          {applicantsLoading ? (
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              my: 8,
              gap: 3,
              py: 6
            }}>
              <CircularProgress size={50} thickness={4} sx={{ color: '#323238' }} />
              <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading applicants...</Typography>
            </Box>
          ) : applicantsError ? (
            <Alert
              severity="error"
              sx={{
                m: 3,
                py: 2,
                fontSize: '1rem',
                bgcolor: 'rgba(211, 47, 47, 0.15)',
                color: '#f8d7da',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                '& .MuiAlert-icon': { color: '#f8d7da', fontSize: 28 }
              }}
            >
              {applicantsError}
            </Alert>
          ) : applicants.length === 0 && recommendedCandidates.length === 0 ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 5,
                  my: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  bgcolor: '#1A1A1C',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  maxWidth: 500,
                  width: '100%'
                }}
              >
                <Box sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: 'rgba(50, 50, 56, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <People sx={{ fontSize: 40, color: 'rgba(255, 255, 255, 0.7)' }} />
                </Box>
                <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold', mb: 2 }} gutterBottom>
                  No Applicants Yet
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', maxWidth: 400, mx: 'auto', mb: 4, lineHeight: 1.6 }}>
                  When candidates apply for this job, their applications will appear here. You'll be able to review their profiles and CVs.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': { borderColor: 'rgba(255, 255, 255, 0.5)', bgcolor: 'rgba(255, 255, 255, 0.05)' },
                    px: 3,
                    py: 1,
                    borderRadius: 2
                  }}
                >
                  Share Job Posting
                </Button>
              </Paper>
            </Box>
          ) : (
            <>
              {/* Recommendation System Info Section */}
              {(applicants.length > 0 || recommendedCandidates.length > 0) && recommendedCandidates.length === 0 && (
                <Box sx={{ px: 4, pt: 4, pb: 2 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      mb: 3,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      bgcolor: '#1A1A1C'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                      <Box sx={{
                        minWidth: 44,
                        height: 44,
                        borderRadius: '50%',
                        bgcolor: 'rgba(50, 50, 56, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        mt: 0.5
                      }}>
                        <Info sx={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.9)' }} />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{
                            color: '#FFFFFF',
                            mb: 1,
                            fontSize: '1.1rem'
                          }}
                        >
                          Recommendation System Information
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2, lineHeight: 1.6 }}>
                          No recommended candidates are available for this job at this time. This could be because:
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ pl: 7 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'rgba(50, 50, 56, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Storage sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.3 }}>
                            <strong>Missing embeddings:</strong> The job or applicants don't have the required embeddings in the database
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'rgba(50, 50, 56, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Description sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.3 }}>
                            <strong>No CV uploads:</strong> Applicants haven't uploaded their CVs
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'rgba(50, 50, 56, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <DataUsage sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.3 }}>
                            <strong>Insufficient data:</strong> The recommendation system needs more data to make accurate matches
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box sx={{
                            minWidth: 28,
                            height: 28,
                            borderRadius: '50%',
                            bgcolor: 'rgba(50, 50, 56, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Assignment sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.9)' }} />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mt: 0.3 }}>
                            <strong>Vague requirements:</strong> The job description might need more specific skills or requirements
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </Box>
              )}

              {/* Recommended Candidates Table */}
              {recommendedCandidates.length > 0 && (
                <Box sx={{ px: 4, pt: 2, pb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{
                      minWidth: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: 'rgba(76, 175, 80, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <CheckCircle sx={{ fontSize: 24, color: '#4caf50' }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          lineHeight: 1.3
                        }}
                      >
                        Top Recommended Candidate
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                        AI-powered match based on job requirements and candidate qualifications
                      </Typography>
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                      mb: 4,
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      borderRadius: 2,
                      bgcolor: '#1A1A1C',
                      overflow: 'hidden'
                    }}
                  >
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead sx={{ backgroundColor: 'rgba(76, 175, 80, 0.15)' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Experience</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>CV</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recommendedCandidates.map((candidate, index) => {
                          // Make sure candidate has all required properties
                          const hasCv = candidate.has_cv || false;

                          return (
                            <TableRow
                              key={candidate.id}
                              sx={{
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(50, 50, 56, 0.1)' },
                                '&:hover': { backgroundColor: 'action.selected' },
                                // Highlight the top recommended candidate
                                ...(index === 0 ? {
                                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
                                } : {})
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.95rem', py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip
                                    label="#1 Recommended"
                                    size="small"
                                    sx={{
                                      mr: 2,
                                      bgcolor: '#4caf50',
                                      color: 'white',
                                      fontWeight: 'bold',
                                      fontSize: '0.85rem',
                                      px: 1
                                    }}
                                  />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'rgba(255, 255, 255, 0.9)' }}>
                                    {candidate.name}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.95rem', py: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{
                                    minWidth: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(50, 50, 56, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1.5
                                  }}>
                                    <Email sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
                                  </Box>
                                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{candidate.email}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.95rem', py: 2, color: 'rgba(255, 255, 255, 0.9)' }}>{candidate.experience}</TableCell>
                              <TableCell sx={{ py: 2 }}>
                                {hasCv ? (
                                  <Tooltip title="View CV">
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<PictureAsPdf />}
                                      onClick={() => handleViewCV(candidate.id)}
                                      sx={{
                                        borderRadius: '8px',
                                        bgcolor: '#1976d2',
                                        '&:hover': { bgcolor: '#1565c0' },
                                        textTransform: 'none',
                                        boxShadow: 'none'
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
                                    onClick={() => handleApprove(selectedJob.id, candidate.id)}
                                    disabled={candidate.status === 'accepted'}
                                    sx={{
                                      borderRadius: '8px',
                                      minWidth: '100px',
                                      textTransform: 'none',
                                      boxShadow: 'none',
                                      bgcolor: candidate.status === 'accepted' ? 'rgba(76, 175, 80, 0.7)' : undefined,
                                      '&:hover': { bgcolor: candidate.status === 'accepted' ? 'rgba(76, 175, 80, 0.8)' : undefined },
                                      '&.Mui-disabled': { bgcolor: 'rgba(76, 175, 80, 0.7)', color: 'rgba(255, 255, 255, 0.8)' }
                                    }}
                                  >
                                    {candidate.status === 'accepted' ? 'Accepted' : 'Accept'}
                                  </Button>
                                  <Button
                                    variant="contained"
                                    color="error"
                                    size="medium"
                                    startIcon={<Cancel />}
                                    onClick={() => handleReject(selectedJob.id, candidate.id)}
                                    disabled={candidate.status === 'rejected'}
                                    sx={{
                                      borderRadius: '8px',
                                      minWidth: '100px',
                                      textTransform: 'none',
                                      boxShadow: 'none',
                                      bgcolor: candidate.status === 'rejected' ? 'rgba(211, 47, 47, 0.7)' : undefined,
                                      '&:hover': { bgcolor: candidate.status === 'rejected' ? 'rgba(211, 47, 47, 0.8)' : undefined },
                                      '&.Mui-disabled': { bgcolor: 'rgba(211, 47, 47, 0.7)', color: 'rgba(255, 255, 255, 0.8)' }
                                    }}
                                  >
                                    {candidate.status === 'rejected' ? 'Rejected' : 'Reject'}
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Other Applicants Table */}
              {applicants.length > 0 && (
                <Box sx={{ px: 4, pb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{
                      minWidth: 44,
                      height: 44,
                      borderRadius: '50%',
                      bgcolor: 'rgba(50, 50, 56, 0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2
                    }}>
                      <People sx={{ fontSize: 24, color: 'rgba(255, 255, 255, 0.9)' }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          lineHeight: 1.3
                        }}
                      >
                        Other Applicants
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
                        All other candidates who have applied for this position
                      </Typography>
                    </Box>
                  </Box>

                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                      mb: 3,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                      bgcolor: '#1A1A1C',
                      overflow: 'hidden'
                    }}
                  >
                    <Table sx={{ minWidth: 650 }}>
                      <TableHead sx={{ backgroundColor: '#323238' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Email</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Experience</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>CV</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: 'white', fontSize: '0.95rem', py: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {applicants.map((applicant, index) => {
                          // Make sure applicant has all required properties
                          const hasCv = applicant.has_cv || false;

                          return (
                            <TableRow
                              key={applicant.id}
                              sx={{
                                '&:nth-of-type(odd)': { backgroundColor: 'rgba(50, 50, 56, 0.3)' },
                                '&:hover': { backgroundColor: 'rgba(50, 50, 56, 0.5)' },
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.95rem', py: 2.5, borderBottom: 'none' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: 'rgba(255, 255, 255, 0.9)' }}>{applicant.name}</Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.95rem', py: 2.5, borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{
                                    minWidth: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    bgcolor: 'rgba(50, 50, 56, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 1.5
                                  }}>
                                    <Email sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.7)' }} />
                                  </Box>
                                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>{applicant.email}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.95rem', py: 2.5, color: 'rgba(255, 255, 255, 0.8)', borderBottom: 'none' }}>{applicant.experience}</TableCell>
                              <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                                {hasCv ? (
                                  <Tooltip title="View CV">
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<PictureAsPdf />}
                                      onClick={() => handleViewCV(applicant.id)}
                                      sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        boxShadow: 'none',
                                        bgcolor: '#1976d2',
                                        '&:hover': { bgcolor: '#1565c0' }
                                      }}
                                    >
                                      View CV
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <Chip
                                    label="No CV"
                                    variant="outlined"
                                    size="small"
                                    sx={{
                                      borderColor: 'rgba(255, 255, 255, 0.2)',
                                      color: 'rgba(255, 255, 255, 0.6)'
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell sx={{ py: 2.5, borderBottom: 'none' }}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                  <Button
                                    variant="contained"
                                    color="success"
                                    size="medium"
                                    startIcon={<CheckCircle />}
                                    onClick={() => handleApprove(selectedJob.id, applicant.id)}
                                    disabled={applicant.status === 'accepted'}
                                    sx={{
                                      borderRadius: '8px',
                                      minWidth: '100px',
                                      textTransform: 'none',
                                      boxShadow: 'none',
                                      bgcolor: applicant.status === 'accepted' ? 'rgba(76, 175, 80, 0.7)' : undefined,
                                      '&:hover': { bgcolor: applicant.status === 'accepted' ? 'rgba(76, 175, 80, 0.8)' : undefined },
                                      '&.Mui-disabled': { bgcolor: 'rgba(76, 175, 80, 0.7)', color: 'rgba(255, 255, 255, 0.8)' }
                                    }}
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
                                    sx={{
                                      borderRadius: '8px',
                                      minWidth: '100px',
                                      textTransform: 'none',
                                      boxShadow: 'none',
                                      bgcolor: applicant.status === 'rejected' ? 'rgba(211, 47, 47, 0.7)' : undefined,
                                      '&:hover': { bgcolor: applicant.status === 'rejected' ? 'rgba(211, 47, 47, 0.8)' : undefined },
                                      '&.Mui-disabled': { bgcolor: 'rgba(211, 47, 47, 0.7)', color: 'rgba(255, 255, 255, 0.8)' }
                                    }}
                                  >
                                    {applicant.status === 'rejected' ? 'Rejected' : 'Reject'}
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Show message if no applicants in either category */}
              {applicants.length === 0 && recommendedCandidates.length === 0 && (
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
              )}
            </>
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