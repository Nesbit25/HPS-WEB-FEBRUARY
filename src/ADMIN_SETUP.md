# Admin Portal Setup Guide

## Creating the First Admin User

To create an admin account for the office manager, you'll need to use the signup endpoint. You can do this using a tool like curl or Postman.

### Method 1: Using curl (Terminal/Command Line)

```bash
curl -X POST https://[YOUR_PROJECT_ID].supabase.co/functions/v1/make-server-fc862019/signup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_ANON_KEY]" \
  -d '{
    "email": "manager@hanemannplasticsurgery.com",
    "password": "ChangeThisPassword123!",
    "name": "Office Manager"
  }'
```

Replace:
- `[YOUR_PROJECT_ID]` with your Supabase project ID
- `[YOUR_ANON_KEY]` with your Supabase anon key
- Update the email, password, and name as needed

### Method 2: Using Browser Console

1. Open your website
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Run this code:

```javascript
fetch('https://[YOUR_PROJECT_ID].supabase.co/functions/v1/make-server-fc862019/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer [YOUR_ANON_KEY]'
  },
  body: JSON.stringify({
    email: 'manager@hanemannplasticsurgery.com',
    password: 'ChangeThisPassword123!',
    name: 'Office Manager'
  })
})
.then(res => res.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

## Accessing the Admin Portal

1. Scroll to the bottom of any page on the website
2. Look for the discreet "Admin" link in the footer (after "Privacy Policy | Terms of Service")
3. Click "Admin" to go to the login page
4. Enter your admin credentials
5. You'll be redirected to the Admin Dashboard

## Admin Portal Features

### Inquiries
- View all website contact form submissions
- See contact details, interested procedures, and messages
- Update inquiry status (New, Contacted, Scheduled, Closed)
- Sort by date with newest first

### Schedule
- View upcoming appointments
- Add new events with patient name, procedure, date, time, and notes
- Delete events

### Analytics
- Total inquiries count
- New vs contacted inquiries
- Inquiries by procedure type
- Page views by page

### Photos
- Upload photos to Supabase Storage
- Organize by category (Before & After, Facility, Team, Procedures)
- Add captions to photos
- Delete photos
- Photos are automatically stored with public URLs for use on the website

## Security Notes

- Emails are auto-confirmed since no email server is configured
- All admin routes require authentication
- Access tokens are validated on every request
- Photos are stored in a public Supabase Storage bucket for easy display
- **Important**: This is a prototype system. For production use with real patient data, additional security measures and HIPAA compliance would be required.

## Support

If you need to reset a password or have issues accessing the admin portal, you'll need to use the Supabase dashboard to manage user accounts.
