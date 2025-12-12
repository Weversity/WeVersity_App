export interface Mentor {
    id: string;
    name: string;
    specialty: string;
    avatar: string;
    followers: number;
    rating: number;
    courses: number;
}

// Mock mentors data
export const MENTORS: Mentor[] = [
    {
        id: '1',
        name: 'Jacob',
        specialty: 'UI Designer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop',
        followers: 12500,
        rating: 4.8,
        courses: 12,
    },
    {
        id: '2',
        name: 'Cicie',
        specialty: 'Web Developer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop',
        followers: 8200,
        rating: 4.9,
        courses: 8,
    },
    {
        id: '3',
        name: 'Priscilla',
        specialty: 'UX Researcher',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop',
        followers: 15000,
        rating: 4.7,
        courses: 15,
    },
    {
        id: '4',
        name: 'Wade',
        specialty: 'Full Stack Dev',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
        followers: 10500,
        rating: 4.6,
        courses: 10,
    },
    {
        id: '5',
        name: 'Kathryn',
        specialty: 'Product Designer',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop',
        followers: 9800,
        rating: 4.8,
        courses: 11,
    },
    {
        id: '6',
        name: 'Michael',
        specialty: 'Mobile Dev',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop',
        followers: 7500,
        rating: 4.5,
        courses: 6,
    },
    {
        id: '7',
        name: 'Emma',
        specialty: 'Data Scientist',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop',
        followers: 11200,
        rating: 4.9,
        courses: 9,
    },
    {
        id: '8',
        name: 'Alex',
        specialty: 'DevOps Engineer',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1887&auto=format&fit=crop',
        followers: 6800,
        rating: 4.7,
        courses: 7,
    },
    {
        id: '9',
        name: 'Sophia',
        specialty: 'Graphic Designer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964&auto=format&fit=crop',
        followers: 13500,
        rating: 4.8,
        courses: 14,
    },
    {
        id: '10',
        name: 'James',
        specialty: 'Marketing Expert',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop',
        followers: 9200,
        rating: 4.6,
        courses: 8,
    },
];

// Follow state management (similar to bookmarksStore pattern)
export const followedMentorsStore = new Set<string>();

// Helper functions
export const toggleFollow = (mentorId: string): boolean => {
    if (followedMentorsStore.has(mentorId)) {
        followedMentorsStore.delete(mentorId);
        return false;
    } else {
        followedMentorsStore.add(mentorId);
        return true;
    }
};

export const isFollowing = (mentorId: string): boolean => {
    return followedMentorsStore.has(mentorId);
};

export const getFollowedMentors = (): Mentor[] => {
    return MENTORS.filter(mentor => followedMentorsStore.has(mentor.id));
};
