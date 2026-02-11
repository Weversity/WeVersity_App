/**
 * Centralized TypeScript interfaces for the WeVerstiy App.
 */

export type LessonType = 'video' | 'quiz' | 'article';

export interface Lesson {
    id: string | number;
    title: string;
    type: LessonType;
    duration?: string;
    content?: string;
    image?: string;
    questions?: any[];
    video_url?: string;
    video_link?: string;
    lessons?: Lesson[];
    items?: Lesson[]; // Added items as optional for flexibility
    isCompleted?: boolean;
    is_free?: boolean;
    [key: string]: any;
}

export interface Section {
    title: string;
    data: Lesson[];
    isExpanded?: boolean;
}

export interface UserProfile {
    id?: string;
    name: string;
    avatar?: string;
    initials: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
}

export interface Review {
    id: any;
    rating: number;
    content: string;
    created_at: string;
    user: UserProfile;
}

export interface Instructor {
    id?: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
}

export interface Course {
    id: any;
    title: string;
    categories: string;
    is_free: boolean;
    image?: string;
    image_url?: string;
    thumbnail?: string;
    price: string | number;
    description: string;
    sections?: Section[];
    instructor: any; // Can be string, object, or array depending on query
    instructorAvatar?: string;
    instructorInitials?: string;
    rating: number;
    reviews: Review[];
    reviewCount: number;
    students: number;
    lessonCount: number;
    duration: string;
    tools?: any[];
    course_content?: any;
    what_you_will_learn?: string[] | null;
    avg_rating?: number;
    course_name?: string; // Legacy fallback
    is_published?: boolean;
    status?: string;
}

export interface Conversation {
    id: string;
    name: string;
    message: string;
    time: string;
    unread: number;
    avatar?: string;
    avatarColor?: string;
    isGroup: boolean;
    timestamp: number;
    system: boolean;
    online?: boolean;
    isRead?: boolean;
}

export interface InstructorStats {
    totalStudents: number;
    courseRating: number;
    totalReviews: number;
}
