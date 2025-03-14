import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Select, 
  MenuItem, 
  CircularProgress, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import axios from 'axios';

const EXPERIENCE_LEVELS = [
  "Entry Level",
  "Junior",
  "Mid-Level",
  "Senior",
  "Expert"
];

const steps = [
  { label: 'Upload CV', icon: <DescriptionIcon /> },
  { label: 'Select Experience', icon: <WorkHistoryIcon /> },
  { label: 'Recommended Jobs', icon: <AssignmentTurnedInIcon /> }
];

const API_URL = 'http://localhost:8000/api/recommendations';

export default function RecommendedJobs() {
  const [cvFile, setCvFile] = useState(null);
  const [experienceLevel, setExperienceLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedSkills, setExtractedSkills] = useState([]);

  const handleCvUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrorMessage('Only PDF files are allowed.');
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        setErrorMessage('File size should not exceed 3MB.');
        return;
      }
      setCvFile(file);
      setErrorMessage('');
      setActiveStep(1);
    }
  };

  const handleExperienceLevelChange = (event) => {
    setExperienceLevel(event.target.value);
    handleSubmit(event.target.value);
  };

  const handleSubmit = async () => {
    if (!cvFile || !experienceLevel) {
      setErrorMessage('Please upload CV and select experience level.');
      return;
    }
    setLoading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('cv_file', cvFile);
      formData.append('experience_level', experienceLevel.toLowerCase());

      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        const validRecommendations = Array.isArray(response.data.recommendations) 
          ? response.data.recommendations.map(job => ({
              title: job.title || 'No Title',
              company: job.company || 'No Company',
              experience: job.experience || 'Not specified',
              skills: Array.isArray(job.skills) ? job.skills : [],
              description: job.description || 'No description available'
            }))
          : [];

        const validSkills = Array.isArray(response.data.extracted_skills) 
          ? response.data.extracted_skills 
          : [];

        setRecommendations(validRecommendations);
        setExtractedSkills(validSkills);
        setActiveStep(2);
      }
    } catch (error) {
      console.error('API Error:', error);
      setErrorMessage(
        error.response?.data?.detail || 
        'Failed to get recommendations. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCvFile(null);
    setExperienceLevel('');
    setRecommendations([]);
    setExtractedSkills([]);
    setActiveStep(0);
    setErrorMessage('');
  };

  const stepperStyles = {
    marginBottom: '60px',  // Increased from 48px
    paddingX: '32px',
    '& .MuiStepLabel-label': {
      fontSize: '1.5rem',  // Increased from 1.2rem
      fontWeight: 600,     // Increased from 500
    },
    '& .MuiStepIcon-root': {
      width: '3.5em',      // Increased from 2.5em
      height: '3.5em',     // Increased from 2.5em
    },
    '& .MuiStepIcon-root.Mui-active': {
      color: '#8B5CF6',
    },
    '& .MuiStepIcon-root.Mui-completed': {
      color: '#7C3AED',
    },
    '& .MuiStepConnector-line': {
      borderColor: '#8B5CF6',
      borderWidth: '3px',  // Increased from 2px
    }
  };

  const containerStyles = {
    width: '100%',
    minHeight: '100vh',
    padding: { xs: 2, md: 6 },
    background: 'transparent',
    margin: '0 auto',
  };

  const skillChipStyles = {
    backgroundColor: 'rgba(139, 92, 246, 0.1)', 
    color: '#8B5CF6',
    fontSize: '0.95rem',
    fontWeight: 500,
    padding: '8px 16px',
    '&:hover': {
      backgroundColor: 'rgba(139, 92, 246, 0.2)',
    }
  };

  return (
    <Box sx={containerStyles}>

      {/* Stepper Section */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>  {/* Increased mb from 6 to 8 */}
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            width: '80%',     // Increased from 65%
            mx: 'auto',       // Center horizontally
            py: 3,            // Added padding top/bottom
            ...stepperStyles
          }}
        >
          {steps.map((step) => (
            <Step key={step.label}>
              <StepLabel 
                icon={React.cloneElement(step.icon, { 
                  style: { fontSize: '2rem' }  // Make the icons inside larger
                })}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Upload CV Section */}
      {activeStep === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <input
            accept=".pdf"
            style={{ display: 'none' }}
            id="cv-upload"
            type="file"
            onChange={handleCvUpload}
          />
          <label htmlFor="cv-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUploadIcon />}
              size="large"
              sx={{
                py: 2.5,
                px: 6,
                fontSize: '1.2rem',
                backgroundColor: '#8B5CF6',
                '&:hover': {
                  backgroundColor: '#7C3AED'
                }
              }}
            >
              Upload CV
            </Button>
          </label>
          {cvFile && (
            <Typography sx={{ mt: 3 }} color="#8B5CF6" variant="h6">
              CV Uploaded: {cvFile.name}
            </Typography>
          )}
        </Box>
      )}

      {/* Experience Level Section */}
      {activeStep === 1 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            displayEmpty
            sx={{ minWidth: 300, height: 56, fontSize: '1.1rem' }}
          >
            <MenuItem value="" disabled>
              Select Experience Level
            </MenuItem>
            {EXPERIENCE_LEVELS.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
              </MenuItem>
            ))}
          </Select>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              onClick={handleSubmit}
              endIcon={<SendIcon />}
              size="large"
              sx={{ py: 2, px: 4, fontSize: '1.1rem' }}
            >
              Get Recommendations
            </Button>
          </Box>
        </Box>
      )}

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress 
            size={60} 
            sx={{ color: '#8B5CF6' }}
          />
        </Box>
      )}

      {/* Results Section */}
      {activeStep === 2 && !loading && (
        <Box sx={{ mt: 4 }}>
          {/* Extracted Skills Section */}
          {extractedSkills.length > 0 && (
            <Box sx={{
              mb: 6,
              p: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LightbulbIcon sx={{ color: '#8B5CF6', mr: 2 }} />
                <Typography variant="h5" color="#8B5CF6" fontWeight="600">
                  Extracted Skills
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1.5}>
                {extractedSkills.map((skill, index) => (
                  <Chip 
                    key={index} 
                    label={skill} 
                    sx={skillChipStyles}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {/* Recommended Jobs Section */}
          <Typography 
            variant="h5" 
            gutterBottom 
            color="#8B5CF6"
            fontWeight="600"
            sx={{ mb: 3 }}
          >
            Recommended Jobs
          </Typography>
          {recommendations.length > 0 ? (
            recommendations.map((job, index) => (
              <Accordion 
                key={index} 
                sx={{
                  mb: 2,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  '&:before': {
                    display: 'none',
                  }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    {job.title} - {job.company}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" paragraph>
                    <strong>Experience Required:</strong> {job.experience}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Required Skills:</strong> {job.skills.join(', ')}
                  </Typography>
                  <Typography variant="body1">
                    {job.description}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography color="text.secondary" variant="h6">
              No job recommendations found.
            </Typography>
          )}

          <Button
            variant="contained"
            onClick={handleReset}
            sx={{ mt: 4, py: 2, px: 4, fontSize: '1.1rem' }}
          >
            Start New Search
          </Button>
        </Box>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Typography 
          color="error" 
          sx={{ mt: 3, textAlign: 'center', fontSize: '1.1rem' }}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
}