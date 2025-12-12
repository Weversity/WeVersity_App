export interface Course {
    id: string;
    title: string;
    category: string;
    subCategory: string;
    rating: number;
    image: string;
    instructor: string;
    instructorAvatar?: string;
    description?: string;
    progress?: string;
    isFree?: boolean;
    duration?: string;
    students?: string;
    tools?: { name: string; icon: string }[];
    lessons?: { id: string; title: string; duration: string; isLocked: boolean }[];
    reviews?: { id: string; user: string; avatar: string; rating: number; date: string; message: string }[];
}

export const CATEGORIES = [
    'All',
    'Skills Courses',
    'Technical Courses',
    'Learn HTML',
    'E-Commerce',
    'Web Design',
    'UI/UX Design',
    'Programming'
];

export const INITIAL_COURSES: Course[] = [
    {
        id: '1',
        title: '3D Design Illustration',
        category: 'Skills Courses',
        subCategory: 'Web Design',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=1974&auto=format&fit=crop',
        isFree: true,
        instructor: 'Teacher Sarah',
        instructorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
        duration: '2h 15m',
        students: '4,850',
        progress: '80%',
        tools: [
            { name: 'Blender', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-blender-1-226553.png' }, // Placeholder
            { name: 'Figma', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-figma-3521426-2944860.png' }
        ],
        lessons: [
            { id: '1', title: 'Why Using Blender', duration: '15 mins', isLocked: false },
            { id: '2', title: 'Set Up Your Blender Account', duration: '5 mins', isLocked: false },
            { id: '3', title: 'Take a Look Blender Interface', duration: '13 mins', isLocked: true },
            { id: '4', title: 'Working with Frames & Layer', duration: '10 mins', isLocked: true },
        ],
        reviews: [
            { id: 'r1', user: 'Marielle Wigington', avatar: 'https://randomuser.me/api/portraits/women/1.jpg', rating: 4.5, date: '1 week ago', message: 'The course is very good, the explanation of the mentor is very clear and easy to understand!' },
            { id: 'r2', user: 'Tanner Stafford', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', rating: 4.0, date: '2 weeks ago', message: 'Extraordinary! I just finished it and it really helped thanks a lot!' }
        ]
    },
    {
        id: '2',
        title: 'Digital Entrepreneurship',
        category: 'Skills Courses',
        subCategory: 'E-Commerce',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop',
        isFree: true,
        instructor: 'Dev Expert',
        instructorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1887&auto=format&fit=crop',
        description: 'Learn how to start your own digital business from scratch. This course covers everything from idea generation to execution.',
        duration: '6h 30m',
        students: '12,500',
        progress: '50%',
        tools: [],
        lessons: [
            { id: '1', title: 'Introduction to Entrepreneurship', duration: '20 mins', isLocked: false },
            { id: '2', title: 'Finding a Niche', duration: '25 mins', isLocked: true },
        ],
        reviews: []
    },
    {
        id: '3',
        title: 'Learn UX User Persona',
        category: 'Technical Courses',
        subCategory: 'UI/UX Design',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d48?q=80&w=2670&auto=format&fit=crop',
        isFree: true,
        instructor: 'Dr. Code',
        instructorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
        description: 'Understand your users better by creating detailed user personas. A must-have skill for any UI/UX designer.',
        duration: '4h 10m',
        students: '8,200',
        progress: '20%',
        tools: [
            { name: 'Figma', icon: 'https://cdn.iconscout.com/icon/free/png-256/free-figma-3521426-2944860.png' }
        ],
        lessons: [],
        reviews: []
    },
    {
        id: '4',
        title: 'Flutter Mobile Apps',
        category: 'Technical Courses',
        subCategory: 'Programming',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1617042375876-a13e36732a04?q=80&w=2670&auto=format&fit=crop',
        isFree: true,
        instructor: 'Coach Lily',
        instructorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop',
        description: 'Build beautiful, natively compiled applications for mobile, web, and desktop from a single codebase.',
        duration: '12h 45m',
        students: '5,600',
        progress: '0%',
        tools: [],
        lessons: [],
        reviews: []
    },
    {
        id: '5',
        title: 'Advanced HTML5',
        category: 'Technical Courses',
        subCategory: 'Learn HTML',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?q=80&w=2664&auto=format&fit=crop',
        isFree: true,
        instructor: 'Mr. Frontend',
        instructorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop',
        description: 'Deep dive into HTML5 semantics, accessibility, and modern web standards.',
        duration: '5h',
        students: '2,100',
        progress: '90%',
        tools: [],
        lessons: [],
        reviews: []
    },
    {
        id: '6',
        title: 'E-Commerce Strategies',
        category: 'Skills Courses',
        subCategory: 'E-Commerce',
        rating: 4.2,
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2670&auto=format&fit=crop',
        isFree: true,
        instructor: 'Author Jane',
        instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop',
        description: 'Master the art of selling online with proven strategies and marketing techniques.',
        duration: '3h 20m',
        students: '3,300',
        progress: '60%',
        tools: [],
        lessons: [],
        reviews: []
    }
];

export const bookmarksStore = new Set<string>();
