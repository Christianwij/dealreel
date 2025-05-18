import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfilePreferences = NonNullable<Profile['preferences']>;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (supabaseError) {
        if (supabaseError.code === 'PGRST116') {
          // Profile doesn't exist yet, create it
          const newProfile = {
            user_id: user.id,
            full_name: user.user_metadata?.full_name || '',
            avatar_url: user.user_metadata?.avatar_url || '',
            preferences: {} as ProfilePreferences,
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          setProfile(createdProfile);
          return;
        }
        throw supabaseError;
      }

      setProfile(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();

    // Set up real-time subscription
    const subscription = supabase
      .channel('profile_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'profiles',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile, user?.id]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    try {
      setError(null);

      if (!user) {
        throw new Error('No authenticated user');
      }

      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    }
  };

  const updatePreferences = async (preferences: Partial<ProfilePreferences>) => {
    try {
      if (!profile) {
        throw new Error('No profile loaded');
      }

      const updatedPreferences = {
        ...profile.preferences,
        ...preferences,
      } as ProfilePreferences;

      const result = await updateProfile({ preferences: updatedPreferences });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update preferences'));
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile,
  };
} 