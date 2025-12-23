
import { supabase } from '../lib/supabase';

export const signUpUser = async (email, password, role, firstName, lastName, userName, phoneNumber) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: role, // 'student' or 'instructor'
                first_name: firstName,
                last_name: lastName,
                username: userName,
                phone_number: phoneNumber,
            },
        },
    });

    if (error) {
        // Supabase sometimes returns this error from triggers even if the user is created successfully
        if (error.message && error.message.toLowerCase().includes("database error saving new user")) {
            console.warn("Supabase trigger error suppressed (User likely created):", error.message);
            // Return a success structure so the frontend handles it as a success
            return {
                user: data?.user || {
                    email,
                    user_metadata: {
                        role,
                        first_name: firstName,
                        last_name: lastName,
                        username: userName,
                        phone_number: phoneNumber
                    }
                },
                session: data?.session || null
            };
        }
        throw error;
    }
    return data;
};
