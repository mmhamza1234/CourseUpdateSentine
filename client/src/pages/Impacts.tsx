import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeverityPill from "@/components/SeverityPill";
import ModuleBadge from "@/components/ModuleBadge";
import { CheckCircle, XCircle, Clock, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

export default function Impacts() {
  const [selectedTab, setSelectedTab] = useState("pending");
  const { toast } = useToast();

  const { data: impacts, isLoading } = useQuery({
    queryKey: ["/api/impacts"],
  });

  const approveMutation = useMutation({
    mutationFn: async (impactId: string) => {
      return apiRequest("POST", `/api/impacts/${impactId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/impacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Impact Approved",
        description: "Tasks have been generated and assigned.",
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

  const rejectMutation = useMutation({
    mutationFn: async (impactId: string) => {
      return apiRequest("POST", `/api/impacts/${impactId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/impacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Impact Rejected",
        description: "The impact assessment has been rejected.",
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

  const handleApprove = (impactId: string) => {
    approveMutation.mutate(impactId);
  };

  const handleReject = (impactId: string) => {
    rejectMutation.mutate(impactId);
  };

  const filteredImpacts = impacts?.filter((impact: any) => {
    switch (selectedTab) {
      case "pending":
        return impact.status === "PENDING";
      case "approved":
        return impact.status === "APPROVED";
      case "rejected":
        return impact.status === "REJECTED";
      default:
        return true;
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-brand-success" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "FACE_RESHOOT":
        return <User className="w-4 h-4 text-primary" />;
      case "SCREEN_REDO":
        return <Zap className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = impacts?.filter((i: any) => i.status === "PENDING").length || 0;
  const approvedCount = impacts?.filter((i: any) => i.status === "APPROVED").length || 0;
  const rejectedCount = impacts?.filter((i: any) => i.status === "REJECTED").length || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Impact Assessment</h1>
          <p className="text-muted-foreground">Review and approve change impacts on course content</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {impacts?.length || 0} total assessments
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all" data-testid="tab-all-impacts">
            All ({impacts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-impacts">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved-impacts">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected-impacts">
            Rejected ({rejectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <ImpactsList 
            impacts={impacts} 
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="pending">
          <ImpactsList 
            impacts={filteredImpacts} 
            onApprove={handleApprove}
            onReject={handleReject}
            isApproving={approveMutation.isPending}
            isRejecting={rejectMutation.isPending}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="approved">
          <ImpactsList impacts={filteredImpacts} />
        </TabsContent>

        <TabsContent value="rejected">
          <ImpactsList impacts={filteredImpacts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ImpactsListProps {
  impacts: any[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  showActions?: boolean;
}

function ImpactsList({ 
  impacts, 
  onApprove, 
  onReject, 
  isApproving, 
  isRejecting, 
  showActions = false 
}: ImpactsListProps) {
  if (!impacts || impacts.length === 0) {
    return (
      <Card className="orange-border-top">
        <CardContent className="py-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">No impact assessments found</p>
          <p className="text-sm text-muted-foreground">
            Assessments will appear here when changes are detected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {impacts.map((impact: any) => (
        <Card key={impact.id} className="orange-border-top">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-foreground" data-testid={`text-impact-title-${impact.id}`}>
                    {impact.changeEvent?.title || "Unknown Change"}
                  </h3>
                  <SeverityPill severity={impact.severity} />
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                  <span>{impact.changeEvent?.vendor?.name || "Unknown Vendor"}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    {getActionIcon(impact.predictedAction)}
                    <span data-testid={`text-impact-action-${impact.id}`}>{impact.predictedAction}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(impact.status)}
                    <span>{impact.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                <div className="text-lg font-medium text-foreground" data-testid={`text-impact-confidence-${impact.id}`}>
                  {Math.round(parseFloat(impact.confidence))}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Change Summary</h4>
              <p className="text-sm text-muted-foreground" data-testid={`text-impact-summary-${impact.id}`}>
                {impact.changeEvent?.summary || "No summary available"}
              </p>
            </div>

            {impact.reasons && impact.reasons.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-foreground mb-2">Assessment Reasons</h4>
                <div className="space-y-2">
                  {impact.reasons.map((reason: string, index: number) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">{reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="font-medium text-foreground mb-2">Affected Asset</h4>
              <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
                <ModuleBadge moduleCode={impact.asset?.module?.code || "Unknown"} />
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">
                    {impact.asset?.module?.title || "Unknown Module"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {impact.asset?.assetType} • {impact.asset?.lessonCode}
                  </p>
                </div>
                <Badge variant="outline">
                  {impact.asset?.sensitivity || "Medium"} Sensitivity
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                Assessed: {new Date(impact.createdAt).toLocaleString()}
                {impact.decidedBy && impact.decidedAt && (
                  <>
                    <span className="mx-2">•</span>
                    {impact.status === "APPROVED" ? "Approved" : "Rejected"} by {impact.decidedBy} on{" "}
                    {new Date(impact.decidedAt).toLocaleString()}
                  </>
                )}
              </div>

              {showActions && impact.status === "PENDING" && (
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    className="bg-brand-success hover:bg-brand-success/80"
                    onClick={() => onApprove?.(impact.id)}
                    disabled={isApproving}
                    data-testid={`button-approve-impact-${impact.id}`}
                  >
                    {isApproving ? "Approving..." : "Approve"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject?.(impact.id)}
                    disabled={isRejecting}
                    data-testid={`button-reject-impact-${impact.id}`}
                  >
                    {isRejecting ? "Rejecting..." : "Reject"}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    data-testid={`button-modify-impact-${impact.id}`}
                  >
                    Modify
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
