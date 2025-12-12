import React, { createContext, ReactNode, useContext, useState } from 'react';
import { Course, INITIAL_COURSES } from '../data/courses';

// Review interface matching Course type definition
interface Review {
    id: string;
    user: string;
    avatar: string;
    rating: number;
    date: string;
    message: string;
}

interface CoursesContextType {
    courses: Course[];
    updateCourse: (courseId: string, updates: Partial<Course>) => void;
    addReview: (courseId: string, review: Review) => void;
}

const CoursesContext = createContext<CoursesContextType | undefined>(undefined);

export const CoursesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

    const updateCourse = (courseId: string, updates: Partial<Course>) => {
        setCourses(prevCourses =>
            prevCourses.map(course =>
                course.id === courseId ? { ...course, ...updates } : course
            )
        );
    };

    const addReview = (courseId: string, review: Review) => {
        setCourses(prevCourses =>
            prevCourses.map(course => {
                if (course.id === courseId) {
                    return {
                        ...course,
                        reviews: [...(course.reviews || []), review],
                    };
                }
                return course;
            })
        );
    };

    return (
        <CoursesContext.Provider value={{ courses, updateCourse, addReview }}>
            {children}
        </CoursesContext.Provider>
    );
};

export const useCoursesContext = () => {
    const context = useContext(CoursesContext);
    if (!context) {
        throw new Error('useCoursesContext must be used within CoursesProvider');
    }
    return context;
};
