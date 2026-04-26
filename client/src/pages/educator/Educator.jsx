import React from 'react'
import { Outlet } from 'react-router-dom'
import SideBar from '../../components/educator/SideBar'
import Navbar from '../../components/educator/Navbar'
import Footer from '../../components/educator/Footer'

const Educator = () => {
    return (
        <div className="text-default min-h-screen bg-surface-50">
            <Navbar />
            <div className='flex'>
                <SideBar />
                <main className='flex-1 min-h-screen'>
                    {<Outlet />}
                </main>
            </div>
            <Footer />
        </div>
    )
}

export default Educator