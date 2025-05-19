import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

type Briefing = Database['public']['Tables']['briefings']['Row'] & {
  document?: Database['public']['Tables']['documents']['Row'];
  metadata: {
    averageRating?: number;
    [key: string]: any;
  };
};

export function useBriefings() {
  const { user } = useAuth();
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBriefings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setBriefings([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('briefings')
        .select(`
          *,
          document:documents (
            id,
            title,
            file_type,
            file_size,
            status,
            metadata
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setBriefings(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch briefings'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBriefings();

    // Set up real-time subscription
    const subscription = supabase
      .channel('briefings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'briefings',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchBriefings();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchBriefings, user?.id]);

  const addBriefing = async (briefing: Omit<Database['public']['Tables']['briefings']['Insert'], 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('briefings')
        .insert([briefing])
        .select(`
          *,
          document:documents (
            id,
            title,
            file_type,
            file_size,
            status,
            metadata
          )
        `)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add briefing'));
      throw err;
    }
  };

  const updateBriefing = async (id: string, updates: Partial<Database['public']['Tables']['briefings']['Update']>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('briefings')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          document:documents (
            id,
            title,
            file_type,
            file_size,
            status,
            metadata
          )
        `)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update briefing'));
      throw err;
    }
  };

  const deleteBriefing = async (id: string) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('briefings')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete briefing'));
      throw err;
    }
  };

  return {
    briefings,
    loading,
    error,
    addBriefing,
    updateBriefing,
    deleteBriefing,
    refetch: fetchBriefings,
  };
} 