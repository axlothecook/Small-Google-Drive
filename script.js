const prisma = require('./lib/prisma.js');

async function main() {
  console.log('main func');
  // await prisma.file.deleteMany();
  // const allFiles = await prisma.file.findMany();
  // console.log('allFiles:');
  // console.log(allFiles);

  // await prisma.folder.deleteMany();
  const allFolders = await prisma.folder.findMany();
  console.log('allFolders:');
  console.log(allFolders);

  await prisma.user.deleteMany();
  const allUsers = await prisma.user.findMany();
  console.log('allUsers:');
  console.log(allUsers);
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