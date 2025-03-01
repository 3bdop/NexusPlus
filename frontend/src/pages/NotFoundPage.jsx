import React from 'react'
import { NavLink } from 'react-router-dom'

export default function NotFoundpage() {
    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(5deg, #1D1C1CFF 0%, #2516ADFF 100%)',
            position: 'relative'
        }}>
            <h1 style={{ color: 'snow', fontFamily: "system-ui" }}>It worked on my machine🤔</h1>
            <p style={{ color: 'snow', fontFamily: "system-ui" }}>But apparently not on the world wide web. Sorry about that! 🌍</p>
            <NavLink to={"/home"} style={{ fontFamily: "system-ui" }} >Back to home</NavLink>
        </div>
    )
}
