import React from 'react'
import '../index.css';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/button';

export default function Login() {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm();

    const navigate = useNavigate();

    const onSubmit = async (data) => {
        try {
            const response = await axios.post('http://localhost:5050/api/login', data, {
                withCredentials: true, // Important!
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
        }
    };
    return (
        <div className="login-form-wrapper">
            <h2 style={{ color: 'whitesmoke', fontFamily: 'system-ui' }}>Login</h2>
            <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="username" style={{ color: 'whitesmoke' }}>Username</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        required
                        {...register('username', {
                            required: 'Username is required',
                            minLength: {
                                value: 3,
                                message: 'Username must be at least 3 characters',
                            },
                        })}
                    />
                    {errors.username && (
                        <span className="error-message">{errors.username.message}</span>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="password" style={{ color: 'whitesmoke' }}>Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        {...register('password', {
                            required: 'Password is required',
                            minLength: {
                                value: 6,
                                message: 'Password must be at least 6 characters',
                            },
                        })}
                    />
                    {errors.password && (
                        <span className="error-message">{errors.password.message}</span>
                    )}
                </div>
                <div align="center">
                    <Button val={"Login"} />
                </div>
                {/* <button type="submit" className="login-button">Login</button> */}
                <div className="form-links">
                    {/* <a href="/forgot-password">Forgot password?</a> */}
                    <Link to="/register">Don't have an account? Register</Link>
                </div>
            </form>
        </div>
    )
}
