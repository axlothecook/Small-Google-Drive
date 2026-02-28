# Small Google Drive
## Small imitation of Google Drive that serves as a personal storage. 

## Tools & services used
Node.js for server hosting and management
Postgres as database
Prisma ORM as database management system
Standard CSS for styling
EJS for template generation (html)
Morgan for logging paths in terminal
Nodemon for automatic restaring of the app
Express validator for form data submission sanitanization
Multer for file submission
Passport.js for user authentication
bcryptjs for password encryption
[prisma-session-store](https://github.com/kleydon/prisma-session-store.git) for user session persistance in db
date-fns for date formatting
[connect-timeout](https://github.com/expressjs/timeout#readme) for emitting a 'timeout' in routing middleware

## What's the project's purpose?
User is able to create an account and log in whenever. During his visit he can create, rename (update), delete and share folders with unauthenticated users. The user can also add, download and delete files and folders with folders and/or files within.

## How does a user share a folder?
By clicking the 'Share' button on a folder, user is prompted to select the duration of the link during which link can be used and after which it expires. After the link is generated the user can copy it and share it with anyone. When used, the visitor will be brought to a version of the website showing shared folder's content while not needing the visitor to be authenticated.

## How does the project deal with the conflict of the user uploading multiple instances of the same file?
Every file uploaded gets renamed, with a random generated number added to the name, therefore eliminating any possibility of naming conflict.

## Any conflict with folder naming?
Two folders with same names can exist due to difference in identification given to each one.

# Demo photos

### Login page
[!image](https://github.com/user-attachments/assets/2992328c-a1d5-492c-a02c-75083e2e7102)

### Home page with files
[!image](https://github.com/user-attachments/assets/e1750deb-167e-45c2-a3d7-1e28e3b14b7a)

### Individual file info display page
[!image](https://github.com/user-attachments/assets/e07835ef-334d-449e-9d2e-aa71338d39de)

### Share folder page
[!image](https://github.com/user-attachments/assets/656ce32e-edbd-4f6f-871a-650ca07f9013)

### Generated link
[!image](https://github.com/user-attachments/assets/1a3153ea-64e9-4f7e-803c-1ee03e4a78bc)


### Website when visited with the unexpired shared link
[!image](https://github.com/user-attachments/assets/34781a6b-5f98-46eb-becf-2a5efce00e8d)
