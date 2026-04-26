import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import Loading from '../../components/student/Loading';

const StudentsEnrolled = () => {

  const { backendUrl, getToken, isEducator } = useContext(AppContext)

  const [enrolledStudents, setEnrolledStudents] = useState(null)

  const fetchEnrolledStudents = async () => {
    try {
      const token = await getToken()

      const { data } = await axios.get(backendUrl + '/api/educator/enrolled-students',
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        setEnrolledStudents(data.enrolledStudents.reverse())
      } else {
        toast.success(data.message)
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (isEducator) {
      fetchEnrolledStudents()
    }
  }, [isEducator])

  return enrolledStudents ? (
    <div className="min-h-screen p-6 md:p-8 animate-fade-in">
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">Students Enrolled</h1>
          <p className="text-sm text-surface-500 mt-1">{enrolledStudents.length} total enrolment{enrolledStudents.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="premium-card overflow-hidden">
          <table className="table-premium">
            <thead>
              <tr>
                <th className="hidden sm:table-cell w-16">#</th>
                <th>Student Name</th>
                <th>Course Title</th>
                <th className="hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody>
              {enrolledStudents.map((item, index) => (
                <tr key={index}>
                  <td className="text-center hidden sm:table-cell text-surface-400">{index + 1}</td>
                  <td>
                    <div className="flex items-center gap-3">
                      <img
                        src={item.student.imageUrl}
                        alt=""
                        className="w-8 h-8 rounded-full ring-2 ring-surface-100"
                      />
                      <span className="truncate font-medium text-surface-800">{item.student.name}</span>
                    </div>
                  </td>
                  <td className="truncate">{item.courseTitle}</td>
                  <td className="hidden sm:table-cell text-surface-400">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {enrolledStudents.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">👨‍🎓</div>
              <p className="text-surface-400">No students enrolled yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : <Loading />
};

export default StudentsEnrolled;