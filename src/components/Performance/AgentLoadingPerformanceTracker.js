import { useEffect, useRef } from 'react';

/**
 * Performance tracking component for measuring agent loading times
 * Helps monitor the effectiveness of our caching optimizations
 */
export const useAgentLoadingPerformanceTracker = (agentId, isLoading, agentData, isDeployed) => {
  const timersRef = useRef({});
  const metricsRef = useRef({});

  useEffect(() => {
    if (!agentId) return;

    // Prevent re-initialization if already tracking this agent
    if (timersRef.current[`${agentId}_start`]) {
      return;
    }

    const startTime = Date.now();
    timersRef.current[`${agentId}_start`] = startTime;

    console.log(`[Performance Tracker] Started tracking load time for agent: ${agentId}`);

    // Track different loading phases
    timersRef.current[`${agentId}_phases`] = {
      agentDataStart: startTime,
      deploymentStatusStart: null,
      healthCheckStart: null,
      totalStart: startTime
    };

    // Cleanup function
    return () => {
      if (timersRef.current[`${agentId}_start`]) {
        delete timersRef.current[`${agentId}_start`];
        delete timersRef.current[`${agentId}_phases`];
        if (metricsRef.current[agentId]) {
          delete metricsRef.current[agentId];
        }
      }
    };
  }, [agentId]);

  // Track when agent data is loaded
  useEffect(() => {
    if (!agentId || !agentData || isLoading) return;
    
    // Prevent duplicate tracking
    if (metricsRef.current[agentId]?.agentDataLoadTime) return;

    const endTime = Date.now();
    const startTime = timersRef.current[`${agentId}_start`];
    
    if (startTime) {
      const loadTime = endTime - startTime;
      
      metricsRef.current[agentId] = {
        ...metricsRef.current[agentId],
        agentDataLoadTime: loadTime,
        agentDataLoadedAt: endTime
      };

      console.log(`[Performance Tracker] Agent data loaded in ${loadTime}ms for: ${agentId}`);
      
      // Mark agent data phase as complete
      if (timersRef.current[`${agentId}_phases`]) {
        timersRef.current[`${agentId}_phases`].agentDataEnd = endTime;
        timersRef.current[`${agentId}_phases`].agentDataDuration = 
          endTime - timersRef.current[`${agentId}_phases`].agentDataStart;
      }
    }
  }, [agentId, agentData, isLoading]);

  // Track when deployment status is loaded
  useEffect(() => {
    if (!agentId || isDeployed === null || isDeployed === undefined) return;
    
    // Prevent duplicate tracking
    if (metricsRef.current[agentId]?.deploymentStatusLoadTime) return;

    const endTime = Date.now();
    const startTime = timersRef.current[`${agentId}_start`];
    
    if (startTime) {
      const loadTime = endTime - startTime;
      
      metricsRef.current[agentId] = {
        ...metricsRef.current[agentId],
        deploymentStatusLoadTime: loadTime,
        deploymentStatusLoadedAt: endTime,
        isDeployed
      };

      console.log(`[Performance Tracker] Deployment status loaded in ${loadTime}ms (deployed: ${isDeployed}) for: ${agentId}`);
      
      // Mark deployment phase as complete
      if (timersRef.current[`${agentId}_phases`]) {
        if (!timersRef.current[`${agentId}_phases`].deploymentStatusStart) {
          timersRef.current[`${agentId}_phases`].deploymentStatusStart = 
            timersRef.current[`${agentId}_phases`].agentDataEnd || startTime;
        }
        timersRef.current[`${agentId}_phases`].deploymentStatusEnd = endTime;
        timersRef.current[`${agentId}_phases`].deploymentStatusDuration = 
          endTime - timersRef.current[`${agentId}_phases`].deploymentStatusStart;
      }
    }
  }, [agentId, isDeployed]);

  // Track complete loading cycle
  useEffect(() => {
    if (!agentId || isLoading || !agentData) return;
    
    // Prevent duplicate reporting
    if (metricsRef.current[agentId]?.totalLoadTime) return;

    const endTime = Date.now();
    const startTime = timersRef.current[`${agentId}_start`];
    
    if (startTime) {
      const totalTime = endTime - startTime;
      
      metricsRef.current[agentId] = {
        ...metricsRef.current[agentId],
        totalLoadTime: totalTime,
        completedAt: endTime
      };

      // Calculate performance metrics
      const metrics = metricsRef.current[agentId];
      const phases = timersRef.current[`${agentId}_phases`];
      
      console.log(`[Performance Tracker] 🎯 Complete loading cycle for ${agentId}:`, {
        totalTime: `${totalTime}ms`,
        agentDataTime: `${metrics.agentDataLoadTime || 0}ms`,
        deploymentStatusTime: `${metrics.deploymentStatusLoadTime || 0}ms`,
        phases: phases,
        cacheHit: totalTime < 1000 ? '✅ Fast (likely cached)' : '⚠️ Slow (likely fresh load)',
        performance: totalTime < 500 ? '🚀 Excellent' : 
                    totalTime < 1000 ? '✅ Good' : 
                    totalTime < 2000 ? '⚠️ Acceptable' : '❌ Poor'
      });

      // Report performance metrics to console for analysis
      reportPerformanceMetrics(agentId, metrics, phases);
    }
  }, [agentId, isLoading, agentData]);

  const reportPerformanceMetrics = (agentId, metrics, phases) => {
    const report = {
      agentId,
      timestamp: new Date().toISOString(),
      metrics,
      phases,
      optimizations: {
        caching: metrics.totalLoadTime < 1000,
        parallelLoading: phases?.agentDataDuration && phases?.deploymentStatusDuration,
        backgroundHealth: true // Always true with our implementation
      },
      recommendations: generateRecommendations(metrics)
    };

    // Store in session storage for debugging
    try {
      const existingReports = JSON.parse(sessionStorage.getItem('agentLoadingPerformance') || '[]');
      existingReports.push(report);
      
      // Keep only last 10 reports
      const recentReports = existingReports.slice(-10);
      sessionStorage.setItem('agentLoadingPerformance', JSON.stringify(recentReports));
      
      console.log('[Performance Tracker] 📊 Performance report saved to sessionStorage');
    } catch (error) {
      console.error('[Performance Tracker] Failed to save performance report:', error);
    }
  };

  const generateRecommendations = (metrics) => {
    const recommendations = [];
    
    if (metrics.totalLoadTime > 2000) {
      recommendations.push('Consider implementing more aggressive caching');
    }
    
    if (metrics.agentDataLoadTime > 1000) {
      recommendations.push('Agent data loading is slow - check Firestore queries');
    }
    
    if (metrics.deploymentStatusLoadTime > 1000) {
      recommendations.push('Deployment status check is slow - optimize agent_servers query');
    }
    
    return recommendations;
  };

  // Expose performance data for debugging
  const getPerformanceData = () => ({
    timers: timersRef.current,
    metrics: metricsRef.current[agentId],
    phases: timersRef.current[`${agentId}_phases`]
  });

  return {
    getPerformanceData,
    reportPerformanceMetrics
  };
};

