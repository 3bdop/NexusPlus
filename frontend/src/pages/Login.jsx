// import React, { useState, useEffect } from 'react'
// import '../index.css';
// import { useForm } from 'react-hook-form';
// import axios from 'axios';
// import { Link, useNavigate } from 'react-router-dom';
// import Button from '../components/ui/button';
// import { ethers } from "ethers";

// export default function Login() {
//     const {
//         register,
//         handleSubmit,
//         formState: { errors },
//     } = useForm();

//     const [wallet, setWallet] = useState(null);
//     const [email, setEmail] = useState("");
//     const [username, setUsername] = useState("");
//     const [gender, setGender] = useState("girl");
//     const [role, setRole] = useState("attendee");
//     const [message, setMessage] = useState("");
//     const [showRegister, setShowRegister] = useState(false); // ✅ Controls whether to show registration

//     const navigate = useNavigate();

//     useEffect(() => {
//         axios.get("http://localhost:5050/api/session", { withCredentials: true })
//             .then((response) => {
//                 if (response.data.loggedIn) {
//                     setWallet(response.data.wallet);
//                     onLogin(response.data.wallet);
//                     navigate("/"); // ✅ Redirect to main page
//                 }
//             })
//             .catch((error) => console.error("Session check failed:", error));
//     }, []);

//     const connectWallet = async () => {
//         if (!window.ethereum) {
//             setMessage("Please install MetaMask.");
//             return;
//         }

//         try {
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             const walletAddress = await signer.getAddress();
//             setWallet(walletAddress);
//         } catch (err) {
//             setMessage("Failed to connect to MetaMask.");
//             console.error(err);
//         }
//     };

//     const registerUser = async () => {
//         if (!wallet || !email || !username) {
//             setMessage("Please fill in all fields.");
//             return;
//         }

//         try {
//             const response = await axios.post("http://localhost:5050/api/register", {
//                 wallet,
//                 email,
//                 username,
//                 gender,

//             });

//             setMessage(response.data.message);
//             setShowRegister(false); // ✅ Go back to login screen after registering
//         } catch (err) {
//             setMessage(err.response?.data?.message || "Registration failed.");
//         }
//     };

//     const loginUser = async () => {
//         if (!wallet) {
//             setMessage("Please connect your MetaMask wallet first.");
//             return;
//         }

//         try {
//             const response = await axios.post(
//                 "http://localhost:5050/api/login",
//                 { wallet },
//                 { withCredentials: true }
//             );

//             setMessage(response.data.message);
//             onLogin(wallet);
//             navigate("/dashboard"); // ✅ Redirect after login

//         } catch (err) {
//             setMessage(err.response?.data?.message || "Login failed.");
//         }
//     };



//     // const onSubmit = async (data) => {
//     //     try {
//     //         const response = await axios.post('http://localhost:5050/api/login', data, {
//     //             withCredentials: true, // Important!
//     //             headers: {
//     //                 'Content-Type': 'application/json'
//     //             }
//     //         });

//     //         if (response.status === 200) {
//     //             navigate('/dashboard');
//     //         }
//     //     } catch (error) {
//     //         console.error('Login error:', error);
//     //     }
//     // };
//     return (
//         <div className="login-form-wrapper">
//             <h2 style={{ color: 'whitesmoke', fontFamily: 'system-ui' }}>Login</h2>
//             {/* <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
//                 <div className="form-group">
//                     <label htmlFor="username" style={{ color: 'whitesmoke' }}>Username</label>
//                     <input
//                         type="text"
//                         id="username"
//                         name="username"
//                         required
//                         {...register('username', {
//                             required: 'Username is required',
//                             minLength: {
//                                 value: 3,
//                                 message: 'Username must be at least 3 characters',
//                             },
//                         })}
//                     />
//                     {errors.username && (
//                         <span className="error-message">{errors.username.message}</span>
//                     )}
//                 </div>
//                 <div className="form-group">
//                     <label htmlFor="password" style={{ color: 'whitesmoke' }}>Password</label>
//                     <input
//                         type="password"
//                         id="password"
//                         name="password"
//                         required
//                         {...register('password', {
//                             required: 'Password is required',
//                             minLength: {
//                                 value: 6,
//                                 message: 'Password must be at least 6 characters',
//                             },
//                         })}
//                     />
//                     {errors.password && (
//                         <span className="error-message">{errors.password.message}</span>
//                     )}
//                 </div> */}
//             {/* <div align="center">
//                     <Button val={"Login"} type="submit" />
//                 </div> */}
//             {/* <button type="submit" className="login-button">Login</button> */}
//             {/* <div className="form-links">
//                     <Link to="/register">Don't have an account? Register</Link>
//                 </div> */}
//             {/* </form> */}
//             {!wallet ? (
//                 <button onClick={connectWallet}>Connect MetaMask</button>
//             ) : (
//                 <>
//                     <p>✅ Connected Wallet: {wallet}</p>

