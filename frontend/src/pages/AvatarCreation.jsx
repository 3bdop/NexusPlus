import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import { useNavigate } from 'react-router-dom';

const config = {
    clearCache: true,
    bodyType: 'fullbody',
    quickStart: false,
    language: 'en',
};

const style = { width: '100%', height: '100vh', border: 'none' };

export default function AvatarCreation() {
    const navigate = useNavigate();

    const handleOnUserSet = (event) => {
        console.log(`User ID is: ${event.data.id}`);
    };

    const handleOnAvatarExported = async (event) => {
        try {
            const avatarUrl = event.data.url;
            console.log(`Avatar URL is: ${avatarUrl}`);

            const response = await axios.patch('http://localhost:5050/api/add-avatarId',
                { avatarUrl },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                localStorage.setItem('avatarUrl', avatarUrl);
                navigate('/home');
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            // Handle error (show message to user, etc.)
        }
    };

    return (
        <div className="avatar-creator-container">
            <AvatarCreator
                subdomain="oneuni"
                config={config}
                style={style}
                onUserSet={handleOnUserSet}
                onAvatarExported={handleOnAvatarExported}
            />
        </div>
    );
}