import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Settings as SettingsIcon, 
  Clock, 
  Users, 
  Bell, 
  Shield, 
  Plus,
  Edit,
  Trash2,
  Save,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { z } from "zod";

const slaConfigSchema = z.object({
  severity: z.string(),
  patchWithinHours: z.number().min(1),
  comms: z.string().optional(),
});

const decisionRuleSchema = z.object({
  pattern: z.string().min(1),
  action: z.string().min(1),
  severity: z.string(),
  modules: z.array(z.string()),
  notes: z.string().optional(),
});

const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string(),
});

export default function Settings() {
  const [selectedTab, setSelectedTab] = useState("sla");
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { toast } = useToast();

  const { data: slaConfig, isLoading: slaLoading } = useQuery({
    queryKey: ["/api/sla-config"],
  });

  const { data: decisionRules, isLoading: rulesLoading } = useQuery({
    queryKey: ["/api/decision-rules"],
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });

  const { data: modules } = useQuery({
    queryKey: ["/api/modules"],
  });

  const slaForm = useForm<z.infer<typeof slaConfigSchema>>({
    resolver: zodResolver(slaConfigSchema),
    defaultValues: {
      severity: "SEV1",
      patchWithinHours: 8,
      comms: "",
    },
  });

  const ruleForm = useForm<z.infer<typeof decisionRuleSchema>>({
    resolver: zodResolver(decisionRuleSchema),
    defaultValues: {
      pattern: "",
      action: "SCREEN_REDO",
      severity: "SEV2",
      modules: [],
      notes: "",
    },
  });

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "USER",
    },
  });

  const updateSlaConfigMutation = useMutation({
    mutationFn: async ({ severity, data }: { severity: string; data: any }) => {
      return apiRequest("PUT", `/api/sla-config/${severity}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sla-config"] });
      toast({
        title: "SLA Config Updated",
        description: "The SLA configuration has been updated successfully.",
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

  const createRuleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/decision-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decision-rules"] });
      setIsRuleDialogOpen(false);
      setEditingRule(null);
      ruleForm.reset();
      toast({
        title: "Decision Rule Created",
        description: "The decision rule has been created successfully.",
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

  const createUserMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: "User Created",
        description: "The user has been created successfully.",
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

  const onSlaSubmit = (data: z.infer<typeof slaConfigSchema>) => {
    updateSlaConfigMutation.mutate({ severity: data.severity, data });
  };

  const onRuleSubmit = (data: z.infer<typeof decisionRuleSchema>) => {
    createRuleMutation.mutate(data);
  };

  const onUserSubmit = (data: z.infer<typeof userSchema>) => {
    createUserMutation.mutate(data);
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    ruleForm.reset({
      pattern: rule.pattern,
      action: rule.action,
      severity: rule.severity,
      modules: rule.modules || [],
      notes: rule.notes || "",
    });
    setIsRuleDialogOpen(true);
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setIsUserDialogOpen(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "SEV1":
        return "text-red-400 bg-red-500/10";
      case "SEV2":
        return "text-yellow-400 bg-yellow-500/10";
      case "SEV3":
        return "text-gray-400 bg-gray-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "FACE_RESHOOT":
        return "text-purple-400 bg-purple-500/10";
      case "SCREEN_REDO":
        return "text-blue-400 bg-blue-500/10";
      case "SLIDES_EDIT":
        return "text-green-400 bg-green-500/10";
      case "POLICY_NOTE":
        return "text-yellow-400 bg-yellow-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  if (slaLoading || rulesLoading || usersLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="h-12 bg-muted rounded mb-6"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="sla" data-testid="tab-sla">
            <Clock className="w-4 h-4 mr-2" />
            SLA Configuration
          </TabsTrigger>
          <TabsTrigger value="rules" data-testid="tab-rules">
            <Shield className="w-4 h-4 mr-2" />
            Decision Rules
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sla">
          <div className="space-y-6">
            <Card className="orange-border-top">
              <CardHeader>
                <CardTitle>SLA Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {["SEV1", "SEV2", "SEV3"].map((severity) => {
                    const config = slaConfig?.find((c: any) => c.severity === severity);
                    return (
                      <Card key={severity} className="border-2">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={getSeverityColor(severity)}>
                              {severity}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (config) {
                                  slaForm.reset({
                                    severity: config.severity,
                                    patchWithinHours: config.patchWithinHours,
                                    comms: config.comms || "",
                                  });
                                }
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <Form {...slaForm}>
                            <form onSubmit={slaForm.handleSubmit(onSlaSubmit)} className="space-y-3">
                              <FormField
                                control={slaForm.control}
                                name="patchWithinHours"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Response Time (hours)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        data-testid={`input-sla-hours-${severity}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={slaForm.control}
                                name="comms"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm">Communication Plan</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        {...field}
                                        placeholder="Describe notification requirements"
                                        className="text-sm"
                                        rows={3}
                                        data-testid={`textarea-sla-comms-${severity}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <Button
                                type="submit"
                                size="sm"
                                className="w-full"
                                disabled={updateSlaConfigMutation.isPending}
                                data-testid={`button-save-sla-${severity}`}
                              >
                                <Save className="w-3 h-3 mr-1" />
                                {updateSlaConfigMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </form>
                          </Form>
                          
                          {config && (
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                              Current: {config.patchWithinHours}h response time
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules">
          <div className="space-y-6">
            <Card className="orange-border-top">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Decision Rules</CardTitle>
                  <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary" data-testid="button-add-rule">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>
                          {editingRule ? "Edit Decision Rule" : "Add New Decision Rule"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...ruleForm}>
                        <form onSubmit={ruleForm.handleSubmit(onRuleSubmit)} className="space-y-4">
                          <FormField
                            control={ruleForm.control}
                            name="pattern"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Pattern *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="e.g., agent mode rename|assistants builder" 
                                    {...field} 
                                    data-testid="input-rule-pattern"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={ruleForm.control}
                              name="action"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Action *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-rule-action">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="FACE_RESHOOT">Face Reshoot</SelectItem>
                                      <SelectItem value="SCREEN_REDO">Screen Redo</SelectItem>
                                      <SelectItem value="SLIDES_EDIT">Slides Edit</SelectItem>
                                      <SelectItem value="POLICY_NOTE">Policy Note</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={ruleForm.control}
                              name="severity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Severity *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-rule-severity">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="SEV1">SEV1</SelectItem>
                                      <SelectItem value="SEV2">SEV2</SelectItem>
                                      <SelectItem value="SEV3">SEV3</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={ruleForm.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Additional notes about this rule" 
                                    {...field} 
                                    data-testid="textarea-rule-notes"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsRuleDialogOpen(false);
                                setEditingRule(null);
                                ruleForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="btn-primary"
                              disabled={createRuleMutation.isPending}
                              data-testid="button-submit-rule"
                            >
                              {createRuleMutation.isPending ? "Saving..." : "Save Rule"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {decisionRules?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No decision rules configured</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsRuleDialogOpen(true)}
                      data-testid="button-add-first-rule"
                    >
                      Add First Rule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {decisionRules?.map((rule: any) => (
                      <Card key={rule.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <code className="text-sm bg-muted px-2 py-1 rounded" data-testid={`text-rule-pattern-${rule.id}`}>
                                  {rule.pattern}
                                </code>
                                <Badge className={getSeverityColor(rule.severity)}>
                                  {rule.severity}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-sm text-muted-foreground">Action:</span>
                                <Badge className={getActionColor(rule.action)}>
                                  {rule.action}
                                </Badge>
                              </div>
                              {rule.notes && (
                                <p className="text-sm text-muted-foreground">{rule.notes}</p>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditRule(rule)}
                                data-testid={`button-edit-rule-${rule.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Switch 
                                checked={rule.isActive}
                                data-testid={`switch-rule-active-${rule.id}`}
                              />
                            </div>
                          </div>
                          
                          {rule.modules && rule.modules.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Affected Modules:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {rule.modules.map((moduleCode: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {moduleCode}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="space-y-6">
            <Card className="orange-border-top">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary" data-testid="button-add-user">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? "Edit User" : "Add New User"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...userForm}>
                        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                          <FormField
                            control={userForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email"
                                    placeholder="user@example.com" 
                                    {...field} 
                                    data-testid="input-user-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={userForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Full name" 
                                    {...field} 
                                    data-testid="input-user-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={userForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-user-role">
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="USER">User</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex justify-end space-x-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => {
                                setIsUserDialogOpen(false);
                                setEditingUser(null);
                                userForm.reset();
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit" 
                              className="btn-primary"
                              disabled={createUserMutation.isPending}
                              data-testid="button-submit-user"
                            >
                              {createUserMutation.isPending ? "Saving..." : "Save User"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {users?.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No users configured</p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUserDialogOpen(true)}
                      data-testid="button-add-first-user"
                    >
                      Add First User
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users?.map((user: any) => (
                      <Card key={user.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-medium text-foreground" data-testid={`text-user-name-${user.id}`}>
                                  {user.name}
                                </h4>
                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                  {user.role}
                                </Badge>
                                <div className="flex items-center space-x-1">
                                  {user.isActive ? (
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                  )}
                                  <span className="text-sm text-muted-foreground">
                                    {user.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <div data-testid={`text-user-email-${user.id}`}>{user.email}</div>
                                {user.lastLogin && (
                                  <div>Last login: {new Date(user.lastLogin).toLocaleString()}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                data-testid={`button-edit-user-${user.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Switch 
                                checked={user.isActive}
                                data-testid={`switch-user-active-${user.id}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className="space-y-6">
            <Card className="orange-border-top">
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">Email Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">SEV1 Alerts</Label>
                          <p className="text-xs text-muted-foreground">Immediate notification for critical issues</p>
                        </div>
                        <Switch defaultChecked data-testid="switch-notif-sev1" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">SEV2 Alerts</Label>
                          <p className="text-xs text-muted-foreground">Notification for important updates</p>
                        </div>
                        <Switch defaultChecked data-testid="switch-notif-sev2" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">Weekly Digest</Label>
                          <p className="text-xs text-muted-foreground">Weekly summary of all activities</p>
                        </div>
                        <Switch defaultChecked data-testid="switch-notif-weekly" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-sm font-medium">SLA Breach Warnings</Label>
                          <p className="text-xs text-muted-foreground">Alerts when approaching SLA deadlines</p>
                        </div>
                        <Switch defaultChecked data-testid="switch-notif-sla" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">SMTP Configuration</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>SMTP Host</Label>
                        <Input placeholder="smtp.gmail.com" data-testid="input-smtp-host" />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP Port</Label>
                        <Input placeholder="587" data-testid="input-smtp-port" />
                      </div>
                      <div className="space-y-2">
                        <Label>SMTP User</Label>
                        <Input placeholder="your-email@gmail.com" data-testid="input-smtp-user" />
                      </div>
                      <div className="space-y-2">
                        <Label>From Email</Label>
                        <Input placeholder="noreply@coursesentinel.com" data-testid="input-from-email" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-4">Timezone</h3>
                    <Select defaultValue="Africa/Cairo">
                      <SelectTrigger className="w-64" data-testid="select-timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                        <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-4">
                    <Button className="btn-primary" data-testid="button-save-notifications">
                      <Save className="w-4 h-4 mr-2" />
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
