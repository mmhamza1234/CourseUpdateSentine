import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SeverityPill from "@/components/SeverityPill";
import ModuleBadge from "@/components/ModuleBadge";
import { Clock, ExternalLink, Search, Filter } from "lucide-react";
import { Link } from "wouter";

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events", { limit: "100" }],
  });

  const { data: vendors } = useQuery({
    queryKey: ["/api/vendors"],
  });

  const filteredEvents = events?.filter((event: any) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.summary?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVendor = vendorFilter === "all" || event.vendor?.id === vendorFilter;
    const matchesType = typeFilter === "all" || event.changeType === typeFilter;
    
    return matchesSearch && matchesVendor && matchesType;
  });

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "capability": return "text-blue-400";
      case "ui": return "text-purple-400";
      case "policy": return "text-red-400";
      case "pricing": return "text-yellow-400";
      case "api": return "text-green-400";
      case "deprecation": return "text-orange-400";
      default: return "text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-card rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-foreground">Change Events</h1>
          <p className="text-muted-foreground">Monitor AI tool updates and changes</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredEvents?.length || 0} events
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-events"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Vendor</label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger data-testid="select-vendor-filter">
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors?.map((vendor: any) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Change Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger data-testid="select-type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="capability">Capability</SelectItem>
                  <SelectItem value="ui">UI Change</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="deprecation">Deprecation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setVendorFilter("all");
                  setTypeFilter("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {filteredEvents?.length === 0 ? (
        <Card className="orange-border-top">
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground mb-2">No events found</p>
            <p className="text-sm text-muted-foreground">
              {events?.length === 0 
                ? "Events will appear here when sources are monitored"
                : "Try adjusting your filters to see more events"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents?.map((event: any) => (
            <Card key={event.id} className="orange-border-top hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground" data-testid={`text-event-title-${event.id}`}>
                        {event.title}
                      </h3>
                      {event.changeType && (
                        <span className={`text-xs px-2 py-1 rounded-full bg-secondary ${getChangeTypeColor(event.changeType)}`}>
                          {event.changeType}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                      <span data-testid={`text-event-vendor-${event.id}`}>{event.vendor?.name}</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span data-testid={`text-event-date-${event.id}`}>
                          {new Date(event.publishedAt).toLocaleString()}
                        </span>
                      </div>
                      {event.url && (
                        <>
                          <span>•</span>
                          <a 
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary hover:text-primary/80"
                            data-testid={`link-event-source-${event.id}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Source</span>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="font-medium text-foreground mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground" data-testid={`text-event-summary-${event.id}`}>
                    {event.summary || "No summary available"}
                  </p>
                  
                  {event.summaryAr && (
                    <div className="mt-2 rtl">
                      <h5 className="font-medium text-foreground mb-1">الملخص</h5>
                      <p className="text-sm text-muted-foreground">{event.summaryAr}</p>
                    </div>
                  )}
                </div>

                {event.entities && event.entities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Affected Features</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.entities.map((entity: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400"
                        >
                          {entity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {event.risks && event.risks.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-foreground mb-2">Potential Risks</h4>
                    <div className="flex flex-wrap gap-2">
                      {event.risks.map((risk: string, index: number) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/10 text-red-400"
                        >
                          {risk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Detected: {new Date(event.createdAt).toLocaleString()}
                  </div>
                  <Link href="/impacts">
                    <Button variant="outline" size="sm" data-testid={`button-view-impacts-${event.id}`}>
                      View Impacts
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
