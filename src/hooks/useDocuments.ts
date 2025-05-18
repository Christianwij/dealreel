import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';

type Document = Database['public']['Tables']['documents']['Row'];

export function useDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setDocuments([]);
        return;
      }

      const { data, error: supabaseError } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setDocuments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch documents'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDocuments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('documents_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'documents',
          filter: `user_id=eq.${user?.id}` 
        }, 
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDocuments, user?.id]);

  const addDocument = async (document: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .insert([document])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add document'));
      throw err;
    }
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update document'));
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      setError(null);
      const { error: supabaseError } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete document'));
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
} 