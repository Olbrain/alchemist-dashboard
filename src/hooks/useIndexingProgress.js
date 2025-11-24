/**
 * useIndexingProgress Hook - OpenAI Vector Store Status Monitor (API Polling Version)
 *
 * Monitors knowledge files for OpenAI Vector Store processing status via backend API
 * Uses polling instead of Firestore real-time listeners for embed mode compatibility
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { refreshFileStatus } from '../services/knowledgeBase/knowledgeLibraryService';
import { getCurrentUser } from '../services/context';

const POLL_INTERVAL = 5000; // Poll every 5 seconds

const useIndexingProgress = (fileIds = []) => {
  const [progressData, setProgressData] = useState({});
  const intervalRefs = useRef(new Map());
  const completedFileIds = useRef(new Set());

  /**
   * Stop polling for a specific file
   */
  const stopFilePolling = useCallback((fileId) => {
    const intervalId = intervalRefs.current.get(fileId);
    if (intervalId) {
      console.log(`🛑 [Progress] Stopping polling for file: ${fileId}`);
      clearInterval(intervalId);
      intervalRefs.current.delete(fileId);
      completedFileIds.current.add(fileId);
    }
  }, []);

  /**
   * Poll file status from backend API
   */
  const pollFileStatus = useCallback(async (fileId) => {
    try {
      console.log(`🔄 [Progress] Polling status for file: ${fileId}`);

      // Get current user for API call
      const currentUser = getCurrentUser();
      const userId = currentUser?.uid;

      if (!userId) {
        console.warn(`⚠️ [Progress] No user ID available for polling file ${fileId}`);
        return;
      }

      const statusData = await refreshFileStatus(fileId, userId);

      if (statusData) {
        const progressInfo = {
          fileId,
          status: statusData.openai_status || 'unknown',
          error: statusData.last_error || null,
          filename: statusData.knowledge_info?.filename || 'Unknown file',
          lastUpdated: new Date().toISOString()
        };

        console.log(`📊 [Progress] File ${fileId} update:`, progressInfo);

        setProgressData(prev => ({
          ...prev,
          [fileId]: progressInfo
        }));

        // Stop polling if file reached final state
        const FINAL_STATES = ['completed', 'failed', 'cancelled'];
        if (FINAL_STATES.includes(progressInfo.status)) {
          console.log(`✅ [Progress] File ${fileId} reached final state: ${progressInfo.status}`);
          stopFilePolling(fileId);
        }
      } else {
        console.warn(`⚠️ [Progress] No status data returned for file ${fileId}`);
      }
    } catch (error) {
      console.error(`❌ [Progress] Error polling file ${fileId}:`, error);

      // Update progress data with error state
      setProgressData(prev => ({
        ...prev,
        [fileId]: {
          fileId,
          status: 'error',
          error: error.message || 'Failed to fetch status',
          filename: prev[fileId]?.filename || 'Unknown file',
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  }, [stopFilePolling]);

  /**
   * Start polling for a specific file
   */
  const setupFileListener = useCallback((fileId) => {
    if (!fileId || intervalRefs.current.has(fileId)) {
      return; // Skip if no fileId or polling already active
    }

    console.log(`🔄 [Progress] Setting up polling for file: ${fileId}`);

    // Poll immediately
    pollFileStatus(fileId);

    // Set up interval for continuous polling
    const intervalId = setInterval(() => {
      pollFileStatus(fileId);
    }, POLL_INTERVAL);

    intervalRefs.current.set(fileId, intervalId);
  }, [pollFileStatus]);

  /**
   * Remove polling and clear data for a specific file
   */
  const removeFileListener = useCallback((fileId) => {
    stopFilePolling(fileId);

    // Remove from progress data
    setProgressData(prev => {
      const updated = { ...prev };
      delete updated[fileId];
      return updated;
    });
  }, [stopFilePolling]);

  /**
   * Get progress info for specific file
   */
  const getFileProgress = useCallback((fileId) => {
    return progressData[fileId] || null;
  }, [progressData]);

  /**
   * Check if any files are currently processing
   */
  const hasProcessingFiles = Object.values(progressData).some(
    progress => progress.status === 'in_progress'
  );

  // Debug logging for processing files calculation
  React.useEffect(() => {
    if (Object.keys(progressData).length > 0) {
      const processingFiles = Object.values(progressData).filter(
        progress => progress.status === 'in_progress'
      );
      const statusSummary = Object.values(progressData).reduce((acc, progress) => {
        acc[progress.status] = (acc[progress.status] || 0) + 1;
        return acc;
      }, {});

      console.log(`🔍 [Progress Debug] Files processing status summary:`, {
        hasProcessingFiles,
        totalFiles: Object.keys(progressData).length,
        processingFiles: processingFiles.length,
        statusBreakdown: statusSummary,
        processingFileDetails: processingFiles.map(f => ({
          fileId: f.fileId,
          filename: f.filename,
          status: f.status
        }))
      });
    }
  }, [progressData, hasProcessingFiles]);

  // Set up polling when fileIds change
  useEffect(() => {
    console.log(`🔄 [Progress] File IDs changed:`, fileIds);

    // Get current polling files
    const currentFileIds = new Set(intervalRefs.current.keys());
    const newFileIds = new Set(fileIds.filter(id => id)); // Filter out null/undefined

    // Stop polling for files no longer in the list
    for (const fileId of currentFileIds) {
      if (!newFileIds.has(fileId)) {
        removeFileListener(fileId);
      }
    }

    // Start polling for new files (skip if already completed)
    for (const fileId of newFileIds) {
      if (!currentFileIds.has(fileId) && !completedFileIds.current.has(fileId)) {
        setupFileListener(fileId);
      }
    }
  }, [fileIds, setupFileListener, removeFileListener]);

  // Cleanup all polling on unmount
  useEffect(() => {
    const intervals = intervalRefs.current;
    return () => {
      console.log(`🧹 [Progress] Cleaning up all polling intervals`);
      for (const intervalId of intervals.values()) {
        clearInterval(intervalId);
      }
      intervals.clear();
      setProgressData({});
    };
  }, []);

  return {
    progressData,
    hasProcessingFiles,
    getFileProgress,
    setupFileListener,
    removeFileListener
  };
};

export default useIndexingProgress;
