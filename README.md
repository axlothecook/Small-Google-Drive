# Small Google Drive
## Small imitation of Google Drive that serves as a personal storage. 

## Tools & services used
[Node.js](https://nodejs.org/en) for server hosting and management </br>
[Postgres](https://www.postgresql.org) as database </br>
[Prisma ORM](https://www.prisma.io) as database management system </br>
[CSS3](https://css3.com) for styling </br>
[EJS](https://ejs.co) for template generation (html) </br>
[Morgan](https://www.npmjs.com/package/morgan) for logging paths in terminal </br>
[Nodemon](https://www.npmjs.com/package/nodemon) for automatic restaring of the app </br>
[Express validator](https://www.npmjs.com/package/express-validator) for form data submission sanitanization </br>
[Multer](https://www.npmjs.com/package/multer) for file submission </br>
[Passport.js](https://www.passportjs.org) for user authentication </br>
[bcryptjs](https://www.npmjs.com/package/bcryptjs) for password encryption </br>
[prisma-session-store](https://github.com/kleydon/prisma-session-store.git) for user session persistance in db </br>
[date-fns](https://date-fns.org/v4.1.0/docs/format) for date formatting </br>
[connect-timeout](https://github.com/expressjs/timeout#readme) for emitting a 'timeout' in routing middleware </br>
[Supabase](https://supabase.com) for cloud file storage </br>
[cors](https://www.npmjs.com/package/cors) for response headers </br>

## What's the project's purpose?
User is able to create an account and log in whenever. During his visit he can create, rename (update), delete and share folders with unauthenticated users. The user can also add, download and delete files and folders with folders and/or files within.

## How does a user share a folder?
By clicking the 'Share' button on a folder, user is prompted to select the duration of the link during which link can be used and after which it expires. After the link is generated the user can copy it and share it with anyone. When used, the visitor will be brought to a version of the website showing shared folder's content while not needing the visitor to be authenticated.

## How does the project deal with the conflict of the user uploading multiple instances of the same file?
Every file uploaded gets renamed, with a random generated number added to the name, therefore eliminating any possibility of naming conflict.

## Any conflict with folder naming?
Two folders with same names can exist due to difference in identification given to each one.

# Found bugs
### During the project I found several bugs (4) in several 3rd party services, which include Multer, Cloudinary and Node js. Here's a list of each one.

## [Multer bug](https://github.com/expressjs/multer/issues/562)
Setting limits property as a parameter when creating and initializing multer() does not work. According to multer docs, it's used to limit the file size and file name size, among other applicable limitations. However, when the file size or its name is over the limit, this parameter gets ignored and the file gets passed to another parameter (if set) and saved. I only used file size and file name size, so I do not know if this bug persists with other properties of the limit parameter, but I would assume so. Thus I developed my own solution in 'indexRouter.js' that revolves around async functions and a 3rd party solution that enables setTimeout in Nodejs ([connect-timeout](https://github.com/expressjs/timeout#readme)).

## [Node js bug](https://github.com/openclaw/openclaw/issues/2873)
<b>process.processTicksAndRejections</b> is a bug that occurs when a network fetsh fails with an unhandled promise rejection', according to the issue linked in the title. In this project, it occurs randomly with file uploads and only during that action. And I cannot predict it. There is no specified error whenever it gets logged and the file still gets successfully uploaded, displayed, downloaded and deleted. 

## [Cloudinary bug](https://support.cloudinary.com/hc/en-us/community/posts/360000340772-Large-upload-not-using-original-file-name-for-public-ID)
Context: </br>
This is a cloud storage service I tried after which I swapped to Supabase. When uploading a file, the middleware creates a 'public_id' using a local folder name and the name of the file being uploaded. This by default with no customization, results in a encrypted string which is unique to every file. The important fact about this public_id is that it is used to retrieve, edit, download and delete the file from the storage. The service allows doing the same set of actions using other ways. But using this id was the most consistent one for this project. Now I wanted the uploaded file to retain its original name (before the upload). I did not want the name of my file to be a random string of characters when downloaded. Cloudinary itself has no native download functionality which is a big let down. The only way (without a front end framework) to download the file would be with its public_id being its name. Thus this derives the need to modify its download name. In doing so, the service provides an option that should aid this request. When uploading the file, developer can customize public_id by using 3 options. 1) 'use_filename' - if set to 'true', it shapes public_id to be like 'file_hhjhsds' - still partly being made of random characters. 2) 'unique_filename' - when used together with 1) should result in public_id being entirely file's original name, like 'frog.png', but instead results in just 'file'. This creates a problem where if two files with the same name are uploaded, the later one overrides the initial one. Thus the third option comes along: 3) 'overwrite'- when set to 'false' prevents file overwriting. </br>

Bug: </br>
The three options above do not work at all. The closest I came to a file retaining its name is 'file' which prevents any other file being inputed due to having the same name. In the end, I could not provide a separate file name before downloading it - something Supabase does not just in browser (using 'a' html element) but in the server side as well (Node js) - but also while uploading it using the 3 options Cloudinary provides. Worst part is the developers don't seem to care, since the bug awareness was raised 8 years ago as of making this project.

# Demo photos

### Login page
![image](https://github.com/user-attachments/assets/2992328c-a1d5-492c-a02c-75083e2e7102)

### Home page with files
![image](https://github.com/user-attachments/assets/e1750deb-167e-45c2-a3d7-1e28e3b14b7a)

### Individual file info display page
![image](https://github.com/user-attachments/assets/e07835ef-334d-449e-9d2e-aa71338d39de)

### Share folder page
![image](https://github.com/user-attachments/assets/656ce32e-edbd-4f6f-871a-650ca07f9013)

### Generated link
![image](https://github.com/user-attachments/assets/1a3153ea-64e9-4f7e-803c-1ee03e4a78bc)

### Website when visited with the unexpired shared link
![image](https://github.com/user-attachments/assets/34781a6b-5f98-46eb-becf-2a5efce00e8d)
