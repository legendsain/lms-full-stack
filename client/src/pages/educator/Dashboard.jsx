import React, { useContext, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';
import PredictiveAnalytics from '../../components/educator/PredictiveAnalytics';

const Dashboard = () => {

  const { backendUrl, isEducator, currency, getToken } = useContext(AppContext)
  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/dashboard',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        setDashboardData(data.dashboardData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchDashboardData()
    }
  }, [isEducator])

  return dashboardData ? (
    <div className='min-h-screen p-6 md:p-8 animate-fade-in'>
      <div className='space-y-8 max-w-5xl'>
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-surface-500 mt-1">Welcome back! Here's an overview of your courses.</p>
        </div>

        {/* --- Metrics Cards --- */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='stat-card'>
            <div className="stat-icon bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
              </svg>
            </div>
            <div>
              <p className='stat-value'>{dashboardData.enrolledStudentsData.length}</p>
              <p className='stat-label'>Total Enrolments</p>
            </div>
          </div>
          
          <div className='stat-card'>
            <div className="stat-icon bg-violet-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
              </svg>
            </div>
            <div>
              <p className='stat-value'>{dashboardData.totalCourses}</p>
              <p className='stat-label'>Total Courses</p>
            </div>
          </div>
          
          <div className='stat-card'>
            <div className="stat-icon bg-emerald-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <div>
              <p className='stat-value'>{currency}{Math.floor(dashboardData.totalEarnings)}</p>
              <p className='stat-label'>Total Earnings</p>
            </div>
          </div>
        </div>

        {/* --- Predictive Analytics Section --- */}
        <div className="w-full">
           <PredictiveAnalytics />
        </div>

        {/* --- Latest Enrolments Table --- */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Latest Enrolments</h2>
          <div className="premium-card overflow-hidden">
            <table className="table-premium">
              <thead>
                <tr>
                  <th className="hidden sm:table-cell w-16">#</th>
                  <th>Student Name</th>
                  <th>Course Title</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center hidden sm:table-cell text-surface-400">{index + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={item.student.imageUrl}
                          alt="Profile"
                          className="w-8 h-8 rounded-full ring-2 ring-surface-100"
                        />
                        <span className="truncate font-medium text-surface-800">{item.student.name}</span>
                      </div>
                    </td>
                    <td className="truncate">{item.courseTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Dashboard