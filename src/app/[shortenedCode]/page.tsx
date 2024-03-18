'use server'
import { prisma } from '@/lib';
import { redirect } from 'next/dist/client/components/navigation';
import { kv } from '@vercel/kv';
import dayjs from 'dayjs';
import { Metadata, ResolvingMetadata } from 'next';
import { error } from 'console';

const getUrlInfoByShortenCode = async (code: string) => kv.get<{
  originalUrl: string;
  id: string;
}>(`${code}`);


export async function generateMetadata({
  params,

}: {
  params: { shortenedCode: string };
}): Promise<Metadata> {
  const shortenedCode = params.shortenedCode ?? '';


  const urlFromKv = await kv.get<{
    originalUrl: string;
    id: string;
  }>(`${shortenedCode}`);

  if (!urlFromKv || urlFromKv?.originalUrl === '') {
    const getOriginalUrl = async () => {
      return await prisma.shortenedUrl.findFirst({
        where: {
          urlCode: shortenedCode,
        },
      });
    };
    const originalUrl = await getOriginalUrl();

    const urlOgInfo = await prisma.openGraphTag.findUnique({
      where: {
        tagId: originalUrl?.id ?? '',
      },
    });

    if (urlOgInfo) {
    }
    return {
      title: urlOgInfo?.title,
      description: 'can u see me?',
      openGraph: {
        url: urlOgInfo?.url,
        title: urlOgInfo?.title,
        siteName: urlOgInfo?.siteName,
        images: [{ url: urlOgInfo?.image ?? '' }],
        description: urlOgInfo?.description,
      },
    };
  } else {
    const ogFromKv = await kv.get<{
      id: string;
      url: string;
      title: string;
      description: string;
      image: string;
      siteName: string;
      tagId: string;
    }>(urlFromKv.id);

    return {
      title: ogFromKv?.title,
      description: 'can u see me?',
      openGraph: {
        url: ogFromKv?.url,
        title: ogFromKv?.title,
        siteName: ogFromKv?.siteName,
        images: [{ url: ogFromKv?.image ?? '' }],
        description: ogFromKv?.description,
      },
    };
  }
}

export default async function ShortUrl({
  params,
}: {
  params: { shortenedCode: string };
}) {
  const shortenedCode = params.shortenedCode ?? '';

  const result = await getUrlInfoByShortenCode(shortenedCode);

  if (result && result.originalUrl !== '') {
    redirect(result?.originalUrl ?? '/');
  } else {
    const getOriginalUrl = async () => {
      return await prisma.shortenedUrl.findFirst({
        where: {
          urlCode: shortenedCode,
        },
      });
    };
    const result = await getOriginalUrl();

    if (dayjs(new Date()).isAfter(result?.expireDate)) {
      // this shorturl has expired, redirect to another 404 page and provide link for user to
      // produce new shorturl again.
      // redirect('404 page link');
    }

    if (result?.originalUrl) {
      try {
        const urlOgInfo = await prisma.openGraphTag.findUnique({
          where: {
            tagId: result?.id ?? '',
          },
        });

        // due to distributed serverless service, kv doesn't provide watch method to guarantee atomicity
        await kv
          .multi()
          .set(
            `${shortenedCode}`,
            {
              originalUrl: result.originalUrl,
              id: result.id,
            },
            {
              ex: 3600 * 6,
            }
          )
          .set(
            `${result.id}`,
            {
              ...urlOgInfo,
            },
            {
              ex: 3600 * 6,
            }
          )
          .exec()
      } catch (error) {
        console.log('error occured during save to kv');
      }
    }


    redirect(result?.originalUrl ?? '/');
  }
}
