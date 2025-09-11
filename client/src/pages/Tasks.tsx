import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskCard from "@/components/TaskCard";
import { KanbanBoard, KanbanColumn } from "@/components/KanbanBoard";
import { BarChart3, Calendar, User, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export default function Tasks() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: any }) => {
      return apiRequest("PUT", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Task Updated",
        description: "The task status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({
      taskId,
      updates: { status: newStatus }
    });
  };

  const filteredTasks = tasks?.filter((task: any) => {
    const matchesOwner = ownerFilter === "all" || task.owner === ownerFilter;
    const matchesModule = moduleFilter === "all" || task.impact?.asset?.module?.code === moduleFilter;
    const matchesSeverity = severityFilter === "all" || task.impact?.severity === severityFilter;
    
    return matchesOwner && matchesModule && matchesSeverity;
  });

  const getTasksByStatus = (status: string) => {
    return filteredTasks?.filter((task: any) => task.status === status) || [];
  };

  const getTaskStats = () => {
    const open = getTasksByStatus("OPEN").length;
    const inProgress = getTasksByStatus("IN_PROGRESS").length;
    const blocked = getTasksByStatus("BLOCKED").length;
    const done = getTasksByStatus("DONE").length;
    const total = filteredTasks?.length || 0;

    return { open, inProgress, blocked, done, total };
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return filteredTasks?.filter((task: any) => 
      new Date(task.dueDate) < now && task.status !== "DONE"
    ) || [];
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-6 bg-muted rounded"></div>
                <div className="h-24 bg-card rounded"></div>
                <div className="h-24 bg-card rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getTaskStats();
  const overdueTasks = getOverdueTasks();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Management</h1>
          <p className="text-muted-foreground">Track and manage course update tasks</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kanban">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4" />
                  <span>Kanban</span>
                </div>
              </SelectItem>
              <SelectItem value="list">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>List</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Tasks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.open}</div>
            <div className="text-sm text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            <div className="text-sm text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{stats.blocked}</div>
            <div className="text-sm text-muted-foreground">Blocked</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-brand-success">{stats.done}</div>
            <div className="text-sm text-muted-foreground">Done</div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Warning */}
      {overdueTasks.length > 0 && (
        <Card className="mb-8 border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-destructive">
                  {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-muted-foreground">
                  These tasks have passed their due date and require immediate attention
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Review Overdue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="orange-border-top mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Owner</label>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger data-testid="select-owner-filter">
                  <SelectValue placeholder="All Owners" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  <SelectItem value="HAMADA">Hamada</SelectItem>
                  <SelectItem value="EMAN">Eman</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Module</label>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger data-testid="select-module-filter">
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {modules?.map((module: any) => (
                    <SelectItem key={module.id} value={module.code}>
                      {module.code} - {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger data-testid="select-severity-filter">
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="SEV1">SEV1</SelectItem>
                  <SelectItem value="SEV2">SEV2</SelectItem>
                  <SelectItem value="SEV3">SEV3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setOwnerFilter("all");
                  setModuleFilter("all");
                  setSeverityFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Views */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Open Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-medium text-foreground">Open</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-500 text-white rounded-full text-xs font-bold">
                {stats.open}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus("OPEN").map((task: any) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                />
              ))}
              {stats.open === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No open tasks</p>
                </div>
              )}
            </div>
          </div>
          
          {/* In Progress Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-medium text-foreground">In Progress</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-xs font-bold">
                {stats.inProgress}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus("IN_PROGRESS").map((task: any) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                />
              ))}
              {stats.inProgress === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No tasks in progress</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Blocked Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-medium text-foreground">Blocked</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-500 text-white rounded-full text-xs font-bold">
                {stats.blocked}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus("BLOCKED").map((task: any) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                />
              ))}
              {stats.blocked === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No blocked tasks</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Done Column */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="font-medium text-foreground">Done</h3>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-brand-success text-white rounded-full text-xs font-bold">
                {stats.done}
              </span>
            </div>
            <div className="space-y-3">
              {getTasksByStatus("DONE").map((task: any) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onStatusChange={handleStatusChange}
                />
              ))}
              {stats.done === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completed tasks</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks?.length === 0 ? (
            <Card className="orange-border-top">
              <CardContent className="py-12 text-center">
                <p className="text-lg text-muted-foreground mb-2">No tasks found</p>
                <p className="text-sm text-muted-foreground">
                  Tasks will appear here when impacts are approved
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks?.map((task: any) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                onStatusChange={handleStatusChange}
                className="w-full"
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
