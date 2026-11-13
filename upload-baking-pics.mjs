import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import { readFile, rename } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const R2_ACCOUNT_ID = 'f47d23c072e7b2f871ecca11e36e0b25'
const R2_ACCESS_KEY_ID = '27705569e86519ea0f886e8714cc2fb8'
const R2_SECRET_ACCESS_KEY = '66d7dca19b0ed76fe9be31f60bd881675c93c38c54b5d98fd436723c1ae5bc62'
const R2_BUCKET_NAME = 'bucket-chartedconsultants'
const R2_PUBLIC_URL = 'https://assets.chartedconsultants.com'

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

const prisma = new PrismaClient()
const srcDir = path.join(__dirname, '.resources/Baking pics')

// Original filename → descriptive name mapping
const RENAMES = [
  ['image_2026-05-02_225633166.png',       'custard-tart.png'],
  ['image_2026-05-02_225656091 (1).png',   'tiramisu.png'],
  ['image_2026-05-02_225719871 (1).png',   'pear-frangipane-tart.png'],
  ['image_2026-05-02_225803677.png',       'celebration-cupcakes.png'],
  ['image_2026-05-02_225844488.png',       'apple-cream-tart.png'],
  ['image_2026-05-02_225859901.png',       'sponge-cakes-oven.png'],
  ['image_2026-05-02_225934612.png',       'mango-lime-entremet.png'],
  ['image_2026-05-02_230103592.png',       'apricot-plum-cake.png'],
  ['image_2026-05-02_230335895.png',       'chocolate-raspberry-swiss-roll.png'],
  ['image_2026-05-02_230354595.png',       'communion-cake.png'],
  ['image_2026-05-02_230412571.png',       'creme-brulee.png'],
  ['image_2026-05-02_230541656.png',       'strawberry-tart.png'],
  ['image_2026-05-02_230645474.png',       'pear-almond-tart.png'],
  ['image_2026-05-02_230706320.png',       'number-cake.png'],
  ['image_2026-05-02_230726132.png',       'paris-brest.png'],
  ['image_2026-05-02_230847956.png',       'sourdough.png'],
  ['image_2026-05-02_230938264.png',       'carrot-cake.png'],
]

async function main() {
  console.log('Renaming and uploading baking photos...\n')

  for (const [original, newName] of RENAMES) {
    const oldPath = path.join(srcDir, original)
    const newPath = path.join(srcDir, newName)

    // Rename locally
    await rename(oldPath, newPath)
    console.log(`  renamed: ${original} → ${newName}`)

    // Read file
    const buffer = await readFile(newPath)
    const ext = path.extname(newName).toLowerCase()
    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'

    // Upload to R2
    const key = `uploads/baking/${newName}`
    await r2.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }))

    const url = `${R2_PUBLIC_URL}/${key}`

    // Register in DB
    await prisma.mediaItem.create({
      data: {
        filename: key,
        originalName: newName,
        filePath: url,
        fileType: 'image',
        fileSize: buffer.length,
        altText: newName.replace(/-/g, ' ').replace('.png', '').replace('.jpg', ''),
        tags: 'gallery',
      },
    })

    console.log(`  uploaded: ${url}\n`)
  }

  console.log('All done.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
