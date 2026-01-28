import { v2 as cloudinary } from 'cloudinary'
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import { clerkClient } from '@clerk/express'

// update role to educator
export const updateRoleToEducator = async (req, res) => {

    try {

        const userId = req.auth.userId

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            },
        })

        res.json({ success: true, message: 'You can publish a course now' })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Add New Course
export const addCourse = async (req, res) => {

    try {

        const { courseData } = req.body

        const imageFile = req.file

        const educatorId = req.auth.userId

        if (!imageFile) {
            return res.json({ success: false, message: 'Thumbnail Not Attached' })
        }

        const parsedCourseData = await JSON.parse(courseData)

        parsedCourseData.educator = educatorId

        const newCourse = await Course.create(parsedCourseData)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        newCourse.courseThumbnail = imageUpload.secure_url

        await newCourse.save()

        res.json({ success: true, message: 'Course Added' })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

// Get Educator Courses
export const getEducatorCourses = async (req, res) => {
    try {

        const educator = req.auth.userId

        const courses = await Course.find({ educator })

        res.json({ success: true, courses })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Educator Dashboard Data ( Total Earning, Enrolled Students, No. of Courses)
export const educatorDashboardData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        const courses = await Course.find({ educator });

        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id);

        // Calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        });

        const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0);

        // Collect unique enrolled student IDs with their course titles
        const enrolledStudentsData = [];
        for (const course of courses) {
            const students = await User.find({
                _id: { $in: course.enrolledStudents }
            }, 'name imageUrl');

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                enrolledStudentsData,
                totalCourses
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Get Enrolled Students Data with Purchase Data
export const getEnrolledStudentsData = async (req, res) => {
    try {
        const educator = req.auth.userId;

        // Fetch all courses created by the educator
        const courses = await Course.find({ educator });

        // Get the list of course IDs
        const courseIds = courses.map(course => course._id);

        // Fetch purchases with user and course data
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        // enrolled students data
        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({
            success: true,
            enrolledStudents
        });

    } catch (error) {
        res.json({
            success: false,
            message: error.message
        });
    }
};

// Edit/Update Course (Safe Version)
export const updateCourse = async (req, res) => {
    try {
        const { courseId, courseData } = req.body;
        const imageFile = req.file;
        const educatorId = req.auth.userId;

        const course = await Course.findById(courseId);

        if (!course || course.educator !== educatorId) {
             return res.json({ success: false, message: 'Not Authorized' });
        }

        // 1. Safety Check: Ensure courseData exists before parsing
        if (!courseData) {
            return res.json({ success: false, message: 'Missing Course Data' });
        }

        const parsedCourseData = JSON.parse(courseData);
        
        // 2. Update Fields
        course.courseTitle = parsedCourseData.courseTitle;
        course.coursePrice = parsedCourseData.coursePrice;
        course.discount = parsedCourseData.discount;
        course.courseContent = parsedCourseData.courseContent; 

        // 3. Update Thumbnail ONLY if a new file was uploaded
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path);
            course.courseThumbnail = imageUpload.secure_url;
        }

        await course.save();
        res.json({ success: true, message: 'Course Updated' });

    } catch (error) {
        console.error("Update Error:", error); // Log the error to terminal
        res.json({ success: false, message: error.message });
    }
}


// Delete Course
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const educatorId = req.auth.userId; // From Clerk Middleware

        const course = await Course.findById(id);

        if (!course) {
            return res.json({ success: false, message: "Course not found" });
        }

        // Security Check: Ensure the educator deleting it OWNS it
        if (course.educatorId !== educatorId) {
            return res.json({ success: false, message: "Unauthorized: You do not own this course" });
        }

        await Course.findByIdAndDelete(id);

        res.json({ success: true, message: "Course deleted successfully" });

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};
// ... existing imports

// Get Single Course for Educator (With all URLs)
export const getEducatorCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        
        if (!course) {
            return res.json({ success: false, message: "Course not found" });
        }
        
        res.json({ success: true, courseData: course });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};