# Inquiry Conversation System Setup Guide

This guide will help you set up the conversation/reply system for inquiries.

## What Changed

The inquiry system has been updated from a simple one-way message system to a full conversation thread system where:

1. **Students/Lecturers** can:
   - View all their submitted inquiries
   - See conversation history with administrators
   - Send follow-up messages to continue the conversation

2. **Administrators** can:
   - View all inquiries from users
   - Reply to inquiries in a conversation thread
   - Manually update inquiry status (pending/resolved/closed)
   - Status is NO LONGER automatically changed to "resolved" when replying

## Database Setup

### Step 1: Run the Inquiry Replies Migration

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/migrations/add_inquiry_replies_table.sql`
4. Click "Run" to execute the script

This will create:
- `inquiry_replies` table for storing conversation messages
- Row Level Security policies for access control
- Indexes for performance

### Step 2: Run the Storage Setup (If Not Already Done)

If you haven't already set up file storage for attachments:

1. In the SQL Editor, run `setup-inquiry-attachments-storage.sql`
2. This sets up the storage bucket and updates the attachments schema

## Features

### For Students/Lecturers (My Inquiries Page)

1. **View Inquiry History**
   - See all submitted inquiries with status badges
   - Filter by status (pending, resolved, closed)
   - View statistics

2. **Conversation Thread**
   - Click "View" on any inquiry to see the full conversation
   - Messages are displayed in a chat-like interface
   - Admin messages appear on the right (blue)
   - User messages appear on the left (white)

3. **Send Follow-ups**
   - Add follow-up messages to continue the conversation
   - No need to create new inquiries for related questions
   - Real-time conversation flow

### For Administrators (Inquiries Management Page)

1. **View All Inquiries**
   - See inquiries from all users
   - Search and filter capabilities
   - User information displayed

2. **Conversation Thread**
   - View full conversation history
   - Reply to messages in the thread
   - Messages are preserved in chronological order

3. **Manual Status Control**
   - Status buttons: Pending, Resolved, Closed
   - Click a button to change status
   - Status is NOT automatically changed when replying
   - Gives administrators full control

## Database Schema

### inquiry_replies Table

```sql
CREATE TABLE inquiry_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES admin_inquiries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Access Control

- Users can only create replies on their own inquiries
- Users can only view replies on their own inquiries
- Administrators can view and create replies on any inquiry
- All enforced through Row Level Security policies

## API Endpoints

### GET /api/inquiries/[id]/replies
- Fetches all replies for an inquiry
- Returns replies with user information
- Ordered chronologically

**Response:**
```json
{
  "success": true,
  "replies": [
    {
      "id": "uuid",
      "inquiry_id": "uuid",
      "user_id": "uuid",
      "message": "Reply text",
      "created_at": "timestamp",
      "users": {
        "id": "uuid",
        "name": "User Name",
        "role": "administrator"
      }
    }
  ]
}
```

### POST /api/inquiries/[id]/replies
- Creates a new reply in the conversation
- Updates inquiry's updated_at timestamp
- Logs the action

**Request:**
```json
{
  "message": "Reply message text"
}
```

**Response:**
```json
{
  "success": true,
  "reply": { /* reply object */ },
  "message": "Reply added successfully"
}
```

## UI Components Updated

### InquiriesManagementPage (Admin View)

**Changes:**
- Replaced single "Admin Response" field with conversation thread
- Added replies list showing all messages
- Messages styled differently for admins vs users
- Added real-time reply functionality
- Removed automatic status change to "resolved"
- Status is now manually controlled via buttons

### MyInquiriesPage (Student/Lecturer View)

**Changes:**
- Replaced static "Administrator Response" display with conversation thread
- Added ability to view full conversation history
- Added "Send Follow-up" feature for continuing conversations
- Messages displayed in chat-like interface
- Visual distinction between admin and user messages

## Migration Path

### Existing Inquiries

Old inquiries with `admin_response` field will continue to work:
- The `admin_response` field is still in the database
- No data is lost
- New conversations use the `inquiry_replies` table
- You can manually migrate old responses to replies if needed

### Backward Compatibility

The system supports both:
1. **Old format**: `admin_response` text field (deprecated but still functional)
2. **New format**: Conversation threads in `inquiry_replies` table

## Testing the System

### As a Student/Lecturer:

1. Go to "Contact Admin"
2. Submit a new inquiry with subject and message
3. Go to "My Inquiries"
4. Click "View" on your inquiry
5. You should see your original message
6. Type a follow-up message and click "Send Follow-up"
7. The message appears in the conversation thread

### As an Administrator:

1. Go to "Inquiries"
2. Click "View" on any inquiry
3. You should see the user's original message
4. See any existing conversation thread
5. Type a reply and click "Send Reply"
6. Your reply appears in the conversation
7. Status remains unchanged (manual control)
8. Click status buttons (Pending/Resolved/Closed) to update status

## Troubleshooting

### Issue: "Failed to fetch conversation"
- Check that the `inquiry_replies` table exists
- Verify RLS policies are enabled
- Check browser console for detailed errors

### Issue: "Unauthorized" when sending replies
- Verify user authentication
- Check that RLS policies match user roles
- Ensure user has access to the inquiry

### Issue: Old inquiries don't show conversation
- Old inquiries may only have `admin_response` field
- New replies will create conversation threads
- Consider migrating old responses if needed

## Best Practices

1. **Status Management**
   - Only mark inquiries as "Resolved" when truly complete
   - Use "Pending" for ongoing conversations
   - Use "Closed" for inquiries that are complete and archived

2. **Conversation Flow**
   - Keep replies focused and clear
   - Use the thread to maintain context
   - Avoid creating new inquiries for related questions

3. **Performance**
   - Conversation threads are limited to 400px height with scroll
   - Old conversations are preserved for reference
   - Indexes ensure fast query performance
