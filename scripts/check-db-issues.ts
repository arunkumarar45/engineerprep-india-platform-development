import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check lab manuals
  const labManuals = await prisma.resource.findMany({
    where: { resourceType: 'LAB_MANUAL' },
    select: { id: true, title: true, fileUrl: true, subjectCode: true }
  });
  console.log('=== LAB MANUALS ===');
  console.log(JSON.stringify(labManuals, null, 2));
  console.log('Total:', labManuals.length);

  // Check BCS703 syllabus
  const bcs703 = await prisma.resource.findMany({
    where: { resourceType: 'SYLLABUS', subjectCode: 'BCS703' },
    select: { id: true, title: true, fileUrl: true, subjectCode: true }
  });
  console.log('\n=== BCS703 SYLLABUS ===');
  console.log(JSON.stringify(bcs703, null, 2));

  // Check question papers with drive links
  const qpDriveLinks = await prisma.resource.findMany({
    where: { resourceType: 'QUESTION_PAPER', fileUrl: { contains: 'drive.google.com' } },
    select: { id: true, title: true, fileUrl: true },
    take: 10
  });
  console.log('\n=== QP DRIVE LINKS (sample 10) ===');
  console.log(JSON.stringify(qpDriveLinks, null, 2));
  
  const qpDriveCount = await prisma.resource.count({
    where: { resourceType: 'QUESTION_PAPER', fileUrl: { contains: 'drive.google.com' } }
  });
  console.log('Total QPs with drive links:', qpDriveCount);

  // Check DSA sheets thumbnail URLs
  const sheets = await prisma.dSASheet.findMany({
    select: { id: true, title: true, thumbnailUrl: true }
  });
  console.log('\n=== DSA SHEETS ===');
  console.log(JSON.stringify(sheets, null, 2));

  // Check DSA playlists thumbnail URLs
  const playlists = await prisma.dSAPlaylist.findMany({
    select: { id: true, title: true, thumbnailUrl: true }
  });
  console.log('\n=== DSA PLAYLISTS ===');
  console.log(JSON.stringify(playlists, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => { await prisma.$disconnect(); });

