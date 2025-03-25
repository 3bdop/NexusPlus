const allowedOrigins = [
    "https://nexusplus.vercel.app",
    // Add Vercel preview URLs for deployments
    /https:\/\/nexusplus-.*-3bdop\.vercel\.app/,
    // Add local development URLs
    "http://localhost:3000",
    "http://localhost:5050"
];

export default {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Check allowed origins
        const originIsAllowed = allowedOrigins.some(allowedOrigin => {
            if (typeof allowedOrigin === 'string') {
                return origin === allowedOrigin;
            }
            return allowedOrigin.test(origin);
        });

        originIsAllowed
            ? callback(null, true)
            : callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Cookie',
        'Set-Cookie'
    ],
    exposedHeaders: ['Set-Cookie']
};