import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Download, Trash2, Search, Filter } from "lucide-react";
import { format } from "date-fns";

export default function Logs() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/logs"],
  });

  const handleClearLogs = async () => {
    try {
      await apiRequest("DELETE", "/api/logs", {});
      toast({
        title: "Success",
        description: "Message logs cleared successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear logs",
        variant: "destructive",
      });
    }
  };

  const handleExportLogs = () => {
    const csvContent = [
      ["Timestamp", "User ID", "Message", "Status", "Error"].join(","),
      ...(logs as any[]).map((log: any) => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.telegramUserId,
        `"${log.message.replace(/"/g, '""')}"`,
        log.status,
        log.errorMessage || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `telegram-bot-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = (logs as any[]).filter((log: any) => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.telegramUserId.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-emerald-500 text-emerald-100">SUCCESS</Badge>;
      case "error":
        return <Badge variant="destructive">ERROR</Badge>;
      case "pending":
        return <Badge className="bg-amber-500 text-amber-100">PENDING</Badge>;
      default:
        return <Badge variant="secondary">{status.toUpperCase()}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Message Logs</h1>
            <p className="text-gray-400 mt-2">View and manage all Telegram bot messages</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              data-testid="button-refresh-logs"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={handleExportLogs}
              data-testid="button-export-logs"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearLogs}
              data-testid="button-clear-logs"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Logs
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-secondary border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages or user IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-600 text-white"
                  data-testid="input-search-logs"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-900 border-gray-600 text-white" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Card className="bg-secondary border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-white">Message History</CardTitle>
              <span className="text-gray-400 text-sm">
                {filteredLogs.length} of {(logs as any[]).length} messages
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No messages found</div>
                <p className="text-gray-500 mt-2">
                  {(logs as any[]).length === 0 ? "No messages have been sent yet" : "Try adjusting your search filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className={`bg-gray-800 rounded-lg p-4 border ${
                      log.status === 'error' ? 'border-red-600' : 'border-gray-600'
                    }`}
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusBadge(log.status)}
                          <span className="text-gray-400 text-sm">
                            {format(new Date(log.timestamp), "HH:mm:ss")}
                          </span>
                          <span className="text-gray-400 text-sm">
                            User: {log.telegramUserId}
                          </span>
                        </div>
                        <p className="text-white mb-2">{log.message}</p>
                        {log.errorMessage && (
                          <p className="text-red-400 text-sm">Error: {log.errorMessage}</p>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {format(new Date(log.timestamp), "MMM d, HH:mm")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
