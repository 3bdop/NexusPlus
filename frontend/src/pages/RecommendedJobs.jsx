import React, { useState } from 'react';
import { Box, Button, Typography, Stepper, Step, StepLabel, Select, MenuItem, CircularProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import DescriptionIcon from '@mui/icons-material/Description';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
            if (file.size > 3 * 1024 * 1024) { // 3MB in bytes
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

    const handleSubmit = async (selectedLevel) => {
        setLoading(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('cv_file', cvFile);
            formData.append('experience_level', selectedLevel.toLowerCase());

            const response = await axios.post(API_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.status === 'success') {
                // Ensure recommendations is an array and has the correct structure
                const validRecommendations = Array.isArray(response.data.recommendations) 
                    ? response.data.recommendations.map(job => ({
                        title: job.title || 'No Title',
                        company: job.company || 'No Company',
                        experience: job.experience || 'Not specified',
                        skills: Array.isArray(job.skills) ? job.skills : [],
                        description: job.description || 'No description available'
                    }))
                    : [];

                // Ensure extracted_skills is an array
                const validSkills = Array.isArray(response.data.extracted_skills) 
                    ? response.data.extracted_skills 
                    : [];

                setRecommendations(validRecommendations);
                setExtractedSkills(validSkills);
                setActiveStep(2);
            }
        } catch (error) {
            console.error('API Error:', error);
            setErrorMessage(error.response?.data?.detail || 'Failed to get recommendations. Please try again.');
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

    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto', padding: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {steps.map((step) => (
                    <Step key={step.label}>
                        <StepLabel icon={step.icon}>{step.label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {activeStep === 0 && (
                <Box sx={{ textAlign: 'center' }}>
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
                        >
                            Upload CV
                        </Button>
                    </label>
                    {cvFile && (
                        <Typography sx={{ mt: 2 }} color="success.main">
                            CV Uploaded: {cvFile.name}
                        </Typography>
                    )}
                </Box>
            )}

            {activeStep === 1 && (
                <Box sx={{ textAlign: 'center' }}>
                    <Select
                        value={experienceLevel}
                        onChange={handleExperienceLevelChange}
                        displayEmpty
                        sx={{ minWidth: 200 }}
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
                </Box>
            )}

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <CircularProgress />
                </Box>
            )}

            {activeStep === 2 && !loading && (
                <Box>
                    {extractedSkills.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Extracted Skills
                            </Typography>
                            <Typography>
                                {extractedSkills.join(', ')}
                            </Typography>
                        </Box>
                    )}

                    <Typography variant="h6" gutterBottom>
                        Recommended Jobs
                    </Typography>
                    {recommendations.length > 0 ? (
                        recommendations.map((job, index) => (
                            <Accordion key={index} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                    <Typography>
                                        {job.title} - {job.company}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Typography variant="body2" paragraph>
                                        <strong>Experience Required:</strong> {job.experience}
                                    </Typography>
                                    <Typography variant="body2" paragraph>
                                        <strong>Required Skills:</strong> {job.skills.join(', ')}
                                    </Typography>
                                    <Typography variant="body2">
                                        {job.description}
                                    </Typography>
                                </AccordionDetails>
                            </Accordion>
                        ))
                    ) : (
                        <Typography color="text.secondary">
                            No job recommendations found.
                        </Typography>
                    )}

                    <Button
                        variant="contained"
                        onClick={handleReset}
                        sx={{ mt: 3 }}
                    >
                        Start New Search
                    </Button>
                </Box>
            )}

            {errorMessage && (
                <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
                    {errorMessage}
                </Typography>
            )}
        </Box>
    );
}