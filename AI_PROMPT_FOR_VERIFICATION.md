# WeVersity App - Complete Feature Verification Prompt

## Context
Mujhe apne React Native/Expo app (WeVersity) ke complete workflow ko verify karna hai. Yeh ek educational platform hai jahan instructors shorts upload karte hain aur students unhe dekh sakte hain.

## App Structure

### 1. Initial Screen & Navigation
- **Question:** Jab koi user app ko open karta hai, to sabse pehle konsa screen show hota hai?
- **Expected Answer:** Shorts screen (Home page) - yeh `app/(tabs)/index.tsx` file se render hota hai
- **Bottom Tabs:** App mein total 6 bottom tabs hain:
  1. **Shorts** (index) - Default/First screen
  2. **Live** (live)
  3. **Upcoming** (upcoming)
  4. **Courses** (myCourses)
  5. **Inbox** (inbox)
  6. **Profile** (profile)

### 2. Shorts Feed Page (Home Screen)
- **Location:** `app/(tabs)/index.tsx` → `ShortsFeed` component
- **Functionality:**
  - Instructor ke uploaded shorts TikTok-style vertical scroll mein show ho rahe hain
  - Har video full-screen hai aur scroll karne par next video play hota hai
  - Database se shorts fetch ho rahe hain via `videoService.fetchShorts()`
  - Supabase `shorts` table se data aata hai with instructor profile join

### 3. Shorts Video Display
- **Component:** `src/components/shorts/ShortFeedItem.tsx`
- **Features:**
  - Video play/pause functionality
  - Right side par action buttons: Profile, Like, Dislike, Comment, Share
  - Bottom left mein instructor ka profile picture, name, aur role show ho raha hai
  - Agar instructor ne profile picture upload nahi kiya, to first name aur last name ke first characters show hone chahiye (currently placeholder icon hai)
  - Instructor profile par click karne par `viewProfile/[id].tsx` screen par navigate hota hai

### 4. Video Upload Workflow
- **Location:** `src/components/profile/InstructorProfile.tsx`
- **Process:**
  1. Instructor "Upload Short" button click karta hai
  2. Video picker open hota hai (ImagePicker)
  3. Video select karne ke baad:
     - **Step 1:** Video AWS S3 par upload hoti hai via `videoService.uploadVideoToS3()`
     - **Step 2:** S3 ka video URL (public URL) Supabase ke `shorts` table mein save hota hai via `videoService.createShort()`
     - **Step 3:** Database entry create hoti hai with fields: `video_url`, `description`, `instructor_id`
  4. Upload complete hone ke baad shorts list refresh hoti hai

### 5. Database Structure
- **Table:** `shorts` (Supabase PostgreSQL)
- **Columns:**
  - `id` (UUID)
  - `video_url` (TEXT) - AWS S3 ka public URL
  - `description` (TEXT)
  - `instructor_id` (UUID) - Foreign key to `profiles` table
  - `likes_count` (INTEGER)
  - `created_at` (TIMESTAMP)

### 6. View Profile Screen
- **Location:** `app/viewProfile/[id].tsx`
- **Features:**
  - Instructor ka full profile display hota hai
  - Profile picture with gradient border
  - Instructor ka name aur role show hota hai
  - Follow/Following button
  - Stats row: Total Videos count aur Total Likes count
  - Grid layout mein instructor ke sare uploaded videos show ho rahe hain
  - Har video par likes count overlay mein show hota hai
  - Video click karne par full-screen player open hota hai

### 7. Profile Picture Display Logic
- **In ShortFeedItem:** 
  - Agar `instructor.avatar_url` hai → Image show hoti hai
  - Agar nahi hai → Placeholder icon show hota hai (currently person icon)
  - **Expected:** First name aur last name ke first characters show hone chahiye (e.g., "JD" for John Doe)
- **In ViewProfile:**
  - Profile picture with gradient border
  - Agar avatar nahi hai to placeholder image

## Technical Stack
- **Framework:** React Native with Expo Router
- **Database:** Supabase (PostgreSQL)
- **Storage:** AWS S3 (for video uploads)
- **Video Player:** expo-video
- **State Management:** React Context (AuthContext)

## Images Reference
1. **First Image:** Profile folder structure showing `InstructorProfile.tsx` and `StudentProfile.tsx`
2. **Second Image:** Live video stream screen showing instructor profile, name, and role in bottom left
3. **Third Image:** `viewProfile/[id].tsx` file structure

## Verification Questions
1. Kya app open hone par Shorts screen first screen show hota hai?
2. Kya bottom tabs mein 6 pages correctly configured hain?
3. Kya instructor ke uploaded shorts Shorts feed mein TikTok-style show ho rahe hain?
4. Kya video upload workflow (S3 → Supabase) correctly implement hai?
5. Kya ShortFeedItem mein instructor ka profile, name, aur role properly display ho raha hai?
6. Kya profile click karne par viewProfile screen par navigate ho raha hai?
7. Kya viewProfile screen par instructor ke sare videos aur total likes show ho rahe hain?
8. Kya agar instructor ne profile picture upload nahi kiya to first/last name ke first characters show ho rahe hain?

## Code Files to Review
- `app/(tabs)/_layout.tsx` - Bottom tabs configuration
- `app/(tabs)/index.tsx` - Shorts screen
- `src/components/shorts/ShortsFeed.tsx` - Shorts feed component
- `src/components/shorts/ShortFeedItem.tsx` - Individual short item
- `src/components/profile/InstructorProfile.tsx` - Instructor profile with upload
- `app/viewProfile/[id].tsx` - View profile screen
- `src/services/videoService.js` - Video service with S3 upload and Supabase operations

## Expected Behavior Summary
1. ✅ App opens to Shorts screen (Home)
2. ✅ 6 bottom tabs: Shorts, Live, Upcoming, Courses, Inbox, Profile
3. ✅ Shorts feed shows instructor videos in vertical scroll
4. ✅ Video upload: Instructor uploads → AWS S3 → Supabase database
5. ✅ ShortFeedItem shows instructor profile, name, role
6. ✅ Profile click navigates to viewProfile/[id]
7. ✅ ViewProfile shows instructor name, all videos, total likes
8. ⚠️ Avatar placeholder should show first/last name initials (needs verification/fix)
