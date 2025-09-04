
"use client";

import { supabase } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin-client';
import type { UserProfile, UserProfileFormValues } from '@/core/domain/types';

// --- Authentication Functions ---

export const signUp = async ({ name, email, role, password, dni }: UserProfileFormValues) => {
    if (!password) {
        throw new Error("Password is required for sign up.");
    }
    
    // The database's Row Level Security (RLS) policy is now the single source of truth.
    // We no longer need to check the settings table from the client-side.
    
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
                dni: role === 'Docente' || role === 'Auxiliar' ? dni : undefined,
            },
        },
    });

    if (error) {
        console.error("Sign up error:", error.message);
        throw new Error(error.message);
    }
    
    // The trigger will handle inserting into the profiles table.
    return data.user;
};

// Function to create users without affecting current session (for bulk imports)
export const signUpWithoutLogin = async ({ name, email, role, password, dni }: UserProfileFormValues) => {
    console.log(`🔐 signUpWithoutLogin called for: ${email}`);
    
    if (!password) {
        throw new Error("Password is required for sign up.");
    }
    
    // Store current session to restore it later
    const { data: sessionData } = await supabase.auth.getSession();
    const currentSession = sessionData.session;
    const currentUser = currentSession?.user;
    
    console.log(`📋 Current session exists: ${!!currentSession}`);
    console.log(`📋 Current user: ${currentUser?.email || 'none'}`);
    
    try {
        const userData = {
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    name: name.trim(),
                    role,
                    dni: role === 'Docente' || role === 'Auxiliar' ? dni?.trim() : undefined,
                },
            },
        };
        
        console.log(`📤 Calling supabase.auth.signUp with:`, { 
            email: userData.email, 
            role: userData.options.data.role,
            dni: userData.options.data.dni 
        });
        
        // Create user with timeout
        const signUpPromise = supabase.auth.signUp(userData);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignUp timeout after 15 seconds')), 15000)
        );
        
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

        if (error) {
            console.error("❌ Sign up error for", email, ":", error.message);
            // Provide more specific error messages
            if (error.message.includes('already registered') || error.message.includes('duplicate')) {
                throw new Error(`User with email ${email} is already registered`);
            }
            throw new Error(error.message);
        }
        
        console.log(`✅ User created successfully: ${email}`, data.user?.id);
        
        // Immediately restore the original session to avoid session conflicts
        if (currentSession) {
            console.log(`🔄 Restoring original session for: ${currentUser?.email}`);
            try {
                const { error: restoreError } = await supabase.auth.setSession(currentSession);
                if (restoreError) {
                    console.error("❌ Error restoring original session:", restoreError);
                    // If restore fails, sign out completely
                    await supabase.auth.signOut();
                } else {
                    console.log(`✅ Successfully restored original session`);
                }
            } catch (restoreError) {
                console.error("❌ Error restoring session:", restoreError);
                await supabase.auth.signOut();
            }
        } else {
            // If there was no original session, sign out the new user
            console.log(`🚪 No original session, signing out new user...`);
            try {
                await supabase.auth.signOut();
                console.log(`✅ Successfully signed out new user`);
            } catch (signOutError) {
                console.error("❌ Error signing out new user:", signOutError);
            }
        }
        
        return data.user;
    } catch (error) {
        console.error(`❌ Error in signUpWithoutLogin for ${email}:`, error);
        
        // Try to restore original session in case of error
        if (currentSession) {
            try {
                console.log(`🔄 Attempting to restore original session after error...`);
                const { error: restoreError } = await supabase.auth.setSession(currentSession);
                if (restoreError) {
                    console.error("❌ Error restoring session after error:", restoreError);
                } else {
                    console.log(`✅ Successfully restored original session after error`);
                }
            } catch (restoreError) {
                console.error("❌ Error restoring session:", restoreError);
            }
        }
        
        throw error;
    }
};

export const signIn = async (email: string, password?: string) => {
    if (!password) {
        throw new Error("Password is required for sign in.");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (error) {
        console.error("Sign in error:", error.message);
        throw new Error(error.message);
    }
    return data.session;
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Sign out error:", error.message);
        throw new Error(error.message);
    }
};

export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
};

export const getSession = async () => {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        return session;
    } catch (error) {
        console.error("Error getting session, user might be logged out:", error);
        return null;
    }
};


// --- Profile Management Functions ---

export const getProfiles = async (): Promise<UserProfile[]> => {
    // Use supabaseAdmin if available (server), otherwise use regular supabase
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
        .from('profiles')
        .select('id, name, email, role, dni');

    if (error) {
        console.error('Error fetching profiles:', error);
        return [];
    }
    return data;
};

