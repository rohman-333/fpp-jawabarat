import { redirect } from 'next/navigation';

export default function DashboardMessagesRedirect() {
  redirect('/messages');
}
