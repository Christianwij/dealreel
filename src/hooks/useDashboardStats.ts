import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalDocuments: number;
  totalBriefings: number;
  totalRatings: number;
  averageRating: number | null;
  recentActivity: {
    documents: number;
    briefings: number;
    ratings: number;
  };
}

export function useDashboardStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalBriefings: 0,
    totalRatings: 0,
    averageRating: null,
    recentActivity: {
      documents: 0,
      briefings: 0,
      ratings: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setStats({
          totalDocuments: 0,
          totalBriefings: 0,
          totalRatings: 0,
          averageRating: null,
          recentActivity: {
            documents: 0,
            briefings: 0,
            ratings: 0,
          },
        });
        return;
      }

      // Get total counts
      const [
        { count: documentsCount },
        { count: briefingsCount },
        { count: ratingsCount },
        { data: ratingsData },
      ] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('briefings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ratings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ratings')
          .select('score')
          .eq('user_id', user.id),
      ]);

      // Calculate average rating
      const averageRating = ratingsData?.length
        ? ratingsData.reduce((acc, curr) => acc + curr.score, 0) / ratingsData.length
        : null;

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString();

      const [
        { count: recentDocuments },
        { count: recentBriefings },
        { count: recentRatings },
      ] = await Promise.all([
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgoStr),
        supabase
          .from('briefings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgoStr),
        supabase
          .from('ratings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', sevenDaysAgoStr),
      ]);

      setStats({
        totalDocuments: documentsCount || 0,
        totalBriefings: briefingsCount || 0,
        totalRatings: ratingsCount || 0,
        averageRating,
        recentActivity: {
          documents: recentDocuments || 0,
          briefings: recentBriefings || 0,
          ratings: recentRatings || 0,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions for all relevant tables
    const subscriptions = ['documents', 'briefings', 'ratings'].map(table =>
      supabase
        .channel(`${table}_changes`)
        .on('postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `user_id=eq.${user?.id}`
          },
          () => {
            fetchStats();
          }
        )
        .subscribe()
    );

    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, [fetchStats, user?.id]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
} 