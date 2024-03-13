import { prisma } from '@/lib';
import { redirect } from 'next/dist/client/components/navigation';
import { kv } from '@vercel/kv';

export default async function ShortUrl({
  params,
}: {
  params: { shortenedCode: string };
}) {
  const shortenedCode = params.shortenedCode ?? '';

  // console.log((await kv.get<string>(shortenedCode)));

  // const getOriginalUrl = async () => {
  //   return await prisma.shortenedUrl.findUnique({
  //     where: {
  //       urlCode: shortenedCode,
  //     },
  //   });
  // };
  // const result = await getOriginalUrl();

  // redirect(result?.originalUrl ?? '/');

  const result = (await kv.get<string>(`${shortenedCode}`)) ?? '';
  if (result !== '') {
    // redisClient.disconnect();
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

    if (result?.originalUrl) {
      console.log(shortenedCode);

      await kv.set(`${shortenedCode}`, `${result?.originalUrl}`, {
        ex: 3600 * 6,
      });
      // await redisClient.set(`${shortenedCode}`, `${result?.originalUrl}`, {
      //   EX: 3600 * 6,
      // });

      console.log((await kv.get<string>(shortenedCode)));

    }

    // redisClient.disconnect();
    redirect(result?.originalUrl ?? '/');
  }

  // const redisClient = await createClient({
  //   url: process.env.PRODUCTS_REST_API_URL ?? '',
  //   token: '',
  // })
  // // const redisClient = await createClient({ url: process.env.KV_URL })
  // //   .on('error', (err) => console.log('Redis Client Error', err))
  // //   .connect();

  // const shortenedCode = params.shortenedCode ?? '';

  // console.log(shortenedCode);

  // console.log((await redisClient.get<string>(shortenedCode)));


  // const result = (await redisClient.get<string>(`${shortenedCode}`)) ?? '';
  // if (result !== '') {
  //   // redisClient.disconnect();
  //   redirect(`${result}`);
  // } else {
  //   const getOriginalUrl = async () => {
  //     return await prisma.shortenedUrl.findUnique({
  //       where: {
  //         urlCode: shortenedCode,
  //       },
  //     });
  //   };
  //   const result = await getOriginalUrl();

  //   if (result?.originalUrl) {
  //     await redisClient.set(`${shortenedCode}`, `${result?.originalUrl}`, {
  //       ex: 3600 * 6,
  //     });
  //     // await redisClient.set(`${shortenedCode}`, `${result?.originalUrl}`, {
  //     //   EX: 3600 * 6,
  //     // });
  //   }

  //   // redisClient.disconnect();
  //   redirect(result?.originalUrl ?? '/');
  // }
}
