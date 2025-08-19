import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface MessageLogProps {
  logs: Array<{
    id: string;
    telegramUserId: string;
    message: string;
    status: string;
    errorMessage?: string;
    timestamp: string;
  }>;
}

export function MessageLog({ logs }: MessageLogProps) {
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

  const formatTime = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "HH:mm:ss");
    } catch {
      return "Invalid time";
    }
  };

  const getTimeAgo = (timestamp: string) => {
    try {
      const now = new Date();
      const messageTime = new Date(timestamp);
      const diffInMinutes = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return "Just now";
      if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } catch {
      return "Unknown";
    }
  };

  return (
    <Card className="bg-secondary border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold text-white">Recent Messages</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
              data-testid="button-refresh-messages"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg">No messages yet</div>
            <p className="text-gray-500 mt-2">Messages will appear here once you start sending notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={`bg-gray-800 rounded-lg p-4 border ${
                  log.status === 'error' ? 'border-red-600' : 'border-gray-600'
                }`}
                data-testid={`message-log-${log.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusBadge(log.status)}
                      <span className="text-gray-400 text-sm">{formatTime(log.timestamp)}</span>
                      <span className="text-gray-400 text-sm">User: {log.telegramUserId}</span>
                    </div>
                    <p className="text-white">{log.message}</p>
                    {log.errorMessage && (
                      <p className="text-red-400 text-sm mt-2">Error: {log.errorMessage}</p>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {getTimeAgo(log.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {logs.length > 5 && (
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-primary hover:text-indigo-400 font-medium"
              data-testid="button-load-more-messages"
            >
              Load More Messages
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
