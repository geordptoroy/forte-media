import { useState, useEffect } from "react";
import { useMetaEvents, MetaApiEvent } from "@/hooks/useMetaEvents";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Globe,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Real-time Meta API Event Tracker Component.
 * Displays live feedback for Meta API calls.
 */
export function MetaEventTracker() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  
  const { events, isConnected, lastEvent } = useMetaEvents({
    onEvent: () => {
      // Show indicator when new events arrive
      setShowIndicator(true);
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  });

  // Automatically expand if there's a new request and it's not already expanded
  useEffect(() => {
    if (lastEvent?.type === "request") {
      setIsExpanded(true);
    }
  }, [lastEvent]);

  if (events.length === 0 && !isConnected) return null;

  const getStatusIcon = (type: MetaApiEvent["type"]) => {
    switch (type) {
      case "request": return <Search className="w-3 h-3 text-blue-400 animate-pulse" />;
      case "response": return <CheckCircle2 className="w-3 h-3 text-green-400" />;
      case "error": return <AlertCircle className="w-3 h-3 text-red-400" />;
      default: return <Activity className="w-3 h-3 text-gray-400" />;
    }
  };

  const getServiceBadge = (service: MetaApiEvent["service"]) => {
    const isAdLib = service === "ad_library";
    return (
      <Badge variant="outline" className={`text-[9px] uppercase tracking-tighter py-0 px-1.5 ${isAdLib ? "border-purple-500/30 text-purple-400" : "border-blue-500/30 text-blue-400"}`}>
        {isAdLib ? "Ad Library" : "Marketing API"}
      </Badge>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3"
          >
            <Card className="bg-black/90 border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden max-h-[400px] flex flex-col">
              <div className="p-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <Activity className={`w-4 h-4 ${isConnected ? "text-green-500" : "text-red-500"}`} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/80">Meta API Live</h3>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {events.map((event, idx) => (
                  <div 
                    key={`${event.timestamp}-${idx}`}
                    className={`p-2 rounded-lg border text-[11px] transition-all ${
                      idx === 0 ? "bg-white/[0.05] border-white/10" : "bg-transparent border-transparent opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(event.type)}
                        <span className="font-bold text-white/90 capitalize">{event.action.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-mono">
                        {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-1">
                      {getServiceBadge(event.service)}
                      {event.duration && (
                        <div className="flex items-center gap-1 text-[9px] text-gray-500">
                          <Clock className="w-2.5 h-2.5" />
                          {event.duration}ms
                        </div>
                      )}
                    </div>

                    {event.payload && (
                      <div className="mt-1.5 p-1.5 rounded bg-black/40 border border-white/5 font-mono text-[9px] text-gray-400 break-all max-h-20 overflow-y-auto">
                        {event.type === "request" && event.payload.countries && (
                          <div className="flex items-center gap-1 mb-1">
                            <Globe className="w-2.5 h-2.5" />
                            <span>Countries: {event.payload.countries.join(", ")}</span>
                          </div>
                        )}
                        {event.type === "request" && event.payload.terms && (
                          <div className="flex items-center gap-1">
                            <Search className="w-2.5 h-2.5" />
                            <span>Search: "{event.payload.terms}"</span>
                          </div>
                        )}
                        {event.type === "response" && event.payload.count !== undefined && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5 text-yellow-500" />
                            <span>Found {event.payload.count} results</span>
                          </div>
                        )}
                        {event.type === "error" && (
                          <div className="text-red-400/80">
                            Error: {event.payload.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="p-2 border-t border-white/5 text-center">
                <p className="text-[9px] text-gray-600">
                  {isConnected ? "Real-time connection active" : "Connection lost. Retrying..."}
                </p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
          isExpanded 
            ? "bg-white text-black border-white shadow-lg translate-y-2 opacity-0 pointer-events-none" 
            : "bg-black/80 text-white border-white/10 backdrop-blur-xl hover:border-white/20 shadow-xl"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className={`w-4 h-4 ${isConnected ? "text-green-500" : "text-red-500"}`} />
            {showIndicator && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Status Meta API</span>
            <span className="text-[9px] text-gray-500 leading-none">
              {lastEvent ? `${lastEvent.type.toUpperCase()}: ${lastEvent.action.replace(/_/g, " ")}` : "Ouvindo eventos..."}
            </span>
          </div>
        </div>
        <ChevronUp className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}
