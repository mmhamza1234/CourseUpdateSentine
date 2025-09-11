import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SeverityPill from "./SeverityPill";
import { Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task & {
    impact: {
      severity: string;
      changeEvent: { title: string };
      asset: { module: { code: string } };
    };
  };
  onStatusChange?: (taskId: string, newStatus: string) => void;
  className?: string;
}

export default function TaskCard({ task, onStatusChange, className }: TaskCardProps) {
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== "DONE";
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-gray-500";
      case "IN_PROGRESS": return "bg-blue-500";
      case "BLOCKED": return "bg-yellow-500";
      case "DONE": return "bg-brand-success";
      default: return "bg-gray-500";
    }
  };

  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <Card className={cn("hover:bg-muted/50 transition-colors", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h5 className="font-medium text-foreground text-sm" data-testid={`text-task-title-${task.id}`}>
            {task.title}
          </h5>
          <SeverityPill severity={task.impact.severity as any} />
        </div>
        
        <p className="text-xs text-muted-foreground mb-3" data-testid={`text-task-description-${task.id}`}>
          {task.description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span data-testid={`text-task-owner-${task.id}`}>{task.owner}</span>
          </div>
          <div className={cn(
            "flex items-center space-x-1 text-xs",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            <Clock className="w-3 h-3" />
            <span data-testid={`text-task-due-${task.id}`}>
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {task.status === "IN_PROGRESS" && task.progress !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span data-testid={`text-task-progress-${task.id}`}>{task.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5">
              <div
                className="bg-brand-info h-1.5 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
          </div>
        )}

        {task.status === "BLOCKED" && task.blockReason && (
          <div className="mb-3 p-2 bg-yellow-500/10 rounded text-xs text-yellow-600">
            <strong>Blocked:</strong> {task.blockReason}
          </div>
        )}

        {task.evidenceUrl && task.status === "DONE" && (
          <div className="mb-3">
            <a 
              href={task.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:text-primary/80"
              data-testid={`link-task-evidence-${task.id}`}
            >
              View Evidence
            </a>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className={cn(
            "w-2 h-2 rounded-full",
            getStatusColor(task.status)
          )} />
          
          {onStatusChange && task.status !== "DONE" && (
            <div className="flex space-x-1">
              {task.status === "OPEN" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  className="text-xs px-2 py-1"
                  data-testid={`button-task-start-${task.id}`}
                >
                  Start
                </Button>
              )}
              {task.status === "IN_PROGRESS" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange("BLOCKED")}
                    className="text-xs px-2 py-1"
                    data-testid={`button-task-block-${task.id}`}
                  >
                    Block
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatusChange("DONE")}
                    className="text-xs px-2 py-1"
                    data-testid={`button-task-complete-${task.id}`}
                  >
                    Complete
                  </Button>
                </>
              )}
              {task.status === "BLOCKED" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                  className="text-xs px-2 py-1"
                  data-testid={`button-task-unblock-${task.id}`}
                >
                  Unblock
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