//                     {!showRegister ? (
//                         <>
//                             {/* ✅ Show choice between Login & Register */}
//                             <button onClick={loginUser}>Login</button>
//                             <button onClick={() => setShowRegister(true)}>Register</button>
//                         </>
//                     ) : (
//                         <>
//                             {/* ✅ Show Registration Form Only if Register is Selected */}
//                             <input
//                                 type="email"
//                                 placeholder="Enter your email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                             <input
//                                 type="text"
//                                 placeholder="Enter your username"
//                                 value={username}
//                                 onChange={(e) => setUsername(e.target.value)}
//                             />
//                             <input
//                                 type="text"
//                                 // placeholder="Enter your username"
//                                 value={gender}
//                             // onChange={(e) => setEmail(e.target.value)}
//                             />
//                             <input
//                                 type="text"
//                                 // placeholder="Enter your username"
//                                 value={role}
//                             // onChange={(e) => setEmail(e.target.value)}
//                             />

//                             <button onClick={registerUser}>Register</button>
//                             <button onClick={() => setShowRegister(false)}>Back to Login</button>
//                         </>
//                     )}
//                 </>
//             )}

//             {message && <p style={{ color: "red" }}>{message}</p>}
//         </div>
//     )
// }

// import React, { useState, useEffect } from 'react';
// import '../index.css';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import { ethers } from 'ethers';

// export default function Login() {
//     const [wallet, setWallet] = useState(null);
//     const [email, setEmail] = useState('');
//     const [username, setUsername] = useState('');
//     const [gender, setGender] = useState('female');
//     const [role, setRole] = useState('attendee');
//     const [message, setMessage] = useState('');
//     const [showRegister, setShowRegister] = useState(false); // Controls registration form visibility
//     const navigate = useNavigate();

//     // useEffect(() => {
//     //     axios.get('http://localhost:5050/api/session', { withCredentials: true })
//     //         .then((response) => {
//     //             if (response.data.loggedIn) {
//     //                 setWallet(response.data.wallet);
//     //                 navigate('/');
//     //             }
//     //         })
//     //         .catch((error) => console.error('Session check failed:', error));
//     // }, []);

//     const connectWallet = async () => {
//         if (!window.ethereum) {
//             setMessage('Please install MetaMask.');
//             return;
//         }

//         try {
//             const provider = new ethers.BrowserProvider(window.ethereum);
//             const signer = await provider.getSigner();
//             const walletAddress = await signer.getAddress();
//             setWallet(walletAddress);

//             // Check if user exists
//             const checkUser = await axios.get(
//                 `http://localhost:5050/api/getUserByWallet/${walletAddress}`,
//                 { withCredentials: true }
//             );

//             if (checkUser.data.exists) {
//                 await loginUser();
//             } else {
//                 setMessage('User not found. Please register.');
//                 setShowRegister(true); // Show registration form if user doesn't exist
//             }
//         } catch (err) {
//             setMessage('Failed to connect or check user existence.');
//             console.error(err);
//         }
//     };

//     const registerUser = async () => {
//         if (!wallet || !email || !username) {
//             setMessage('Please fill in all fields.');
//             return;
//         }

//         try {
//             const response = await axios.post(
//                 'http://localhost:5050/api/register',
//                 {
//                     wallet,
//                     email,
//                     username,
//                     gender,
//                     role,
//                 },
//                 { withCredentials: true }
//             );

//             setMessage(response.data.message);
//             await loginUser(); // Automatically log in after registration
//         } catch (err) {
//             setMessage(err.response?.data?.message || 'Registration failed.');
//         }
//     };

//     const loginUser = async () => {
//         try {
//             const response = await axios.post(
//                 'http://localhost:5050/api/login',
//                 { wallet },
//                 { withCredentials: true }
//             );

//             setMessage(response.data.message);
//             navigate('/dashboard');
//         } catch (err) {
//             setMessage(err.response?.data?.message || 'Login failed.');
//         }
//     };

//     return (
//         <div className="login-form-wrapper">
//             <h2 style={{ color: 'whitesmoke', fontFamily: 'system-ui' }}>Login</h2>

//             {!wallet ? (
//                 <>
//                     <button onClick={connectWallet}>Connect MetaMask</button>
//                     <button onClick={() => setShowRegister(true)}>Register</button>
//                 </>
//             ) : (
//                 <>
//                     <p>✅ Connected Wallet: {wallet}</p>

//                     {showRegister ? (
//                         <div className="registration-form">
//                             <input
//                                 type="email"
//                                 placeholder="Email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                             <input
//                                 type="text"
//                                 placeholder="Username"
//                                 value={username}
//                                 onChange={(e) => setUsername(e.target.value)}
//                             />
//                             <select
//                                 value={gender}
//                                 onChange={(e) => setGender(e.target.value)}
//                             >
//                                 <option value="female">Female</option>
//                                 <option value="male">Male</option>
//                                 <option value="other">Other</option>
//                             </select>
//                             <input
//                                 type="text"
//                                 value={role}
//                                 readOnly
//                             />
//                             <button onClick={registerUser}>Register</button>
//                             <button onClick={() => setShowRegister(false)}>Back</button>
//                         </div>
//                     ) : (
//                         <button onClick={loginUser}>Login</button>
//                     )}
//                 </>
//             )}

