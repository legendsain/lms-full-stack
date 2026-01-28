import React, { useEffect, useRef, useState, useContext } from 'react'
import uniqid from 'uniqid'
import Quill from 'quill';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const AddCourse = () => {

  const { backendUrl, getToken } = useContext(AppContext)
  const { courseId } = useParams()

  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Form States
  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([]);
  
  // UI States
  const [showPopup, setShowPopup] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);

  // Popup Form State
  const [lectureDetails, setLectureDetails] = useState({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
  })

  // --- CHAPTER MANAGEMENT ---
  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name:');
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder: chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1,
        };
        setChapters([...chapters, newChapter]);
      }
    } else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
    } else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) =>
          chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
        )
      );
    }
  };

  // --- LECTURE MANAGEMENT ---
  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true);
    } else if (action === 'remove') {
      setChapters(
        chapters.map((chapter) => {
          if (chapter.chapterId === chapterId) {
            // Create a copy and remove the item
            const updatedContent = [...chapter.chapterContent];
            updatedContent.splice(lectureIndex, 1);
            return { ...chapter, chapterContent: updatedContent };
          }
          return chapter;
        })
      );
    }
  };

  const addLecture = () => {
    // 1. Validate Input inside Popup
    if (!lectureDetails.lectureTitle || !lectureDetails.lectureDuration || !lectureDetails.lectureUrl) {
        return toast.error("All fields (Title, Duration, URL) are required!");
    }

    // 2. Add to State
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1,
            lectureId: uniqid()
          };
          // Create copy to trigger re-render
          return { ...chapter, chapterContent: [...chapter.chapterContent, newLecture] };
        }
        return chapter;
      })
    );
    
    // 3. Reset & Close
    setShowPopup(false);
    setLectureDetails({
      lectureTitle: '',
      lectureDuration: '',
      lectureUrl: '',
      isPreviewFree: false,
    });
  };

  // --- SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. FINAL CLIENT-SIDE VALIDATION
      // Checks every single lecture for valid data before sending
      for (const chapter of chapters) {
        for (const lecture of chapter.chapterContent) {
            if (!lecture.lectureUrl || lecture.lectureUrl.trim() === '') {
                return toast.error(`Error: Lecture "${lecture.lectureTitle}" in chapter "${chapter.chapterTitle}" is missing a URL.`);
            }
        }
      }

      // 2. Prepare Data
      let data = {
        courseTitle,
        courseDescription: quillRef.current.root.innerHTML,
        coursePrice,
        discount,
        courseContent: chapters,
      }
  
      const formData = new FormData()
      formData.append('courseData', JSON.stringify(data))
      formData.append('image', image)
  
      const token = await getToken()
      
      // 3. Send Request (Edit vs Add)
      if (courseId) {
          formData.append('courseId', courseId) // Existing fix
          const { data } = await axios.post(backendUrl + '/api/educator/update-course', formData, { headers: { Authorization: `Bearer ${token}` } })
          if (data.success) {
            toast.success("Course Updated Successfully")
          } else {
            toast.error(data.message)
          }
      } else {
          const { data } = await axios.post(backendUrl + '/api/educator/add-course', formData, { headers: { Authorization: `Bearer ${token}` } })
          if (data.success) {
            toast.success("Course Added Successfully")
          } else {
            toast.error(data.message)
          }
      }

    } catch (error) {
      toast.error(error.message)
    }
  }

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
      });
    }
  }, []);

  useEffect(() => {
    const fetchCourseData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get(backendUrl + '/api/course/' + courseId, { headers: { Authorization: `Bearer ${token}` } })
            
            if (data.success && data.courseData) {
                const course = data.courseData
                setCourseTitle(course.courseTitle)
                setCoursePrice(course.coursePrice)
                setDiscount(course.discount)
                setImage(course.courseThumbnail)
                
                // IMPORTANT: Load chapters as-is from database
                setChapters(course.courseContent)
                
                if (quillRef.current) {
                    quillRef.current.root.innerHTML = course.courseDescription
                }
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    
    if (courseId) {
        fetchCourseData()
    }
  }, [courseId])

  return (
    <div className="h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0 bg-gray-50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-4xl w-full text-gray-500">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">{courseId ? 'Edit Course' : 'Create New Course'}</h1>
            <button type="submit" className="bg-black text-white py-2.5 px-8 rounded hover:bg-gray-800 transition">
              {courseId ? 'Update Course' : 'Add Course'}
            </button>
        </div>

        {/* Basic Info */}
        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-700">Course Title</p>
          <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder="e.g. Advanced React Patterns" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-300 focus:border-indigo-500" required />
        </div>
        
        <div className="flex flex-col gap-1">
          <p className="font-medium text-gray-700">Course Description</p>
          <div className="bg-white" ref={editorRef}></div>
        </div>

        {/* Pricing & Image */}
        <div className="flex flex-wrap gap-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-700">Price ($)</p>
            <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice} type="number" min="0" className="outline-none py-2 px-3 w-32 rounded border border-gray-300" required />
          </div>

          <div className="flex flex-col gap-1">
            <p className="font-medium text-gray-700">Discount (%)</p>
            <input onChange={e => setDiscount(e.target.value)} value={discount} type="number" min="0" max="100" className="outline-none py-2 px-3 w-32 rounded border border-gray-300" required />
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <p className="font-medium text-gray-700">Thumbnail</p>
            <label htmlFor="thumbnailImage" className="flex items-center gap-3 cursor-pointer">
              <div className="p-3 bg-indigo-50 rounded border border-indigo-100 hover:bg-indigo-100 transition">
                  <img src={assets.file_upload_icon} alt="" className="w-6 h-6" />
              </div>
              <input onChange={e => setImage(e.target.files[0])} type="file" id="thumbnailImage" hidden />
              {typeof image === 'string' ? <img src={image} alt="" className='w-24 h-16 object-cover rounded border' /> : image && <img src={URL.createObjectURL(image)} alt="" className='w-24 h-16 object-cover rounded border' />}
              {!image && <span className="text-sm text-gray-400">No file chosen</span>}
            </label>
          </div>
        </div>

        {/* Curriculum Builder */}
        <div className="mt-4">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Course Curriculum</h2>
          
          {chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex} className="bg-white border border-gray-200 rounded-lg mb-4 shadow-sm overflow-hidden">
              <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <img onClick={() => handleChapter('toggle', chapter.chapterId)} src={assets.dropdown_icon} width={14} alt="" className={`cursor-pointer transition-transform ${chapter.collapsed ? "-rotate-90" : ""}`} />
                  <span className="font-semibold text-gray-800">Chapter {chapterIndex + 1}: {chapter.chapterTitle}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-gray-500">{chapter.chapterContent.length} Lectures</span>
                    <button type="button" onClick={() => handleChapter('remove', chapter.chapterId)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete Chapter</button>
                </div>
              </div>
              
              {!chapter.collapsed && (
                <div className="p-4 bg-white">
                  {chapter.chapterContent.map((lecture, lectureIndex) => (
                    <div key={lectureIndex} className="flex justify-between items-center mb-3 p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition">
                      <div className="flex flex-col">
                          <span className="font-medium text-gray-800">{lectureIndex + 1}. {lecture.lectureTitle}</span>
                          <div className="flex gap-3 text-xs text-gray-500 mt-1">
                              <span>⏱ {lecture.lectureDuration} mins</span>
                              <span>🔗 <a href={lecture.lectureUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Link</a></span>
                              <span className={`px-2 py-0.5 rounded ${lecture.isPreviewFree ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {lecture.isPreviewFree ? 'Free Preview' : 'Paid'}
                              </span>
                          </div>
                      </div>
                      <img onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)} src={assets.cross_icon} alt="" className="cursor-pointer opacity-50 hover:opacity-100" />
                    </div>
                  ))}
                  <button type="button" className="w-full py-2 border-2 border-dashed border-indigo-200 text-indigo-500 rounded hover:bg-indigo-50 hover:border-indigo-300 transition font-medium text-sm mt-2" onClick={() => handleLecture('add', chapter.chapterId)}>
                    + Add Lecture to "{chapter.chapterTitle}"
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <button type="button" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium shadow-md flex items-center gap-2" onClick={() => handleChapter('add')}>
            <span className="text-xl leading-none">+</span> Add New Chapter
          </button>
        </div>

        {/* Lecture Popup Modal */}
        {showPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
              <div className="bg-white text-gray-700 p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-fadeIn">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">Add New Lecture</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                            value={lectureDetails.lectureTitle}
                            onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })}
                            placeholder="e.g. Introduction to Variables"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                            <input
                                type="number"
                                className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={lectureDetails.lectureDuration}
                                onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    checked={lectureDetails.isPreviewFree}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })}
                                />
                                <span className="ml-2 text-sm text-gray-700 font-medium">Free Preview?</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Video URL</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={lectureDetails.lectureUrl}
                            onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })}
                            placeholder="https://youtu.be/..."
                        />
                        <p className="text-xs text-gray-400 mt-1">Paste a valid YouTube or video link.</p>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button type="button" className="flex-1 bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition" onClick={() => setShowPopup(false)}>
                        Cancel
                    </button>
                    <button type="button" className="flex-1 bg-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition shadow-md" onClick={addLecture}>
                        Add Lecture
                    </button>
                </div>

                <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
                    ✕
                </button>
              </div>
            </div>
        )}
        
      </form>
    </div>
  )
}

export default AddCourse