import { redirect } from 'next/navigation';

export default async function AuthLoginRedirect({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const queryString = params ? new URLSearchParams(params as any).toString() : '';
  redirect(`/login${queryString ? `?${queryString}` : ''}`);
}