//             {message && <p style={{ color: 'red' }}>{message}</p>}
//         </div>
//     );
// }

import React, { useState } from 'react';
import '../index.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import Button from '../components/ui/Button';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';

import { motion } from "motion/react";
import { LinkPreview } from "../components/ui/link-preview";
import ShinyText from '../components/ui/ShinyText';

export default function Login() {
    const [wallet, setWallet] = useState(null);
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [gender, setGender] = useState('male');
    const [role] = useState('attendee');
    const [message, setMessage] = useState('');
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const navigate = useNavigate();

    const connectWallet = async () => {
        if (!window.ethereum) {
            setMessage('Please install MetaMask first.');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();
            setWallet(walletAddress);

            // Check if user exists in database
            const { data } = await axios.get(
                `http://localhost:5050/api/getUserByWallet/${walletAddress}`,
                { withCredentials: true }
            );

            if (!data.exists) {
                setShowRegistrationForm(true);
                setMessage('New user detected. Please complete registration.');
            }

        } catch (err) {
            // Handle actual errors (network issues, etc.)
            console.error("Connection error:", err);
            setMessage(err.response?.data?.message || 'Failed to connect wallet');
        }
    };

    const handleRegistration = async (e) => {
        e.preventDefault();
        if (!wallet || !email || !username || !gender) {
            setMessage('Please fill in all required fields.');
            return;
        }

        try {
            const response = await axios.post(
                'http://localhost:5050/api/register',
                {
                    wallet,
                    email,
                    username,
                    gender,

                },
                { withCredentials: true }
            );

            setMessage(response.data.message);
            await loginUser();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Registration failed.');
        }
    };

    const loginUser = async () => {
        try {
            const response = await axios.post(
                'http://localhost:5050/api/login',
                { wallet },
                { withCredentials: true }
            );

            setMessage(response.data.message);
            navigate('/dashboard');
        } catch (err) {
            setMessage(err.response?.data?.message || 'Login failed.');
        }
    };

    return (
        <div align='center'>
            {!wallet ? (
                <div>
                    <Button
                        onClick={connectWallet}
                        val={'Connect with MetaMask 🦊'}
                        disabled={!window.ethereum ? true : false}
                        color={'#9900FF8F'}
                    />

                    {/* </button> */}
                    {!window.ethereum && (
                        <span style={{ fontFamily: 'DM Serif Display, sans-serif', fontSize: '25px' }}>
                            <LinkPreview url="https://metamask.io/download" quality={50}>
                                <b><ShinyText text={'MetaMask'} disabled={false} speed={3} /></b>
                            </LinkPreview>{" "}
                            must be installed
                        </span>

                    )}
                </div>
            ) : (
                <div>
                    {/* <h2 style={{ fontFamily: 'system-ui' }}>Wallet ID is collected🦊</h2><br />
                    <ShinyText text={wallet} disabled={false} speed={3} className='custom-class' />

                    <div align='center'>
                        <br />
                        <Button
                            onClick={loginUser}
                            val={'Continue to Dashboard'}
                            color={'#0DFF008F'}
                        />
                    </div> */}
                    {showRegistrationForm ? (
                        <div className='login-form-wrapper'>
                            <h2 style={{ fontFamily: 'system-ui' }}>Complete Registration</h2>
                            <form onSubmit={handleRegistration}>
                                <div style={{ margin: '1rem 0' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Username:
                                        <input
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc'
                                            }}
                                            required
                                        />
                                    </label>
                                </div>

                                <div style={{ margin: '1rem 0' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Email:
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc'
                                            }}
                                            required
                                        />
                                    </label>
                                </div>

                                <div style={{ margin: '1rem 0' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                                        Gender:
                                        <select
                                            value={gender}
                                            onChange={(e) => setGender(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc'
                                            }}
                                        >
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    val="Complete Registration"
                                    color="#0DFF008F"
                                />
                            </form>
                        </div>
                    ) : (
                        <div>
                            <h2 style={{ fontFamily: 'system-ui' }}>Wallet ID is collected🦊</h2><br />
                            <ShinyText text={wallet} disabled={false} speed={3} className='custom-class' />
                            <div align='center'>
                                <br />
                                <Button
                                    onClick={loginUser}
                                    val={'Continue to Dashboard'}
                                    color={'#0DFF008F'}
                                    disabled={showRegistrationForm}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
            <div align='center'>
                {message && (
                    <span style={{ fontFamily: 'system-ui', color: '#FF0000FF' }}>
                        <TextGenerateEffect elements={[message]} duration={2} />
                    </span>
                )}
            </div>
        </div>
    );
}