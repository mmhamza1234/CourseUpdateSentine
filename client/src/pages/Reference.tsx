import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  Calendar, 
  CheckSquare, 
  Eye, 
  FolderOpen,
  Bot,
  Globe,
  Settings,
  ArrowRight,
  Clock,
  AlertTriangle,
  Info
} from "lucide-react";

export default function Reference() {
  const courseModules = [
    { code: "M1", title: "AI Fundamentals", description: "Basic AI concepts and terminology" },
    { code: "M2", title: "ChatGPT Basics", description: "Getting started with ChatGPT" },
    { code: "M3", title: "Advanced Prompting", description: "Prompt engineering techniques" },
    { code: "M4", title: "Business Applications", description: "AI in business processes" },
    { code: "M5", title: "Content Creation", description: "Using AI for content generation" },
    { code: "M6", title: "Data Analysis", description: "AI-powered data insights" },
    { code: "M7", title: "Automation Tools", description: "AI automation platforms" },
    { code: "M8", title: "Integration", description: "Connecting AI tools to workflows" },
    { code: "M9", title: "Future Trends", description: "Emerging AI technologies" },
  ];

  const severityLevels = [
    {
      level: "SEV1",
      color: "bg-destructive",
      description: "Critical - Requires immediate action (< 2 hours)",
      examples: ["Major API breaking changes", "Service discontinuation", "Security vulnerabilities"]
    },
    {
      level: "SEV2", 
      color: "bg-yellow-500",
      description: "High - Needs attention within 24 hours",
      examples: ["Feature deprecations", "New pricing models", "UI/UX changes"]
    },
    {
      level: "SEV3",
      color: "bg-gray-400", 
      description: "Medium - Review within 1 week",
      examples: ["Minor feature updates", "Documentation changes", "Bug fixes"]
    }
  ];

  const monitoredVendors = [
    "OpenAI (ChatGPT & Platform)",
    "n8n (Automation)",
    "Notion (Workspace)",
    "Canva (Design)",
    "Gamma (Presentations)",
    "CapCut (Video Editing)",
    "ElevenLabs (Voice AI)",
    "Google Workspace",
    "W3Techs (Analytics)"
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Abdelrazik AI For Business Course Updating Tool - Reference Guide
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete documentation for understanding and using the course maintenance system
        </p>
      </div>

      {/* Overview */}
      <Card className="orange-border-top">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-foreground">
            This tool is a comprehensive AI-powered course maintenance system designed to monitor AI vendor updates 
            and automatically assess their impact on educational course materials. It helps maintain an up-to-date 
            9-module AI business course by tracking changes across major AI platforms and tools.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <Eye className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Monitor</h3>
              <p className="text-sm text-muted-foreground">Track AI vendor updates automatically</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Analyze</h3>
              <p className="text-sm text-muted-foreground">AI-powered impact assessment</p>
            </div>
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1">Action</h3>
              <p className="text-sm text-muted-foreground">Generate actionable update tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Course Structure */}
        <Card className="orange-border-top">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Course Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              The AI for Business course consists of 9 modules, each containing various assets:
            </p>
            <div className="space-y-2">
              {courseModules.map((module) => (
                <div key={module.code} className="flex items-start space-x-3 p-3 bg-secondary/50 rounded-lg">
                  <Badge variant="outline" className="mt-0.5">{module.code}</Badge>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{module.title}</h4>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Levels */}
        <Card className="orange-border-top">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Severity Classification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {severityLevels.map((sev) => (
              <div key={sev.level} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${sev.color}`}></div>
                  <Badge variant="outline">{sev.level}</Badge>
                  <span className="text-sm font-medium">{sev.description}</span>
                </div>
                <div className="ml-5 space-y-1">
                  {sev.examples.map((example, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{example}</span>
                    </div>
                  ))}
                </div>
                {sev.level !== "SEV3" && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="orange-border-top">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            How The Tool Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">1. Monitor</h3>
              <p className="text-sm text-muted-foreground">
                Automatically checks vendor sources daily at 09:30 Cairo time via RSS, HTML scraping, and APIs
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">2. Analyze</h3>
              <p className="text-sm text-muted-foreground">
                Uses OpenAI GPT-4 to summarize changes and classify their impact on course materials
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">3. Impact</h3>
              <p className="text-sm text-muted-foreground">
                Identifies which course modules and assets need updates based on detected changes
              </p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">4. Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Generates specific, actionable tasks with due dates for content creators to address
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitored Vendors */}
      <Card className="orange-border-top">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Monitored AI Vendors & Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {monitoredVendors.map((vendor, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-secondary/50 rounded-lg">
                <div className="w-2 h-2 bg-brand-success rounded-full"></div>
                <span className="text-sm font-medium">{vendor}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-info mt-0.5" />
              <div>
                <p className="text-sm text-info font-medium">Manual Monitoring Available</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Use the "Manual Run" button on the dashboard to trigger immediate monitoring of all active sources
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Guide */}
      <Card className="orange-border-top">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Navigation Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <CheckSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Dashboard</h4>
                  <p className="text-xs text-muted-foreground">System overview, stats, and manual run trigger</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Events</h4>
                  <p className="text-xs text-muted-foreground">Detected changes from monitored sources</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Impacts</h4>
                  <p className="text-xs text-muted-foreground">AI-analyzed impact assessments for approval</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <CheckSquare className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Tasks</h4>
                  <p className="text-xs text-muted-foreground">Generated action items for content updates</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <Eye className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Watchlist</h4>
                  <p className="text-xs text-muted-foreground">Manage monitored vendors and sources</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <FolderOpen className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Assets</h4>
                  <p className="text-xs text-muted-foreground">Course modules and content assets</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Reference</h4>
                  <p className="text-xs text-muted-foreground">This documentation and system guide</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center mt-1">
                  <Settings className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Settings</h4>
                  <p className="text-xs text-muted-foreground">System configuration and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          Built for maintaining cutting-edge AI business education • Powered by OpenAI • Made with ❤️ by Abdelrazik
        </p>
      </div>
    </div>
  );
}