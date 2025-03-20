import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Web3Auth = ({ onLogin }) => {
    const [wallet, setWallet] = useState(null);
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [message, setMessage] = useState("");
    const [showRegister, setShowRegister] = useState(false); // ✅ Controls whether to show registration
    const navigate = useNavigate();

    // ✅ Check session when the component loads (for auto-login)
    useEffect(() => {
        axios.get("http://localhost:5050/api/session", { withCredentials: true })
            .then((response) => {
                if (response.data.loggedIn) {
                    setWallet(response.data.wallet);
                    onLogin(response.data.wallet);
                    navigate("/"); // ✅ Redirect to main page
                }
            })
            .catch((error) => console.error("Session check failed:", error));
    }, []);

    // ✅ Check if MetaMask is installed and get the wallet address
    const connectWallet = async () => {
        if (!window.ethereum) {
            setMessage("Please install MetaMask.");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const walletAddress = await signer.getAddress();
            setWallet(walletAddress);
        } catch (err) {
            setMessage("Failed to connect to MetaMask.");
            console.error(err);
        }
    };

    // ✅ Handle user registration
    const registerUser = async () => {
        if (!wallet || !email || !company) {
            setMessage("Please fill in all fields.");
            return;
        }

        try {
            const response = await axios.post("http://localhost:5050/api/register", {
                wallet,
                email,
                company,
            });

            setMessage(response.data.message);
            setShowRegister(false); // ✅ Go back to login screen after registering
        } catch (err) {
            setMessage(err.response?.data?.message || "Registration failed.");
        }
    };

    // ✅ Handle user login
    const loginUser = async () => {
        if (!wallet) {
            setMessage("Please connect your MetaMask wallet first.");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:5050/api/login",
                { wallet },
                { withCredentials: true }
            );

            setMessage(response.data.message);
            onLogin(wallet);
            navigate("/dashboard"); // ✅ Redirect after login

        } catch (err) {
            setMessage(err.response?.data?.message || "Login failed.");
        }
    };

    return (
        <div>
            <h2>Blockchain Authentication</h2>

            {!wallet ? (
                <button onClick={connectWallet}>Connect MetaMask</button>
            ) : (
                <>
                    <p>✅ Connected Wallet: {wallet}</p>

                    {!showRegister ? (
                        <>
                            {/* ✅ Show choice between Login & Register */}
                            <button onClick={loginUser}>Login</button>
                            <button onClick={() => setShowRegister(true)}>Register</button>
                        </>
                    ) : (
                        <>
                            {/* ✅ Show Registration Form Only if Register is Selected */}
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <input
                                type="text"
                                placeholder="Enter company name"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                            />
                            <button onClick={registerUser}>Register</button>
                            <button onClick={() => setShowRegister(false)}>Back to Login</button>
                        </>
                    )}
                </>
            )}

            {message && <p style={{ color: "red" }}>{message}</p>}
        </div>
    );
};

export default Web3Auth;
