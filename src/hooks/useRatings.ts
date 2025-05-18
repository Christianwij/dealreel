import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

type Rating = Database['public']['Tables']['ratings']['Row'];

export function useRatings() {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRatings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setRatings([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('ratings')
        .select(`
          *,
          briefings (
            title,
            document_id,
            documents (
              title,
              file_type
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setRatings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch ratings'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRatings();

    // Set up real-time subscription
    const subscription = supabase
      .channel('ratings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'ratings',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchRatings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRatings, user?.id]);

  const addRating = async (rating: Omit<Rating, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('ratings')
        .insert([rating])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add rating'));
      throw err;
    }
  };

  const updateRating = async (id: string, updates: Partial<Rating>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('ratings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update rating'));
      throw err;
    }
  };

  const deleteRating = async (id: string) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('ratings')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete rating'));
      throw err;
    }
  };

  return {
    ratings,
    loading,
    error,
    addRating,
    updateRating,
    deleteRating,
    refetch: fetchRatings,
  };
} 