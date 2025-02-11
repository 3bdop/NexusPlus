import React from 'react'
import { Link, NavLink } from 'react-router-dom'

export default function Home() {
    return (
        <div>
            <h1>Home pages</h1>
            <NavLink to={"/avatar-creation"}>
                Create your avatar
            </NavLink>
        </div>
    )
}
