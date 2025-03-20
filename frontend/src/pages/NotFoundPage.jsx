import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NotFoundpage() {
    return (
        <div
            style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(5deg, #1D1C1CFF 0%, #2516ADFF 100%)',
                position: 'relative'
            }}
        >
            <h1 style={{ color: 'snow', fontFamily: "system-ui" }}>
                It worked on my machine
                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif" alt="🤔" width="50" height="50" align="center" />
            </h1>
            <p style={{ color: 'snow', fontFamily: "system-ui" }}>
                But apparently not on the world wide web. Sorry about that!
                <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.gif" alt="🌏" width="32" height="32" align="center" />
            </p>
            <a href='/' style={{ fontFamily: "system-ui", color: 'lightblue' }} >Back to experience</a>
        </div>
    )
}
