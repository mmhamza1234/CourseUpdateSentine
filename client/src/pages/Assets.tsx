import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import ModuleBadge from "@/components/ModuleBadge";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  FileText, 
  Video, 
  Monitor,
  AlertTriangle,
  Clock,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertAssetSchema } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

const assetFormSchema = insertAssetSchema.extend({
  triggerTags: z.array(z.string()).default([]),
});

export default function Assets() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sensitivityFilter, setSensitivityFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState("all");
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const { data: assets, isLoading: assetsLoading } = useQuery({
    queryKey: ["/api/assets"],
  });

  const { data: modules, isLoading: modulesLoading } = useQuery({
    queryKey: ["/api/modules"],
  });

  const assetForm = useForm<z.infer<typeof assetFormSchema>>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      lessonCode: "",
      assetType: "SLIDES",
      sensitivity: "Medium",
      toolDependency: "",
      triggerTags: [],
      link: "",
      version: "v1.0",
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/assets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
      assetForm.reset();
      toast({
        title: "Asset Created",
        description: "The course asset has been created successfully.",
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

  const updateAssetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/assets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setIsDialogOpen(false);
      setEditingAsset(null);
      assetForm.reset();
      toast({
        title: "Asset Updated",
        description: "The course asset has been updated successfully.",
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

  const filteredAssets = assets?.filter((asset: any) => {
    const matchesSearch = asset.module?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.lessonCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.toolDependency?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || asset.module?.code === moduleFilter;
    const matchesType = typeFilter === "all" || asset.assetType === typeFilter;
    const matchesSensitivity = sensitivityFilter === "all" || asset.sensitivity === sensitivityFilter;
    
    return matchesSearch && matchesModule && matchesType && matchesSensitivity;
  });

  const getAssetsByTab = () => {
    switch (selectedTab) {
      case "high-sensitivity":
        return filteredAssets?.filter((asset: any) => asset.sensitivity === "High");
      case "needs-review":
        return filteredAssets?.filter((asset: any) => 
          !asset.lastReviewed || new Date(asset.lastReviewed) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        );
      case "outdated":
        return filteredAssets?.filter((asset: any) => 
          asset.nextDue && new Date(asset.nextDue) < new Date()
        );
      default:
        return filteredAssets;
    }
  };

  const onSubmit = (data: z.infer<typeof assetFormSchema>) => {
    if (editingAsset) {
      updateAssetMutation.mutate({ id: editingAsset.id, data });
    } else {
      createAssetMutation.mutate(data);
    }
  };

  const handleEditAsset = (asset: any) => {
    setEditingAsset(asset);
    assetForm.reset({
      moduleId: asset.moduleId,
      lessonCode: asset.lessonCode,
      assetType: asset.assetType,
      sensitivity: asset.sensitivity,
      toolDependency: asset.toolDependency || "",
      triggerTags: asset.triggerTags || [],
      link: asset.link || "",
      version: asset.version,
    });
    setIsDialogOpen(true);
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const currentTags = assetForm.getValues("triggerTags");
      if (!currentTags.includes(tagInput.trim())) {
        assetForm.setValue("triggerTags", [...currentTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = assetForm.getValues("triggerTags");
    assetForm.setValue("triggerTags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "SLIDES":
        return <FileText className="w-4 h-4" />;
      case "TOOL_CLIP":
        return <Video className="w-4 h-4" />;
      case "SCREEN_DEMO":
        return <Monitor className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case "High":
        return "text-red-400 bg-red-500/10";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/10";
      case "Low":
        return "text-green-400 bg-green-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const getReviewStatus = (asset: any) => {
    if (!asset.lastReviewed) {
      return { icon: AlertTriangle, color: "text-red-400", status: "Never Reviewed" };
    }
    
    const reviewDate = new Date(asset.lastReviewed);
    const daysSinceReview = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReview > 90) {
      return { icon: AlertTriangle, color: "text-red-400", status: "Needs Review" };
    } else if (daysSinceReview > 60) {
      return { icon: Clock, color: "text-yellow-400", status: "Review Soon" };
    } else {
      return { icon: CheckCircle, color: "text-green-400", status: "Up to Date" };
    }
  };

  if (assetsLoading || modulesLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const tabAssets = getAssetsByTab();
  const highSensitivityCount = assets?.filter((a: any) => a.sensitivity === "High").length || 0;
  const needsReviewCount = assets?.filter((a: any) => 
    !a.lastReviewed || new Date(a.lastReviewed) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  ).length || 0;
  const outdatedCount = assets?.filter((a: any) => 
    a.nextDue && new Date(a.nextDue) < new Date()
  ).length || 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assets Registry</h1>
          <p className="text-muted-foreground">Manage course content assets and dependencies</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-primary" data-testid="button-add-asset">
              <Plus className="w-4 h-4 mr-2" />
              Add Asset
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAsset ? "Edit Asset" : "Add New Asset"}
              </DialogTitle>
            </DialogHeader>
            <Form {...assetForm}>
              <form onSubmit={assetForm.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assetForm.control}
                    name="moduleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-asset-module">
                              <SelectValue placeholder="Select module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules?.map((module: any) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.code} - {module.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assetForm.control}
                    name="lessonCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., L1, L2, All" {...field} data-testid="input-lesson-code" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assetForm.control}
                    name="assetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Asset Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-asset-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SLIDES">Slides</SelectItem>
                            <SelectItem value="TOOL_CLIP">Tool Clip</SelectItem>
                            <SelectItem value="SCREEN_DEMO">Screen Demo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assetForm.control}
                    name="sensitivity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sensitivity *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-asset-sensitivity">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assetForm.control}
                    name="toolDependency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tool Dependency</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., ChatGPT, n8n, Canva" {...field} data-testid="input-tool-dependency" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assetForm.control}
                    name="version"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version</FormLabel>
                        <FormControl>
                          <Input placeholder="v1.0" {...field} data-testid="input-asset-version" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={assetForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-asset-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label>Trigger Tags</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add trigger tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      data-testid="input-trigger-tag"
                    />
                    <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assetForm.watch("triggerTags").map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false);
                      setEditingAsset(null);
                      assetForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="btn-primary"
                    disabled={createAssetMutation.isPending || updateAssetMutation.isPending}
                    data-testid="button-submit-asset"
                  >
                    {editingAsset 
                      ? (updateAssetMutation.isPending ? "Updating..." : "Update Asset")
                      : (createAssetMutation.isPending ? "Creating..." : "Create Asset")
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="orange-border-top mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-assets"
                />
              </div>
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
                      {module.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="SLIDES">Slides</SelectItem>
                  <SelectItem value="TOOL_CLIP">Tool Clip</SelectItem>
                  <SelectItem value="SCREEN_DEMO">Screen Demo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Sensitivity</label>
              <Select value={sensitivityFilter} onValueChange={setSensitivityFilter}>
                <SelectTrigger data-testid="select-sensitivity-filter">
                  <SelectValue placeholder="All Sensitivities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sensitivities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setModuleFilter("all");
                  setTypeFilter("all");
                  setSensitivityFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all" data-testid="tab-all-assets">
            All ({assets?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="high-sensitivity" data-testid="tab-high-sensitivity">
            High Sensitivity ({highSensitivityCount})
          </TabsTrigger>
          <TabsTrigger value="needs-review" data-testid="tab-needs-review">
            Needs Review ({needsReviewCount})
          </TabsTrigger>
          <TabsTrigger value="outdated" data-testid="tab-outdated">
            Outdated ({outdatedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AssetsList assets={tabAssets} onEdit={handleEditAsset} />
        </TabsContent>

        <TabsContent value="high-sensitivity">
          <AssetsList assets={tabAssets} onEdit={handleEditAsset} />
        </TabsContent>

        <TabsContent value="needs-review">
          <AssetsList assets={tabAssets} onEdit={handleEditAsset} />
        </TabsContent>

        <TabsContent value="outdated">
          <AssetsList assets={tabAssets} onEdit={handleEditAsset} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AssetsListProps {
  assets: any[];
  onEdit: (asset: any) => void;
}

function AssetsList({ assets, onEdit }: AssetsListProps) {
  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case "SLIDES":
        return <FileText className="w-4 h-4" />;
      case "TOOL_CLIP":
        return <Video className="w-4 h-4" />;
      case "SCREEN_DEMO":
        return <Monitor className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case "High":
        return "text-red-400 bg-red-500/10";
      case "Medium":
        return "text-yellow-400 bg-yellow-500/10";
      case "Low":
        return "text-green-400 bg-green-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const getReviewStatus = (asset: any) => {
    if (!asset.lastReviewed) {
      return { icon: AlertTriangle, color: "text-red-400", status: "Never Reviewed" };
    }
    
    const reviewDate = new Date(asset.lastReviewed);
    const daysSinceReview = Math.floor((Date.now() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceReview > 90) {
      return { icon: AlertTriangle, color: "text-red-400", status: "Needs Review" };
    } else if (daysSinceReview > 60) {
      return { icon: Clock, color: "text-yellow-400", status: "Review Soon" };
    } else {
      return { icon: CheckCircle, color: "text-green-400", status: "Up to Date" };
    }
  };

  if (!assets || assets.length === 0) {
    return (
      <Card className="orange-border-top">
        <CardContent className="py-12 text-center">
          <p className="text-lg text-muted-foreground mb-2">No assets found</p>
          <p className="text-sm text-muted-foreground">
            Assets will appear here when they are added to the registry
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {assets.map((asset: any) => {
        const reviewStatus = getReviewStatus(asset);
        const ReviewIcon = reviewStatus.icon;
        
        return (
          <Card key={asset.id} className="orange-border-top hover:bg-muted/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getAssetIcon(asset.assetType)}
                  <h3 className="font-semibold text-foreground" data-testid={`text-asset-title-${asset.id}`}>
                    {asset.module?.code || "Unknown"} - {asset.lessonCode}
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(asset)}
                  data-testid={`button-edit-asset-${asset.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Module:</span>
                  <ModuleBadge moduleCode={asset.module?.code || "Unknown"} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type:</span>
                  <Badge variant="outline" className="text-xs">
                    {asset.assetType}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Sensitivity:</span>
                  <Badge className={cn("text-xs", getSensitivityColor(asset.sensitivity))}>
                    {asset.sensitivity}
                  </Badge>
                </div>

                {asset.toolDependency && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tool:</span>
                    <Badge variant="secondary" className="text-xs">
                      {asset.toolDependency}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version:</span>
                  <span className="text-sm text-foreground">{asset.version}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <div className={cn("flex items-center space-x-1 text-xs", reviewStatus.color)}>
                    <ReviewIcon className="w-3 h-3" />
                    <span>{reviewStatus.status}</span>
                  </div>
                </div>

                {asset.triggerTags && asset.triggerTags.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Trigger Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {asset.triggerTags.slice(0, 3).map((tag: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {asset.triggerTags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{asset.triggerTags.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {asset.link && (
                  <div className="pt-2">
                    <a 
                      href={asset.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:text-primary/80 flex items-center space-x-1"
                      data-testid={`link-asset-${asset.id}`}
                    >
                      <span>View Asset</span>
                    </a>
                  </div>
                )}

                <div className="pt-2 text-xs text-muted-foreground">
                  <div>Created: {new Date(asset.createdAt).toLocaleDateString()}</div>
                  {asset.lastReviewed && (
                    <div>Last reviewed: {new Date(asset.lastReviewed).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
