import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { projectId } from '../../utils/supabase/info';
import { 
  Activity, Users, Eye, MousePointerClick, TrendingUp, 
  Clock, Globe, Smartphone, Monitor, Tablet, ExternalLink 
} from 'lucide-react';

interface AnalyticsDashboardProps {
  accessToken: string;
}

export function AnalyticsDashboard({ accessToken }: AnalyticsDashboardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'traffic'>('overview');

  const serverUrl = `https://${projectId}.supabase.co/functions/v1/make-server-fc862019`;

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [summaryRes, sessionsRes] = await Promise.all([
        fetch(`${serverUrl}/analytics/summary`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${serverUrl}/analytics/sessions`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      const summaryData = await summaryRes.json();
      const sessionsData = await sessionsRes.json();

      setSummary(summaryData);
      setSessions(sessionsData.sessions || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-[#1a1f2e]">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Real-time tracking of website visitors and user behavior
          </p>
        </div>
        <Button
          onClick={fetchAnalytics}
          variant="outline"
          className="border-[#1a1f2e] text-[#1a1f2e] hover:bg-[#1a1f2e] hover:text-white rounded-none"
        >
          Refresh Data
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-[#c9b896] text-[#1a1f2e]'
              : 'border-transparent text-gray-500 hover:text-[#1a1f2e]'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-[#c9b896] text-[#1a1f2e]'
              : 'border-transparent text-gray-500 hover:text-[#1a1f2e]'
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => setActiveTab('traffic')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'traffic'
              ? 'border-[#c9b896] text-[#1a1f2e]'
              : 'border-transparent text-gray-500 hover:text-[#1a1f2e]'
          }`}
        >
          Traffic Sources
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <>
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card key="active-now" className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Now</p>
                    <p className="text-3xl text-[#1a1f2e]">{summary.activeNow}</p>
                  </div>
                  <Activity className="w-10 h-10 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Last 30 minutes</p>
              </CardContent>
            </Card>

            <Card key="sessions-24h" className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Sessions (24h)</p>
                    <p className="text-3xl text-[#1a1f2e]">{summary.sessions24h}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {summary.sessions7d} in last 7 days
                </p>
              </CardContent>
            </Card>

            <Card key="page-views" className="border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Page Views</p>
                    <p className="text-3xl text-[#1a1f2e]">{summary.totalPageviews}</p>
                  </div>
                  <Eye className="w-10 h-10 text-purple-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {summary.pageviews24h} in last 24h
                </p>
              </CardContent>
            </Card>

            <Card key="conversion-rate" className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
                    <p className="text-3xl text-[#1a1f2e]">{summary.conversionRate}%</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {summary.formCompletions}/{summary.formStarts} forms completed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Popular Pages & Device Breakdown */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#1a1f2e]">Popular Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {summary.popularPages?.map((page: any, index: number) => (
                    <div
                      key={page.page}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className="bg-[#c9b896] text-white">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm text-[#1a1f2e]">{page.page}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">
                        {page.views} views
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md">
              <CardHeader>
                <CardTitle className="text-lg text-[#1a1f2e]">Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { 
                      type: 'Desktop', 
                      count: summary.deviceBreakdown?.desktop || 0, 
                      icon: Monitor,
                      color: 'text-blue-600'
                    },
                    { 
                      type: 'Mobile', 
                      count: summary.deviceBreakdown?.mobile || 0, 
                      icon: Smartphone,
                      color: 'text-green-600'
                    },
                    { 
                      type: 'Tablet', 
                      count: summary.deviceBreakdown?.tablet || 0, 
                      icon: Tablet,
                      color: 'text-purple-600'
                    }
                  ].map((device) => {
                    const total = (summary.deviceBreakdown?.desktop || 0) + 
                                  (summary.deviceBreakdown?.mobile || 0) + 
                                  (summary.deviceBreakdown?.tablet || 0);
                    const percentage = total > 0 ? ((device.count / total) * 100).toFixed(1) : '0';
                    const Icon = device.icon;

                    return (
                      <div key={device.type}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${device.color}`} />
                            <span className="text-sm text-[#1a1f2e]">{device.type}</span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {device.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              device.type === 'Desktop' ? 'bg-blue-600' :
                              device.type === 'Mobile' ? 'bg-green-600' :
                              'bg-purple-600'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a1f2e]">
              Recent Sessions ({sessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.slice(0, 20).map((session) => (
                <div
                  key={session.sessionId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-[#c9b896] transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={
                          new Date(session.lastActivity).getTime() > Date.now() - 30 * 60 * 1000
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }>
                          {new Date(session.lastActivity).getTime() > Date.now() - 30 * 60 * 1000
                            ? 'Active'
                            : 'Ended'}
                        </Badge>
                        {session.userId && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Authenticated User
                          </Badge>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Started:</span>{' '}
                          <span className="text-[#1a1f2e]">
                            {formatTimestamp(session.startTime)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>{' '}
                          <span className="text-[#1a1f2e]">
                            {formatDuration(session.startTime, session.lastActivity)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Pages:</span>{' '}
                          <span className="text-[#1a1f2e]">{session.pageCount || session.pages?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Device:</span>{' '}
                          <span className="text-[#1a1f2e] capitalize">{session.deviceType}</span>
                        </div>
                      </div>

                      {session.referrer && session.referrer !== 'direct' && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                          <ExternalLink className="w-3 h-3" />
                          <span>Referred from: {session.referrer}</span>
                        </div>
                      )}

                      {(session.utmSource || session.utmCampaign) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {session.utmSource && (
                            <Badge variant="outline" className="text-xs">
                              Source: {session.utmSource}
                            </Badge>
                          )}
                          {session.utmMedium && (
                            <Badge variant="outline" className="text-xs">
                              Medium: {session.utmMedium}
                            </Badge>
                          )}
                          {session.utmCampaign && (
                            <Badge variant="outline" className="text-xs">
                              Campaign: {session.utmCampaign}
                            </Badge>
                          )}
                        </div>
                      )}

                      {session.pages && session.pages.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 rounded">
                          <p className="text-xs text-gray-600 mb-2">Pages Visited:</p>
                          <div className="flex flex-wrap gap-1">
                            {session.pages.map((page: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-white rounded border text-gray-700"
                              >
                                {page}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traffic Sources Tab */}
      {activeTab === 'traffic' && summary && (
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-[#1a1f2e]">Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.trafficSources?.map((source: any, index: number) => {
                const percentage = ((source.count / summary.totalSessions) * 100).toFixed(1);
                
                return (
                  <div
                    key={source.source}
                    className="p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-[#c9b896]" />
                        <span className="text-[#1a1f2e]">{source.source}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {source.count} sessions ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-[#c9b896]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}