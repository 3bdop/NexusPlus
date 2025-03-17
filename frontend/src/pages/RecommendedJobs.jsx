import React, { useState } from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import SendIcon from '@mui/icons-material/Send';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const EXPERIENCE_LEVELS = {
    "Entry Level": "0-1",    // 0-12 months
    "Junior": "1-3",         // 1-3 years
    "Mid-Level": "3-6",      // 3-6 years
    "Senior": "6-10",        // 6-10 years
    "Expert": Infinity,   // 10+ years
};

const steps = [
    { label: 'Upload CV', icon: <DescriptionIcon /> },
    { label: 'Select Experience', icon: <WorkHistoryIcon /> },
    { label: 'Submit', icon: <SendIcon /> },
    { label: 'Recommended Jobs', icon: <AssignmentTurnedInIcon /> },
];

export default function RecommendedJobs() {
    const [cvUploaded, setCvUploaded] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [experienceLevel, setExperienceLevel] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [activeStep, setActiveStep] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const userId = "user123"; // Replace with actual user ID from authentication if needed

    const handleCvUpload = async (event) => {
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

            try {
                // First, upload the CV to storage
                const formData = new FormData();
                formData.append('cv_file', file);

                const uploadResponse = await fetch('http://localhost:5050/api/upload-cv', {
                    method: 'POST',
                    credentials: 'include', // Important for cookies
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Failed to upload CV');
                }

                setCvUploaded(true);
                setCvFile(file);
                setErrorMessage('');
                setActiveStep(1); // Move to the next step
            } catch (error) {
                setErrorMessage('Error uploading CV: ' + error.message);
                console.error('CV upload error:', error);
            }
        }
    };

    const handleExperienceLevelChange = (event) => {
        setExperienceLevel(event.target.value);
        setActiveStep(2); // Move to the next step
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setErrorMessage('');
        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            formData.append('experience_level', experienceLevel);

            const response = await fetch('http://localhost:8000/api/recommendations', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Error fetching recommendations');
            }

            const data = await response.json();
            if (data.status === "success") {
                setRecommendations(data.recommendations);
                setActiveStep(3); // Move to the final step
            } else {
                throw new Error("Unexpected response from API");
            }
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetProcess = () => {
        setCvUploaded(false);
        setCvFile(null);
        setExperienceLevel('');
        setRecommendations([]);
        setActiveStep(0);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 2 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%', marginBottom: 4 }}>
                {steps.map((step, index) => (
                    <Step key={step.label}>
                        <StepLabel
                            icon={
                                activeStep > index || (index === 3 && recommendations.length > 0) ? (
                                    <CheckCircleIcon color="success" />
                                ) : (
                                    step.icon
                                )
                            }
                        >
                            {step.label}
                        </StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Step 1: CV Upload */}
            {activeStep === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
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
                            disabled={cvUploaded}
                        >
                            Upload CV
                        </Button>
                    </label>
                    {cvUploaded && (
                        <Typography variant="body2" color="success.main">
                            CV Uploaded Successfully!
                        </Typography>
                    )}
                    {errorMessage && (
                        <Typography variant="body2" color="error.main">
                            {errorMessage}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Step 2: Experience Level Selection */}
            {activeStep === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">Select Experience Level</Typography>
                    <Select
                        value={experienceLevel}
                        onChange={handleExperienceLevelChange}
                        displayEmpty
                        sx={{ minWidth: 200 }}
                    >
                        <MenuItem value="" disabled>
                            Select Experience
                        </MenuItem>
                        {Object.entries(EXPERIENCE_LEVELS).map(([level, value]) => (
                            <MenuItem key={level} value={level}>
                                {level} ({value} years)
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
            )}

            {/* Step 3: Submission */}
            {activeStep === 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                        startIcon={<SendIcon />}
                    >
                        {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                    {submitting && (
                        <LinearProgress sx={{ width: '100%', marginTop: 2 }} />
                    )}
                    {errorMessage && (
                        <Typography variant="body2" color="error.main">
                            {errorMessage}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Step 4: Recommended Jobs */}
            {activeStep === 3 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="h6" align="center">Recommended Jobs</Typography>
                    {recommendations.map((job, index) => (
                        <Accordion key={index}>
                            <AccordionSummary
                                expandIcon={<ArrowDownwardIcon />}
                                aria-controls={`panel${index}-content`}
                                id={`panel${index}-header`}
                                style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 2 }}
                            >
                                <img
                                    src='https://upload.wikimedia.org/wikipedia/commons/b/b6/Ooredoo.svg'
                                    alt='wikimedia.org'
                                    style={{ width: 40 }}
                                />
                                <Typography component="span">
                                    {job.title} - {job.company}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography>
                                    {job.description}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={handleResetProcess}
                        sx={{ marginTop: 2 }}
                    >
                        Upload New CV
                    </Button>
                </Box>
            )}
        </Box>
    );
}
