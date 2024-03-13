import { prisma } from '@/lib';
import { redirect } from 'next/dist/client/components/navigation';
import { kv } from '@vercel/kv';
import dayjs from 'dayjs';

export default async function ShortUrl({
  params,
}: {
  params: { shortenedCode: string };
}) {
  const shortenedCode = params.shortenedCode ?? '';

  const result = (await kv.get<string>(`${shortenedCode}`)) ?? '';
  if (result !== '') {
    redirect(`${result}`);
  } else {
    const getOriginalUrl = async () => {
      return await prisma.shortenedUrl.findUnique({
        where: {
          urlCode: shortenedCode,
        },
      });
    };
    const result = await getOriginalUrl();

    if(dayjs(new Date()).isAfter(result?.expireDate)){
      // this shorturl has expired, redirect to another 404 page and provide link for user to
      // produce new shorturl again.

      // redirect('404 page link');
    }

    if (result?.originalUrl) {
      await kv.set(`${shortenedCode}`, `${result?.originalUrl}`, {
        ex: 3600 * 6,
      });
    }

    redirect(result?.originalUrl ?? '/');
  }

}
