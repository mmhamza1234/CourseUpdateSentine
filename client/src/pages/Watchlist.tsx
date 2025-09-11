import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Settings, ExternalLink, Trash2, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertSourceSchema, insertVendorSchema } from "@shared/schema";
import { z } from "zod";

const sourceFormSchema = insertSourceSchema.extend({
  cssSelector: z.string().optional(),
});

const vendorFormSchema = insertVendorSchema;

export default function Watchlist() {
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const { toast } = useToast();

  const { data: sources, isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/sources"],
  });

  const { data: vendors, isLoading: vendorsLoading } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const sourceForm = useForm<z.infer<typeof sourceFormSchema>>({
    resolver: zodResolver(sourceFormSchema),
    defaultValues: {
      name: "",
      url: "",
      type: "HTML",
      cssSelector: "",
      bridgeToggle: true,
      isActive: true,
    },
  });

  const vendorForm = useForm<z.infer<typeof vendorFormSchema>>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: "",
      description: "",
      website: "",
    },
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/sources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setIsSourceDialogOpen(false);
      sourceForm.reset();
      toast({
        title: "Source Created",
        description: "The monitoring source has been created successfully.",
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

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest("PUT", `/api/sources/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setIsSourceDialogOpen(false);
      setEditingSource(null);
      sourceForm.reset();
      toast({
        title: "Source Updated",
        description: "The monitoring source has been updated successfully.",
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

  const createVendorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      setIsVendorDialogOpen(false);
      vendorForm.reset();
      toast({
        title: "Vendor Created",
        description: "The vendor has been created successfully.",
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

  const toggleSourceMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: boolean }) => {
      return apiRequest("PUT", `/api/sources/${id}`, { [field]: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      toast({
        title: "Source Updated",
        description: "The source settings have been updated.",
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

  const onSourceSubmit = (data: z.infer<typeof sourceFormSchema>) => {
    if (editingSource) {
      updateSourceMutation.mutate({ id: editingSource.id, data });
    } else {
      createSourceMutation.mutate(data);
    }
  };

  const onVendorSubmit = (data: z.infer<typeof vendorFormSchema>) => {
    createVendorMutation.mutate(data);
  };

  const handleEditSource = (source: any) => {
    setEditingSource(source);
    sourceForm.reset({
      name: source.name,
      url: source.url,
      type: source.type,
      cssSelector: source.cssSelector || "",
      bridgeToggle: source.bridgeToggle,
      isActive: source.isActive,
      vendorId: source.vendorId,
    });
    setIsSourceDialogOpen(true);
  };

  const handleToggleActive = (sourceId: string, isActive: boolean) => {
    toggleSourceMutation.mutate({ id: sourceId, field: "isActive", value: !isActive });
  };

  const handleToggleBridge = (sourceId: string, bridgeToggle: boolean) => {
    toggleSourceMutation.mutate({ id: sourceId, field: "bridgeToggle", value: !bridgeToggle });
  };

  const getStatusIndicator = (source: any) => {
    if (!source.isActive) {
      return { color: "bg-gray-500", status: "Inactive" };
    }
    if (!source.bridgeToggle) {
      return { color: "bg-yellow-500", status: "Paused" };
    }
    return { color: "bg-brand-success", status: "Active" };
  };

  if (sourcesLoading || vendorsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-64 bg-card rounded-lg"></div>
            <div className="h-64 bg-card rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Watchlist</h1>
          <p className="text-muted-foreground">Manage monitoring sources and vendors</p>
        </div>
        <div className="flex items-center space-x-4">
          <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="button-add-vendor">
                <Plus className="w-4 h-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
              </DialogHeader>
              <Form {...vendorForm}>
                <form onSubmit={vendorForm.handleSubmit(onVendorSubmit)} className="space-y-4">
                  <FormField
                    control={vendorForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendor Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., OpenAI" {...field} data-testid="input-vendor-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the vendor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={vendorForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsVendorDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-primary"
                      disabled={createVendorMutation.isPending}
                      data-testid="button-submit-vendor"
                    >
                      {createVendorMutation.isPending ? "Creating..." : "Create Vendor"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="button-add-source">
                <Plus className="w-4 h-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? "Edit Monitoring Source" : "Add New Monitoring Source"}
                </DialogTitle>
              </DialogHeader>
              <Form {...sourceForm}>
                <form onSubmit={sourceForm.handleSubmit(onSourceSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={sourceForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ChatGPT Release Notes" {...field} data-testid="input-source-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sourceForm.control}
                      name="vendorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vendor *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-source-vendor">
                                <SelectValue placeholder="Select vendor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {vendors?.map((vendor: any) => (
                                <SelectItem key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={sourceForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/changelog" 
                            {...field} 
                            data-testid="input-source-url" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={sourceForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-source-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="RSS">RSS Feed</SelectItem>
                              <SelectItem value="HTML">HTML + CSS Selector</SelectItem>
                              <SelectItem value="API">GitHub API</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {sourceForm.watch("type") === "HTML" && (
                      <FormField
                        control={sourceForm.control}
                        name="cssSelector"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CSS Selector</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder=".changelog-item, article" 
                                {...field} 
                                data-testid="input-source-selector" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex items-center space-x-8">
                    <FormField
                      control={sourceForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-source-active"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Active</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={sourceForm.control}
                      name="bridgeToggle"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-source-bridge"
                            />
                          </FormControl>
                          <FormLabel className="text-sm">Enable Monitoring</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsSourceDialogOpen(false);
                        setEditingSource(null);
                        sourceForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-primary"
                      disabled={createSourceMutation.isPending || updateSourceMutation.isPending}
                      data-testid="button-submit-source"
                    >
                      {editingSource 
                        ? (updateSourceMutation.isPending ? "Updating..." : "Update Source")
                        : (createSourceMutation.isPending ? "Creating..." : "Create Source")
                      }
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vendors */}
        <Card className="orange-border-top">
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {vendors?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No vendors configured</p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsVendorDialogOpen(true)}
                  data-testid="button-add-first-vendor"
                >
                  Add First Vendor
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {vendors?.map((vendor: any) => (
                  <div key={vendor.id} className="p-3 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground" data-testid={`text-vendor-name-${vendor.id}`}>
                        {vendor.name}
                      </h4>
                      {vendor.website && (
                        <a 
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {vendor.description && (
                      <p className="text-xs text-muted-foreground">{vendor.description}</p>
                    )}
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        {sources?.filter((s: any) => s.vendorId === vendor.id).length || 0} sources
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monitoring Sources */}
        <Card className="orange-border-top lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Monitoring Sources</CardTitle>
              <div className="text-sm text-muted-foreground">
                {sources?.filter((s: any) => s.isActive && s.bridgeToggle).length || 0} active
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sources?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No monitoring sources configured</p>
                <Button 
                  className="btn-primary"
                  onClick={() => setIsSourceDialogOpen(true)}
                  data-testid="button-add-first-source"
                >
                  Add First Source
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {sources?.map((source: any) => {
                  const status = getStatusIndicator(source);
                  return (
                    <div key={source.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${status.color}`} />
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1" data-testid={`text-source-name-${source.id}`}>
                              {source.name}
                            </h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{source.vendor?.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                              <span>{status.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSource(source)}
                            data-testid={`button-edit-source-${source.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-muted-foreground mb-1">URL:</p>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                            {source.url}
                          </code>
                          <a 
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {source.cssSelector && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">CSS Selector:</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded block">
                            {source.cssSelector}
                          </code>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          Last checked: {source.lastChecked 
                            ? new Date(source.lastChecked).toLocaleString() 
                            : "Never"
                          }
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">Active:</span>
                            <Switch
                              checked={source.isActive}
                              onCheckedChange={() => handleToggleActive(source.id, source.isActive)}
                              disabled={toggleSourceMutation.isPending}
                              data-testid={`switch-active-${source.id}`}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-muted-foreground">Monitor:</span>
                            <Switch
                              checked={source.bridgeToggle}
                              onCheckedChange={() => handleToggleBridge(source.id, source.bridgeToggle)}
                              disabled={toggleSourceMutation.isPending || !source.isActive}
                              data-testid={`switch-bridge-${source.id}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
