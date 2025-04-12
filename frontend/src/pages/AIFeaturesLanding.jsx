export default function AIFeaturesLanding({ role }) {

    return (
        <div>
            {role === 'employer' && (
                <Link to="job-applicants">View Job Applications</Link>
            )}
            {role === 'attendee' && (
                <Link to="recommended-jobs">View Recommended Jobs</Link>
            )}
        </div>
    );
}