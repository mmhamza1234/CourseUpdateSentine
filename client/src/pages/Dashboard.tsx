import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeverityPill from "@/components/SeverityPill";
import ModuleBadge from "@/components/ModuleBadge";
import TaskCard from "@/components/TaskCard";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  Clock, 
  Info, 
  Target, 
  Plus,
  Settings,
  ExternalLink,
  Play,
  RefreshCw,
  Brain,
  Loader2
} from "lucide-react";
import { Link } from "wouter";

interface DashboardStats {
  sev1Count: number;
  sev2Count: number;
  sev3Count: number;
  slaCompliance: number;
  openTasks: number;
  inProgressTasks: number;
  blockedTasks: number;
  doneTasks: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events", { limit: "5" }],
  });

  const { data: pendingImpacts, isLoading: impactsLoading } = useQuery({
    queryKey: ["/api/impacts/pending"],
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/sources"],
  });

  const { toast } = useToast();

  const manualRunMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/monitoring/manual-run");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Manual monitoring completed ✅",
        description: `Processed ${data.processedSources || 0} sources, found ${data.foundChanges || 0} changes from ${data.totalActiveSources || 0} active sources.`,
      });
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/impacts/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
    },
    onError: (error: any) => {
      toast({
        title: "Manual monitoring failed ❌",
        description: error.message || "Failed to start manual monitoring. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (statsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((task: any) => task.status === status) || [];
  };

  const getActiveSourcesCount = () => {
    return sources?.filter((source: any) => source.isActive && source.bridgeToggle).length || 0;
  };

  const getNextSLABreach = () => {
    // Find the task with earliest due date that's not done
    const activeTasks = tasks?.filter((task: any) => task.status !== "DONE") || [];
    const sortedTasks = activeTasks.sort((a: any, b: any) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    if (sortedTasks.length === 0) return null;
    
    const nextTask = sortedTasks[0];
    const dueDate = new Date(nextTask.dueDate);
    const now = new Date();
    const hoursRemaining = Math.max(0, Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
    
    return hoursRemaining;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <p className="text-muted-foreground">Monitor AI tool updates and course impact</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => manualRunMutation.mutate()}
                disabled={manualRunMutation.isPending}
                className="btn-primary"
                data-testid="button-manual-run"
              >
                {manualRunMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {manualRunMutation.isPending ? "Running..." : "Manual Run"}
              </Button>
              
              {manualRunMutation.isPending && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground animate-pulse">
                  <Brain className="w-4 h-4 animate-pulse" />
                  <span>Thinking... Checking sources</span>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: <span data-testid="text-last-update">{new Date().toLocaleString("en-GB", { timeZone: "Africa/Cairo" })}</span>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="orange-border-top">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-3xl font-bold text-destructive" data-testid="stat-sev1-count">
                    {stats?.sev1Count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>
              <div className="mt-4">
                <SeverityPill severity="SEV1" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="orange-border-top">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-500" data-testid="stat-sev2-count">
                    {stats?.sev2Count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <div className="mt-4">
                <SeverityPill severity="SEV2" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="orange-border-top">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Minor Updates</p>
                  <p className="text-3xl font-bold text-gray-400" data-testid="stat-sev3-count">
                    {stats?.sev3Count || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-400/10 rounded-lg flex items-center justify-center">
                  <Info className="w-6 h-6 text-gray-400" />
                </div>
              </div>
              <div className="mt-4">
                <SeverityPill severity="SEV3" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="orange-border-top">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">SLA Compliance</p>
                  <p className="text-3xl font-bold text-brand-success" data-testid="stat-sla-compliance">
                    {stats?.slaCompliance || 0}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-brand-success/10 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-brand-success" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xs text-muted-foreground">
                  Next breach in {getNextSLABreach() || 0}h
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Events */}
        <Card className="orange-border-top">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Events</CardTitle>
              <Link href="/events">
                <Button variant="ghost" size="sm" data-testid="button-view-all-events">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : recentEvents?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No recent events found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Events will appear here when sources are monitored
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentEvents?.slice(0, 3).map((event: any) => (
                  <div 
                    key={event.id} 
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground" data-testid={`text-event-title-${event.id}`}>
                          {event.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{event.vendor?.name}</p>
                      </div>
                      <SeverityPill severity="SEV2" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {event.summary || "No summary available"}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(event.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Impact Assessment */}
        <Card className="orange-border-top">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Impact Assessment</CardTitle>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">Pending:</span>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-xs font-bold">
                  {pendingImpacts?.length || 0}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {impactsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : pendingImpacts?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending impact assessments</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Assessments will appear here when changes are detected
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingImpacts?.slice(0, 2).map((impact: any) => (
                  <div key={impact.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {impact.changeEvent?.title || "Unknown Change"}
                        </h4>
                        <p className="text-sm text-muted-foreground">{impact.predictedAction}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: <span className="text-foreground font-medium">
                          {Math.round(parseFloat(impact.confidence))}%
                        </span>
                      </div>
                    </div>
                    
                    {impact.asset?.module && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground mb-2">Affected Modules:</p>
                        <ModuleBadge moduleCode={impact.asset.module.code} />
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" className="bg-brand-success hover:bg-brand-success/80">
                        Approve
                      </Button>
                      <Button size="sm" variant="destructive">
                        Reject
                      </Button>
                      <Button size="sm" variant="secondary">
                        Modify
                      </Button>
                    </div>
                  </div>
                ))}
                
                {pendingImpacts && pendingImpacts.length > 2 && (
                  <Link href="/impacts">
                    <Button variant="outline" className="w-full" data-testid="button-view-all-impacts">
                      View All Pending ({pendingImpacts.length})
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Management Kanban */}
      <Card className="orange-border-top mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Task Management</CardTitle>
            <div className="flex items-center space-x-4">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  <SelectItem value="HAMADA">Hamada</SelectItem>
                  <SelectItem value="EMAN">Eman</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Link href="/tasks">
                <Button variant="outline" size="sm" data-testid="button-view-all-tasks">
                  View All
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Open Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="font-medium text-foreground">Open</h4>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-500 text-white rounded-full text-xs font-bold">
                  {stats?.openTasks || 0}
                </span>
              </div>
              
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-secondary rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {getTasksByStatus("OPEN").slice(0, 3).map((task: any) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
            
            {/* In Progress Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="font-medium text-foreground">In Progress</h4>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
                  {stats?.inProgressTasks || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                {getTasksByStatus("IN_PROGRESS").slice(0, 3).map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            {/* Blocked Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="font-medium text-foreground">Blocked</h4>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-xs font-bold">
                  {stats?.blockedTasks || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                {getTasksByStatus("BLOCKED").slice(0, 3).map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
            
            {/* Done Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <h4 className="font-medium text-foreground">Done</h4>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-brand-success text-white rounded-full text-xs font-bold">
                  {stats?.doneTasks || 0}
                </span>
              </div>
              
              <div className="space-y-3">
                {getTasksByStatus("DONE").slice(0, 3).map((task: any) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Watchlist Sources */}
        <Card className="orange-border-top">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Watchlist Sources</CardTitle>
              <Link href="/watchlist">
                <Button size="sm" className="btn-primary" data-testid="button-add-source">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Source
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sourcesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : sources?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No sources configured</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add sources to start monitoring AI tool updates
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sources?.slice(0, 4).map((source: any) => (
                  <div key={source.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        source.isActive && source.bridgeToggle ? "bg-brand-success" : "bg-yellow-500"
                      }`} />
                      <div>
                        <p className="font-medium text-foreground text-sm">{source.name}</p>
                        <p className="text-xs text-muted-foreground">{source.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {source.lastChecked ? new Date(source.lastChecked).toLocaleString() : "Never"}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* SLA Status */}
        <Card className="orange-border-top">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>SLA Status</CardTitle>
              <div className="text-sm text-muted-foreground">
                Africa/Cairo: <span data-testid="text-current-time">
                  {new Date().toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo" })}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getNextSLABreach() && getNextSLABreach()! < 8 && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-destructive">SLA Breach Warning</h4>
                    <span className="text-xs text-destructive">{getNextSLABreach()}h remaining</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tasks approaching deadline require attention
                  </p>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">SEV1 Response Time</span>
                  <span className="text-sm font-medium text-brand-success">2.4h avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">SEV2 Response Time</span>
                  <span className="text-sm font-medium text-brand-success">18h avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Tasks Completed On Time</span>
                  <span className="text-sm font-medium text-brand-success">
                    {stats?.slaCompliance || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Active Sources</span>
                  <span className="text-sm font-medium text-brand-info">
                    {getActiveSourcesCount()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