export const editProfile = async (profileId: string, profileData: UserProfileFormValues): Promise<UserProfile | null> => {
    console.log('🔄 Starting editProfile with:', { profileId, profileData });
    
    try {
        // Use supabaseAdmin if available (server), otherwise use regular supabase
        const client = supabaseAdmin || supabase;
        console.log('🔧 Using client:', client === supabaseAdmin ? 'supabaseAdmin' : 'supabase');
        
        // First, check if the profile exists
        console.log('🔍 Checking if profile exists...');
        const { data: existingProfile, error: fetchError } = await client
            .from('profiles')
            .select('*')
            .eq('id', profileId)
            .single();
            
        if (fetchError) {
            console.error('❌ Error fetching existing profile:', fetchError);
            return null;
        }
        
        if (!existingProfile) {
            console.error('❌ Profile not found with ID:', profileId);
            return null;
        }
        
        console.log('✅ Profile exists:', existingProfile);
        
        const updateData = {
            name: profileData.name,
            email: profileData.email.toLowerCase(),
            role: profileData.role,
            dni: profileData.dni,
        };
        
        console.log('📤 Updating profile with data:', updateData);
        
        const { data, error } = await client
            .from('profiles')
            .update(updateData)
            .eq('id', profileId)
            .select();
            
        if (error) {
            console.error('❌ Supabase error editing profile:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code,
                profileData: updateData,
                profileId
            });
            return null;
        }
        
        if (!data || data.length === 0) {
            console.log('⚠️ No rows were updated - data might be identical');
            // Return the existing profile data since no changes were made
            return existingProfile;
        }
        
        console.log('✅ Profile updated successfully:', data[0]);
        return data[0];
    } catch (error) {
        console.error('💥 Unexpected error in editProfile:', error);
        return null;
    }
};

// Note: Deleting a user from auth cascade deletes their profile due to the foreign key constraint.
// This function is for deleting a user from the auth schema itself.
export const deleteProfile = async (userId: string): Promise<boolean> => {
    try {
        // Use API route for secure user deletion
        const response = await fetch('/api/admin/delete-user', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error deleting user:', errorData.error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
};

// Bulk import users using admin API (no session interruption)
export const bulkImportUsers = async (users: Omit<UserProfile, 'id'>[]): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
} | null> => {
    try {
        console.log(`🔄 Starting bulk import of ${users.length} users via admin API`);
        
        const response = await fetch('/api/admin/bulk-import-users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ users }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Bulk import API error:', errorData.error);
            throw new Error(errorData.error || 'Bulk import failed');
        }

        const result = await response.json();
        console.log(`✅ Bulk import completed:`, result.results);
        
        return result.results;
    } catch (error) {
        console.error('Error in bulk import:', error);
        throw error;
    }
};

// Alternative signup method that doesn't hang
export const signUpAlternative = async ({ name, email, role, password, dni }: UserProfileFormValues) => {
    console.log(`🔐 signUpAlternative called for: ${email}`);
    
    if (!password) {
        throw new Error("Password is required for sign up.");
    }
    
    try {
        // Use a different approach - create user with a very short timeout
        const userData = {
            email: email.toLowerCase().trim(),
            password,
            options: {
                data: {
                    name: name.trim(),
                    role,
                    dni: role === 'Docente' || role === 'Auxiliar' ? dni?.trim() : undefined,
                },
            },
        };
        
        console.log(`📤 Calling supabase.auth.signUp with 5 second timeout...`);
        
        // Create user with very short timeout
        const signUpPromise = supabase.auth.signUp(userData);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SignUp timeout after 5 seconds')), 5000)
        );
        
        const { data, error } = await Promise.race([signUpPromise, timeoutPromise]) as any;

        if (error) {
            if (error.message.includes('already registered') || 
                error.message.includes('duplicate') ||
                error.message.includes('already exists')) {
                console.log(`⏭️ User ${email} already exists, treating as success`);
                // Return a mock user object to indicate "success" (user already exists)
                return { id: 'existing-user', email: email };
            }
            console.error("❌ Sign up error for", email, ":", error.message);
            throw new Error(error.message);
        }
        
        console.log(`✅ User created successfully: ${email}`, data.user?.id);
        
        // Immediately sign out to avoid session conflicts
        try {
            await supabase.auth.signOut();
            console.log(`✅ Successfully signed out new user`);
        } catch (signOutError) {
            console.error("❌ Error signing out new user:", signOutError);
        }
        
        return data.user;
    } catch (error) {
        console.error(`❌ Error in signUpAlternative for ${email}:`, error);
        throw error;
    }
};
