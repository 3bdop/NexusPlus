import React from 'react'
import '../index.css';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() { // Changed function name to Register
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch // Add this to watch password field
    } = useForm();

    const navigate = useNavigate();
    const password = watch("password"); // Watch password field for comparison

    const onSubmit = async (data) => {
        try {
            const response = await axios.post('https://nexusplus-api.vercel.app/api/register', data, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                navigate('/avatar-creation');
            }
        } catch (error) {
            console.error('Register error:', error);
        }
    };

    return (
        <div className="login-form-wrapper">
            <h2>Register</h2> {/* Changed title to Register */}
            <form className="login-form" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
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
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
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

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: value =>
                                value === password || 'Passwords do not match'
                        })}
                    />
                    {errors.confirmPassword && (
                        <span className="error-message">{errors.confirmPassword.message}</span>
                    )}
                </div>

                <button type="submit" className="login-button">Register</button>
                <div className="form-links">
                    <Link to="/" >Already have an account? Login</Link>
                </div>
            </form>
        </div>
    )
}