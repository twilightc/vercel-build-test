import { prisma } from '@/lib';
import { redirect } from 'next/dist/client/components/navigation';
import { kv } from '@vercel/kv';
import dayjs from 'dayjs';
import { Metadata, ResolvingMetadata } from 'next';

// first, add use server to get data from potgresql
// second, return info including HEAD tag(html part)
export async function generateMetadata({
  params,
}: {
  params: { shortenedCode: string };
}): Promise<Metadata> {
  const shortenedCode = params.shortenedCode ?? '';

  const result = (await kv.get<string>(`${shortenedCode}`)) ?? '';

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

  return {
    title: urlOgInfo?.title,
    description:'can u see me?',
    openGraph: {
      url: urlOgInfo?.url,
      title: urlOgInfo?.title,
      siteName: urlOgInfo?.siteName,
      images: [{url:urlOgInfo?.image??''}],
      description: urlOgInfo?.description
    },
  };
  // if (result === '') {
  //   const getOriginalUrl = async () => {
  //     return await prisma.shortenedUrl.findFirst({
  //       where: {
  //         urlCode: shortenedCode,
  //       },
  //     });
  //   };
  //   const originalUrl = await getOriginalUrl();

  //   const urlOgInfo = await prisma.openGraphTag.findUnique({
  //     where: {
  //       tagId: originalUrl?.id ?? '',
  //     },
  //   });

  //   if (urlOgInfo) {
  //   }
  //   // await kv.set(`${shortenedCode}`, `${result?.originalUrl}`, {
  //   //   ex: 3600 * 6,
  //   // });

  //   console.log('fskalnalflak');
  //   console.log(urlOgInfo);

  //   return {
  //     title: urlOgInfo?.title,
  //     description:'can u see me?',
  //     openGraph: {
  //       url: urlOgInfo?.url,
  //       title: urlOgInfo?.title,
  //       siteName: urlOgInfo?.siteName,
  //       images: [{url:urlOgInfo?.image??''}],
  //       description: urlOgInfo?.description
  //     },
  //   };
  // } else {
  //   // get result from redis? is that need?

  //   return {
  //     title: '',
  //     openGraph: { },
  //   };
  // }
}
//

export default async function ShortUrl({
  params,
}: {
  params: { shortenedCode: string };
}) {
  const shortenedCode = params.shortenedCode ?? '';

  const result = (await kv.get<string>(`${shortenedCode}`)) ?? '';

  if (result !== '') {
    // redirect(`${result}`);

    return <>test</>;
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
      await kv.set(`${shortenedCode}`, `${result?.originalUrl}`, {
        ex: 3600 * 6,
      });
    }

    // redirect(result?.originalUrl ?? '/');

    return <>test</>;
  }
}
