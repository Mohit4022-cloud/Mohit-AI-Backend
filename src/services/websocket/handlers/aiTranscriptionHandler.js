import { logger } from '../../../utils/logger.js';

export default function aiTranscriptionHandler(socket, io) {
  const { userId, organizationId } = socket;

  // Start live transcription
  socket.on('transcript:start', async (data) => {
    try {
      const { callId, language = 'en', model = 'whisper-1' } = data;
      
      // Join transcription room for this call
      socket.join(`transcript_${callId}`);
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:started', {
        callId,
        language,
        model,
        startedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Live transcription started for call: ${callId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error starting transcription:', error);
      socket.emit('error', { message: 'Failed to start transcription' });
    }
  });

  // Stop live transcription
  socket.on('transcript:stop', async (data) => {
    try {
      const { callId } = data;
      
      // Leave transcription room
      socket.leave(`transcript_${callId}`);
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:stopped', {
        callId,
        stoppedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Live transcription stopped for call: ${callId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error stopping transcription:', error);
      socket.emit('error', { message: 'Failed to stop transcription' });
    }
  });

  // Add transcript entry
  socket.on('transcript:entry', async (data) => {
    try {
      const { callId, entry } = data;
      
      // Broadcast to all users in the call and transcript rooms
      io.to(`call_${callId}`).emit('transcript:update', {
        callId,
        entry: {
          ...entry,
          id: entry.id || `temp_${Date.now()}_${Math.random()}`,
          timestamp: entry.timestamp || new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });

      io.to(`transcript_${callId}`).emit('transcript:update', {
        callId,
        entry,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript entry added for call: ${callId}`);
    } catch (error) {
      logger.error('Error adding transcript entry:', error);
      socket.emit('error', { message: 'Failed to add transcript entry' });
    }
  });

  // Update transcript entry
  socket.on('transcript:update_entry', async (data) => {
    try {
      const { callId, entryId, updates } = data;
      
      // Broadcast to all users in the call and transcript rooms
      io.to(`call_${callId}`).emit('transcript:entry_updated', {
        callId,
        entryId,
        updates,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      io.to(`transcript_${callId}`).emit('transcript:entry_updated', {
        callId,
        entryId,
        updates,
        updatedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript entry updated: ${entryId} for call: ${callId}`);
    } catch (error) {
      logger.error('Error updating transcript entry:', error);
      socket.emit('error', { message: 'Failed to update transcript entry' });
    }
  });

  // Delete transcript entry
  socket.on('transcript:delete_entry', async (data) => {
    try {
      const { callId, entryId } = data;
      
      // Broadcast to all users in the call and transcript rooms
      io.to(`call_${callId}`).emit('transcript:entry_deleted', {
        callId,
        entryId,
        deletedBy: userId,
        timestamp: new Date().toISOString(),
      });

      io.to(`transcript_${callId}`).emit('transcript:entry_deleted', {
        callId,
        entryId,
        deletedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript entry deleted: ${entryId} for call: ${callId}`);
    } catch (error) {
      logger.error('Error deleting transcript entry:', error);
      socket.emit('error', { message: 'Failed to delete transcript entry' });
    }
  });

  // Toggle transcript mode (sidebar/subtitle)
  socket.on('transcript:toggle_mode', async (data) => {
    try {
      const { callId, mode } = data; // mode: 'sidebar', 'subtitle', 'disabled'
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:mode_changed', {
        callId,
        mode,
        changedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript mode changed to: ${mode} for call: ${callId}`);
    } catch (error) {
      logger.error('Error toggling transcript mode:', error);
      socket.emit('error', { message: 'Failed to toggle transcript mode' });
    }
  });

  // Toggle keyword highlighting
  socket.on('transcript:toggle_keywords', async (data) => {
    try {
      const { callId, enabled } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:keywords_toggled', {
        callId,
        enabled,
        toggledBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Keyword highlighting ${enabled ? 'enabled' : 'disabled'} for call: ${callId}`);
    } catch (error) {
      logger.error('Error toggling keyword highlighting:', error);
      socket.emit('error', { message: 'Failed to toggle keyword highlighting' });
    }
  });

  // Toggle auto-scroll
  socket.on('transcript:toggle_autoscroll', async (data) => {
    try {
      const { callId, enabled } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:autoscroll_toggled', {
        callId,
        enabled,
        toggledBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Auto-scroll ${enabled ? 'enabled' : 'disabled'} for call: ${callId}`);
    } catch (error) {
      logger.error('Error toggling auto-scroll:', error);
      socket.emit('error', { message: 'Failed to toggle auto-scroll' });
    }
  });

  // Search transcript
  socket.on('transcript:search', async (data) => {
    try {
      const { callId, query, options } = data;
      
      // This would typically trigger a database search
      // For now, we'll broadcast the search request to all clients
      io.to(`call_${callId}`).emit('transcript:search_requested', {
        callId,
        query,
        options,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript search requested for call: ${callId}, query: ${query}`);
    } catch (error) {
      logger.error('Error searching transcript:', error);
      socket.emit('error', { message: 'Failed to search transcript' });
    }
  });

  // Export transcript
  socket.on('transcript:export', async (data) => {
    try {
      const { callId, format, options } = data;
      
      // Broadcast export request
      io.to(`call_${callId}`).emit('transcript:export_requested', {
        callId,
        format,
        options,
        requestedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript export requested for call: ${callId}, format: ${format}`);
    } catch (error) {
      logger.error('Error exporting transcript:', error);
      socket.emit('error', { message: 'Failed to export transcript' });
    }
  });

  // Add custom timestamp marker
  socket.on('transcript:add_marker', async (data) => {
    try {
      const { callId, timestamp, label } = data;
      
      // Broadcast to all users in the call room
      io.to(`call_${callId}`).emit('transcript:marker_added', {
        callId,
        timestamp,
        label,
        addedBy: userId,
        timestamp: new Date().toISOString(),
      });

      logger.info(`Transcript marker added for call: ${callId} at ${timestamp}`);
    } catch (error) {
      logger.error('Error adding transcript marker:', error);
      socket.emit('error', { message: 'Failed to add transcript marker' });
    }
  });

  // Handle real-time audio data for transcription
  socket.on('transcript:audio_chunk', async (data) => {
    try {
      const { callId, audioData, sequenceNumber } = data;
      
      // This would typically send the audio data to a transcription service
      // For now, we'll just acknowledge receipt
      socket.emit('transcript:audio_received', {
        callId,
        sequenceNumber,
        timestamp: new Date().toISOString(),
      });

      // Broadcast to other users in the transcript room that audio is being processed
      socket.to(`transcript_${callId}`).emit('transcript:audio_processing', {
        callId,
        sequenceNumber,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error processing audio chunk:', error);
      socket.emit('error', { message: 'Failed to process audio chunk' });
    }
  });
}