/**
 * Type declarations for videoService.js
 * This file tells TypeScript the correct types for the JS service functions.
 */

export declare const videoService: {
  compressMedia(
    fileUri: string,
    resourceType?: 'video' | 'image',
    onProgress?: ((pct: number) => void) | null
  ): Promise<string>;

  uploadVideoToCloudinary(
    fileUri: string,
    resourceType?: 'video' | 'image',
    onProgress?: ((pct: number) => void) | null
  ): Promise<{ secure_url: string; public_id: string }>;

  createShort(params: {
    video_url: string;
    description: string;
    instructor_id: string;
    type?: string;
    public_id?: string;
  }): Promise<any>;

  fetchShorts(params?: { page?: number; limit?: number }): Promise<any[]>;
  fetchInstructorShorts(instructorId: string): Promise<any[]>;
  getShortById(id: string): Promise<any>;

  deleteFromCloudinary(
    publicId: string,
    resourceType?: string
  ): Promise<{ success: boolean; ghostEntry: boolean }>;

  deleteShort(
    id: string,
    publicId?: string,
    resourceType?: string
  ): Promise<{ success: boolean; deletedData: any }>;

  handleReaction(videoId: string, userId: string, type: string): Promise<any>;
  getUserReaction(videoId: string, userId: string): Promise<string | null>;
  fetchComments(videoId: string, userId?: string | null): Promise<any[]>;
  fetchReplies(parentId: string): Promise<any[]>;
  uploadCommentImage(fileUri: string): Promise<string | null>;
  addComment(
    videoId: string,
    userId: string,
    content: string,
    parentId?: string | null,
    imageUrl?: string | null
  ): Promise<any>;
  deleteComment(commentId: string): Promise<boolean>;
  toggleCommentLike(commentId: string, userId: string): Promise<any>;
  fetchPublicProfile(userId: string): Promise<{ profile: any; shorts: any[]; totalLikes: number }>;
  checkIsFollowing(followerId: string, followingId: string): Promise<boolean>;
  toggleFollow(followerId: string, followingId: string): Promise<boolean>;
  fetchFollowersList(targetUserId: string, viewerUserId: string): Promise<any[]>;
  fetchFollowingList(targetUserId: string, viewerUserId: string): Promise<any[]>;
};
