import { supabase } from '../lib/supabase';

// Environment variable safety check
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
    console.warn('courseService: EXPO_PUBLIC_SUPABASE_URL is not defined. Network requests will fail.');
}

export const courseService = {
    // Fetch all published courses (Paginated)
    async fetchPublishedCourses(page = 0, pageSize = 10) {
        try {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            // 1. Fetch courses with limited columns for performance
            const { data: courses, error } = await supabase
                .from('courses')
                .select('id, title, image_url, price, categories, instructor:profiles(first_name, last_name)')
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('Error in fetchPublishedCourses:', error.message);
                throw error;
            }

            if (!courses || courses.length === 0) return [];

            // 2. Fetch reviews manually for each course to calculate counts and ratings
            const coursesWithCounts = await Promise.all(courses.map(async (course) => {
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('rating')
                    .eq('course_id', course.id);

                const count = reviewsData?.length || 0;
                let avg = 0.0;
                if (count > 0) {
                    const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0);
                    avg = sum / count;
                }

                return {
                    ...course,
                    avg_rating: avg,
                    reviewCount: count
                };
            }));

            return coursesWithCounts;
        } catch (error) {
            throw error;
        }
    },

    // Fetch course by ID with retry logic
    async fetchCourseById(id, retries = 3) {
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

            } catch (error) {
                if (i === retries - 1) {
                    console.error("Final attempt failed for fetchCourseById:", error);
                    throw error;
                }
            }
        }
    },

    // Fetch ONLY course content (Heavy Load) with retry logic
    async fetchCourseContent(id, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const { data, error } = await supabase
                    .from('courses')
                    .select('course_content')
                    .eq('id', id)
                    .single();

                if (error) {
                    if (error.code === 'PGRST116') throw new Error('Course content not found');
                    console.warn(`Attempt ${i + 1} failed to fetch content: `, error.message);
                    if (i === retries - 1) throw error;
                    await new Promise(res => setTimeout(res, 1000));
                    continue;
                }

                return data?.course_content;
            } catch (error) {
                if (i === retries - 1) {
                    console.error("Final attempt failed for fetchCourseContent:", error);
                    throw error;
                }
            }
        }
    },

    // Fetch courses by instructor ID
    async fetchInstructorCourses(instructorId) {
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
            }));
        } catch (error) {
            if (error.name === 'AuthSessionMissingError' || error.message?.includes('session')) return [];
            console.error('fetchInstructorCourses error:', error);
            throw error;
        }
    },

    // Fetch real-time statistics using Supabase Edge Function + Manual Fallback (Official Logic) - REVENUE REMOVED
    async fetchInstructorStats(instructorId) {
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
                        Authorization: `Bearer ${accessToken} `,
                        'Content-Type': 'application/json'
                    }
                });

                if (!analyticsError && analyticsData) {
                    totalStudents = analyticsData.totalStudents || analyticsData.total_students || 0;
                    avgRating = parseFloat(analyticsData.courseRating || analyticsData.average_rating || 0);
                    totalReviews = parseInt(analyticsData.totalReviews || analyticsData.total_reviews || 0);
                    if (totalStudents > 0 || avgRating > 0) edgeFunctionSuccess = true;
                }
            } catch (edgeError) {
                // Silent fallback
            }

            // STEP 2: Manual Fallback
            if (!edgeFunctionSuccess) {
                const { data: courses } = await supabase
                    .from('courses')
                    .select('id, rating, reviews')
                    .eq('instructor_id', instructorId);

                if (courses && courses.length > 0) {
                    const courseIds = courses.map(c => c.id);

                    const { data: enrollments } = await supabase
                        .from('enrollments')
                        .select('student_id')
                        .in('course_id', courseIds);

                    if (enrollments) {
                        const uniqueStudents = new Set(enrollments.map(e => e.student_id).filter(Boolean));
                        totalStudents = uniqueStudents.size;
                    }

                    let ratingSum = 0;
                    let coursesWithRatings = 0;
                    let reviewsSum = 0;

                    courses.forEach(c => {
                        const r = parseFloat(c.rating) || 0;
                        const rev = parseInt(c.reviews) || 0;
                        if (r > 0) {
                            ratingSum += r;
                            coursesWithRatings++;
                        }
                        reviewsSum += rev;
                    });

                    avgRating = coursesWithRatings > 0 ? (ratingSum / coursesWithRatings) : 0;
                    totalReviews = reviewsSum;
                }
            }

            return {
                totalStudents,
                courseRating: parseFloat(Number(avgRating || 0).toFixed(1)),
                totalReviews
            };

        } catch (error) {
            console.error('fetchInstructorStats error:', error.message);
            return { totalStudents: 0, courseRating: 0, totalReviews: 0 };
        }
    },


    // Upload course thumbnail to Supabase Storage
    async uploadCourseImage(uri) {
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
        } catch (error) {
            console.error('Error in uploadCourseImage:', error.message);
            throw error;
        }
    },

    // Create a new course record in Supabase
    async createCourse(courseData) {
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
                        what_will_i_learn: courseData.whatWillILearn,
                        target_audience: courseData.targetAudience,
                        total_duration: courseData.totalDuration,
                        materials_included: courseData.materialsIncluded,
                        requirements: courseData.requirements,
                        course_content: courseData.course_content, // JSON string or object
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error in createCourse:', error.message);
            throw error;
        }
    }
};
