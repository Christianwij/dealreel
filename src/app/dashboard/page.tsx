'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Upload, FileText, Star } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabaseClient'
import { DashboardShell } from '@/components/dashboard/DashboardShell'

interface DashboardData {
  recentUploads: any[]
  briefings: any[]
  ratings: any[]
  profiles: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData>({
    recentUploads: [],
    briefings: [],
    ratings: [],
    profiles: [],
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    async function fetchDashboardData() {
      try {
        const [uploadsData, briefingsData, ratingsData, profilesData] = await Promise.all([
          supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('briefings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('ratings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('profiles').select('*').eq('id', user.id),
        ])

        setData({
          recentUploads: uploadsData.data || [],
          briefings: briefingsData.data || [],
          ratings: ratingsData.data || [],
          profiles: profilesData.data || [],
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, router, toast])

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex h-[450px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.recentUploads.length}</div>
              <p className="text-xs text-muted-foreground">Recent uploads</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Briefings</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.briefings.length}</div>
              <p className="text-xs text-muted-foreground">Generated briefings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ratings</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.ratings.length}</div>
              <p className="text-xs text-muted-foreground">Deal ratings</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="uploads" className="space-y-4">
          <TabsList>
            <TabsTrigger value="uploads">Recent Uploads</TabsTrigger>
            <TabsTrigger value="briefings">Briefings</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>
          <TabsContent value="uploads" className="space-y-4">
            {data.recentUploads.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No documents uploaded yet</p>
                  <Button className="mt-4" onClick={() => router.push('/dashboard/upload')}>
                    Upload Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data.recentUploads.map((upload) => (
                  <Card key={upload.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-6 w-6" />
                        <div>
                          <p className="text-sm font-medium">{upload.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded on {new Date(upload.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => router.push(`/dashboard/documents/${upload.id}`)}>
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="briefings" className="space-y-4">
            {data.briefings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No briefings generated yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data.briefings.map((briefing) => (
                  <Card key={briefing.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <Upload className="h-6 w-6" />
                        <div>
                          <p className="text-sm font-medium">{briefing.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Generated on {new Date(briefing.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => router.push(`/dashboard/briefings/${briefing.id}`)}>
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="ratings" className="space-y-4">
            {data.ratings.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-6">
                  <Star className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No deal ratings yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {data.ratings.map((rating) => (
                  <Card key={rating.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-4">
                        <Star className="h-6 w-6" />
                        <div>
                          <p className="text-sm font-medium">{rating.deal_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Rated on {new Date(rating.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" onClick={() => router.push(`/dashboard/ratings/${rating.id}`)}>
                        View
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
} 