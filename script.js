const prisma = require('./lib/prisma.js');

// const { file } = require("./lib/prisma");

async function main() {
  console.log('main func');
  await prisma.file.deleteMany();
  // await prisma.folder.deleteMany();
  const allFiles = await prisma.file.findMany();
  console.log('allFiles:');
  console.log(allFiles);

  const allFolders = await prisma.folder.findMany();
  console.log('allFolders:');
  console.log(allFolders);

  // await prisma.user.deleteMany();
  const allUsers = await prisma.user.findMany();
  console.log('allUsers:');
  console.log(allUsers);
  // Create a new user with a post
//   const user = await prisma.user.create({
//     data: {
//       name: 'Alice',
//       email: 'alice@prisma.io',
//       posts: {
//         create: {
//           title: 'Hello World',
//           content: 'This is my first post!',
//           published: true,
//         },
//       },
//     },
//     include: {
//       posts: true,
//     },
//   })
//   console.log('Created user:', user)

  // Fetch all users with their posts
//   const allUsers = await prisma.user.findMany({
//     include: {
//       posts: true,
//     },
//   })
//   console.log('All users:', JSON.stringify(allUsers, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
// const { format } = require('date-fns');
// console.log(format(new Date(), 'MMMM dd, yyyy'));
// console.log(format(new Date(), 'MMMM dd, yyyy, hh:mm a'));
// const size = 2656305;
// const fileSize = size / 1048576;
// console.log(fileSize);
// const newVar = fileSize.toFixed(2);
// console.log(newVar);