import React from 'react'
import { NavLink } from 'react-router-dom'
import { TextGenerateEffect } from '../components/ui/text-generate-effect'

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
                <TextGenerateEffect elements={['It', ' worked', ' on', ' my', ' machine',
                    <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif" alt="🤔" width="50" height="50" align="center" />]} duration={1} />
            </h1>
            <span style={{ color: 'snow', fontFamily: "system-ui" }}>
                <TextGenerateEffect elements={['But', 'apparently not', ' on the', ' world', ' wide wide.', ' Sorry about that!',
                    <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f30f/512.gif" alt="🌏" width="32" height="32" align="center" />]} duration={1.2} />
            </span>
            <a href='/' style={{ fontFamily: "system-ui", color: 'lightblue' }} >Back to experience</a>
        </div>
    )
}
