import dayjs from 'dayjs';
import { generateShortUrl, prisma } from '@/lib';
import { isWebUri } from 'valid-url';
import { NextRequest } from 'next/server';
import run from 'open-graph-scraper';

export const POST = async (req: NextRequest) => {
  console.log('test git emoji');


  if (req.method !== 'POST') {
    return Response.json('only permit POST method', { status: 405 });
  }

  const { originUrl: url } = (await req.json()) as { originUrl: string };

  if (!isWebUri(url)) {
    return Response.json('incorrect format', { status: 400 });
  }

  const host = req.headers.get('host') ?? '';

  const { shortUrlCode, fullShortenUrl } = generateShortUrl(host);

  // if url has existed then return it, or create a new one
  try {

    const result = await prisma.$transaction(async (tx) => {
      const existedUrl = await tx.shortenedUrl.findFirst({
        where: {
          originalUrl: url,
        },
      });

      if (existedUrl) {
        const existedUrlWithOgInfo = await tx.openGraphTag.findFirst({
          where: {
            tagId: existedUrl.id,
          },
        });

        return {
          ...existedUrl,
          ogInfo: {
            url: existedUrlWithOgInfo?.url || '',
            title: existedUrlWithOgInfo?.title || '',
            siteName: existedUrlWithOgInfo?.siteName || '',
            image: existedUrlWithOgInfo?.image || '',
            description: existedUrlWithOgInfo?.description || '',
          },
        };
      }

      const shortUrl = await tx.shortenedUrl.create({
        data: {
          shortenedUrl: fullShortenUrl,
          urlCode: shortUrlCode,
          originalUrl: url,
          createDate: new Date(),
          expireDate: dayjs(new Date()).add(1, 'd').toDate(),
        },
      });

      // https://github.com/jshemas/openGraphScraper/issues/215
      // may downgrade to avoid the issue
      const { result: ogData } = await run({
        url: shortUrl.originalUrl,
      });

      if (ogData?.ogTitle) {
        const ogMeta = await tx.openGraphTag.create({
          data: {
            url: ogData?.ogUrl ?? '',
            title: ogData?.ogTitle ?? '',
            siteName: ogData?.ogSiteName ?? '',
            description: ogData?.ogDescription ?? '',
            image: (ogData?.ogImage ?? [])[0].url,
            shortenedUrl: {
              connect: {
                id: shortUrl.id,
              },
            },
          },
        });

        return {
          ...shortUrl,
          ogInfo: {
            url: ogMeta.url,
            siteName: ogMeta.siteName,
            title: ogMeta.title,
            image: ogMeta.image,
            description: ogMeta.description,
          },
        };
      }

      return {
        shortUrl,
      };
    });

    return Response.json(result, {
      status: 200,
    });
  } catch (error) {
    return Response.json(
      'error occured during transaction, operation has been rolled back',
      { status: 500 }
    );
  }
};