/**
 * Performance comparison component to track before/after optimization metrics
 */
export const AgentLoadingPerformanceComparison = () => {
  useEffect(() => {
    // Log performance comparison on component mount
    const reports = JSON.parse(sessionStorage.getItem('agentLoadingPerformance') || '[]');
    
    if (reports.length > 0) {
      const averageLoadTime = reports.reduce((sum, report) => sum + (report.metrics?.totalLoadTime || 0), 0) / reports.length;
      const cacheHitRate = reports.filter(report => report.metrics?.totalLoadTime < 1000).length / reports.length;
      
      console.log('[Performance Comparison] 📈 Current performance stats:', {
        reportsCount: reports.length,
        averageLoadTime: `${averageLoadTime.toFixed(0)}ms`,
        cacheHitRate: `${(cacheHitRate * 100).toFixed(1)}%`,
        lastReport: reports[reports.length - 1]
      });
      
      // Performance benchmarks (before optimization)
      const BASELINE_LOAD_TIME = 3000; // ms (estimated from original sequential loading)
      const improvement = ((BASELINE_LOAD_TIME - averageLoadTime) / BASELINE_LOAD_TIME * 100);
      
      if (improvement > 0) {
        console.log(`[Performance Comparison] 🎉 Performance improvement: ${improvement.toFixed(1)}% faster than baseline`);
      }
    }
  }, []);

  return null; // This is a tracking-only component
};

export default useAgentLoadingPerformanceTracker;