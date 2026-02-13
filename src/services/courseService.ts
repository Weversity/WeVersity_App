import { supabase } from '../lib/supabase';
import { Course, InstructorStats } from '../types';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('courseService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}

export const courseService = {
    // Fetch all published courses (Paginated) with optional type filtering, search, category, and rating
    /**
     * @param {number} page
     * @param {number} pageSize
     * @param {string|null} type
     * @param {string} search
     * @param {string} category
     * @param {number|null} rating
     */
    async fetchPublishedCourses(page: number = 0, pageSize: number = 10, type: string | null = null, search: string = '', category: string = 'All', rating: number | null = null): Promise<Course[]> {
        try {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            // 1. Fetch courses with limited columns for performance
            let query = supabase
                .from('courses')
                .select('id, title, image_url, price, categories, type, rating, instructor:profiles(first_name, last_name)')
                .eq('is_published', true);

            // Apply type filtering if provided ('Skill' or 'Technical')
            if (type) {
                query = query.eq('type', type);
            }

            // Apply search filtering if provided
            if (search && search.trim() !== '') {
                query = query.ilike('title', `%${search}%`);
            }

            // Apply category filtering if provided
            if (category && category !== 'All') {
                let searchTerm = category;

                // Smart Mapping: Map display names to broader keywords
                if (category === 'AI Mastery') searchTerm = 'AI';
                else if (category === 'Graphic Design') searchTerm = 'Graphic,Design';
                else if (category === 'Handmade Crafts') searchTerm = 'Craft,Handmade,Making';
                else if (category === 'YouTube & Marketing') searchTerm = 'YouTube,Marketing';
                else if (category === 'Shopify & E-Commerce') searchTerm = 'Shopify,E-Commerce,Ecommerce';
                else if (category === 'Video Editing') searchTerm = 'Video,Editing';

                // Construct OR filter for Title OR Categories
                // Example: .or('title.ilike.%AI%,categories.ilike.%AI%')
                const keywords = searchTerm.split(',');
                const conditions = keywords.map(k => `title.ilike.%${k.trim()}%,categories.ilike.%${k.trim()}%`).join(',');

                query = query.or(conditions);
            }

            // Apply rating filtering if provided
            if (rating !== null) {
                // Assuming 'rating' column exists as discussed
                query = query.gte('rating', rating);
            }

            const { data: courses, error } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error in fetchPublishedCourses:', error.message);
                throw error;
            }

            // Re-enabling data dump log (assuming 'courses' is the relevant data here)
            console.log("[Full Data Dump - fetchPublishedCourses]", JSON.stringify(courses, null, 2));


            if (!courses || courses.length === 0) return [];

            // 2. Fetch reviews manually for each course to calculate counts and ratings
            const coursesWithCounts = await Promise.all(courses.map(async (course) => {
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('course_id', course.id);

                const count = reviewsData?.length || 0;
                let avg = 0.0;
                if (reviewsData && count > 0) {
                    const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
                    avg = sum / count;
                }

                return {
                    ...course,
                    avg_rating: avg,
                    reviewCount: count
                };
            }));

            return coursesWithCounts as any[];
        } catch (error: any) {
            throw error;
        }
    },

    // Fetch course by ID with retry logic
    async fetchCourseById(id: string, retries: number = 3): Promise<Course | any> {
        for (let i = 0; i < retries; i++) {
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        title,
                        description,
                        image_url,
                        what_you_will_learn,
                        instructor:profiles(first_name, last_name, avatar_url)
                    `)
                    .eq('id', id)
                    .single();

                if (error) {
                    // Handle PGRST002: Could not query the database for the schema cache
                    if (error.code === 'PGRST002') {
                        console.error(`Error in fetchCourseById(Attempt ${i + 1}/${retries}): Database schema cache error(PGRST002). This often requires a PostgREST schema reload.`);
                        if (i === retries - 1) {
                            throw new Error('Database schema cache error. Please contact support or try reloading the schema.');
                        }
                    } else if (error.code === 'PGRST116') { // "Fetched result contains 0 rows"
                        throw new Error('Course not found');
                    } else {
                        console.error(`Error in fetchCourseById(Attempt ${i + 1}/${retries}): `, error.message);
                    }

                    if (i === retries - 1) throw error; // Throw last error
                    await new Promise(res => setTimeout(res, 1000)); // Wait 1s before retrying
                    continue;
                }

                return data;

            } catch (error: any) {
                if (i === retries - 1) {
                    console.error("Final attempt failed for fetchCourseById:", error);
                    throw error;
                }
            }
        }
    },

    // Fetch ONLY course content (Heavy Load) with retry logic
    async fetchCourseContent(id: string, retries: number = 3): Promise<any> {
        // LEGACY: Keeping for backward compatibility but redirecting to fetchFullCurriculum if appropriate
        return this.fetchFullCurriculum(id, retries);
    },

    /**
     * Fetch the full curriculum using relational tables.
     * 1. Get curriculum_topics (Sections)
     * 2. Get curriculum_items (Lessons/Quizzes) for those topics
     */
    async fetchFullCurriculum(courseId: string, retries: number = 3): Promise<any> {
        for (let i = 0; i < retries; i++) {
            try {
                // 1. Fetch Topics (Sections)
                const { data: topics, error: topicsError } = await supabase
                    .from('curriculum_topics')
                    .select('id, title, order')
                    .eq('course_id', courseId)
                    .order('order', { ascending: true });

                if (topicsError) throw topicsError;
                if (!topics || topics.length === 0) return [];

                // 2. Fetch Items (Lessons) for all these topics
                const topicIds = topics.map(t => t.id);
                const { data: items, error: itemsError } = await supabase
                    .from('curriculum_items')
                    .select('id, topic_id, title, type, content, video_url, meta_data')
                    .in('topic_id', topicIds);

                if (itemsError) throw itemsError;

                // 3. Map Items to their respective Topics
                const topicMap = topics.map(topic => {
                    const topicItems = (items || [])
                        .filter(item => item.topic_id === topic.id)
                        .map(item => ({
                            id: item.id,
                            title: item.title,
                            type: item.type === 'video' ? 'video' : (item.type === 'quiz' ? 'quiz' : 'article'),
                            content: item.content,
                            video_url: item.video_url,
                            meta_data: item.meta_data,
                            is_free: false // Default, can be adjusted if schema supports it
                        }));

                    return {
                        title: topic.title,
                        data: topicItems
                    };
                });

                return topicMap;

            } catch (error: any) {
                console.error(`Attempt ${i + 1} failed for fetchFullCurriculum:`, error.message);
                if (i === retries - 1) throw error;
                await new Promise(res => setTimeout(res, 1000));
            }
        }
    },

    // Fetch courses by instructor ID
    async fetchInstructorCourses(instructorId: string): Promise<Course[]> {
        try {
            if (!instructorId) return [];

            // Session check to prevent AuthSessionMissingError during logout
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return [];

            const { data, error } = await supabase
                .from('courses')
                .select(`
        id,
            title,
            image_url,
            categories,
            is_published,
            status,
            price
                `)
                .eq('instructor_id', instructorId)
                .order('created_at', { ascending: false });

            if (error) {
                if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) return [];
                console.error('Error in fetchInstructorCourses:', error.message);
                throw error;
            }

            return (data || []).map(course => ({
                ...course,
                // Handle both status string and is_published boolean
                status: course.status || (course.is_published ? 'PUBLISHED' : 'DRAFT')
            })) as any[];
        } catch (error: any) {
            if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) return [];
            console.error('fetchInstructorCourses error:', error);
            throw error;
        }
    },

    // Fetch real-time statistics using Supabase Edge Function + Manual Fallback (Official Logic) - REVENUE REMOVED
    async fetchInstructorStats(instructorId: string): Promise<InstructorStats> {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return { totalStudents: 0, courseRating: 0, totalReviews: 0 };

            const accessToken = session.access_token;
            let totalStudents = 0;
            let avgRating = 0;
            let totalReviews = 0;
            let edgeFunctionSuccess = false;

            // STEP 1: Try Invoke Edge Function
            try {
                const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('get-instructor-analytics', {
                    body: { instructor_id: instructorId },
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!analyticsError && analyticsData) {
                    // Normalize data structure
                    totalStudents = analyticsData.totalStudents || analyticsData.total_students || 0;

                    // Handle rating which might be string or number
                    const rawRating = analyticsData.courseRating || analyticsData.average_rating || 0;
                    avgRating = parseFloat(String(rawRating));

                    totalReviews = parseInt(String(analyticsData.totalReviews || analyticsData.total_reviews || 0));

                    if (totalStudents > 0 || avgRating > 0) edgeFunctionSuccess = true;
                }
            } catch (edgeError) {
                // Silent fallback
            }

            // STEP 2: Manual Fallback (If Edge Function fails or returns empty)
            if (!edgeFunctionSuccess) {
                // A. Calculate Total Enrollments (Not Unique Students)
                // Use a direct join query to find all enrollments for courses by this instructor
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select(`
                        student_id,
                        courses!inner (
                            instructor_id
                        )
                    `)
                    .eq('courses.instructor_id', instructorId);

                if (enrollmentData) {
                    // CHANGED: Count total enrollments instead of unique students
                    totalStudents = enrollmentData.length;
                }

                // B. Calculate Ratings & Reviews
                const { data: courses } = await supabase
                    .from('courses')
                    .select(`
                        id,
                        reviews (rating)
                    `)
                    .eq('instructor_id', instructorId);

                if (courses && courses.length > 0) {
                    let totalRatingSum = 0;
                    let totalRatingCount = 0;

                    courses.forEach((c: any) => {
                        if (c.reviews && Array.isArray(c.reviews)) {
                            c.reviews.forEach((r: any) => {
                                if (r.rating) {
                                    totalRatingSum += r.rating;
                                    totalRatingCount++;
                                }
                            });
                        }
                    });

                    avgRating = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 0;
                    totalReviews = totalRatingCount;
                }
            }

            return {
                totalStudents,
                courseRating: parseFloat(avgRating.toFixed(1)),
                totalReviews
            };

        } catch (error: any) {
            console.error('fetchInstructorStats error:', error.message);
            return { totalStudents: 0, courseRating: 0, totalReviews: 0 };
        }
    },


    // Upload course thumbnail to Supabase Storage
    async uploadCourseImage(uri: string): Promise<string | null> {
        try {
            if (!uri) return null;

            // 1. Get filename and extension
            const fileExt = uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `thumbnails / ${fileName} `;


            // 2. Convert URI to Blob for React Native
            const response = await fetch(uri);
            const blob = await response.blob();

            // 3. Upload to 'course-images' bucket
            const { data, error } = await supabase.storage
                .from('course-images')
                .upload(filePath, blob, {
                    contentType: `image / ${fileExt} `,
                    upsert: true
                });

            if (error) throw error;

            // 4. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Error in uploadCourseImage:', error.message);
            throw error;
        }
    },

    // Create a new course record in Supabase
    async createCourse(courseData: Partial<Course> & { instructor_id: string }): Promise<any> {
        try {
            const { data, error } = await supabase
                .from('courses')
                .insert([
                    {
                        title: courseData.title,
                        description: courseData.description,
                        price: courseData.price,
                        categories: courseData.categories,
                        image_url: courseData.image_url,
                        instructor_id: courseData.instructor_id,
                        is_published: true, // Defaulting to published
                        what_will_i_learn: (courseData as any).whatWillILearn,
                        target_audience: (courseData as any).targetAudience,
                        total_duration: (courseData as any).totalDuration,
                        materials_included: (courseData as any).materialsIncluded,
                        requirements: (courseData as any).requirements,
                        course_content: courseData.course_content, // JSON string or object
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            console.error('Error in createCourse:', error.message);
            throw error;
        }
    }
};
